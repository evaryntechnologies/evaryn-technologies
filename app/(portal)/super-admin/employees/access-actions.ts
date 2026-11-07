"use server";

import { revalidatePath } from "next/cache";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";

const allowedRoles = new Set(["TASKER", "REVIEWER", "QA", "ADMIN"]);

async function authorizedSuperAdmin() {
  const actor = await requireEmployee(["SUPER_ADMIN"]);
  const profile = await prisma.employeeProfile.findUnique({
    where: { authUserId: actor.id }, select: { id: true, role: true, status: true },
  });
  if (!profile || profile.role !== "SUPER_ADMIN" || profile.status !== "ACTIVE") throw new Error("Forbidden");
  return profile;
}

function adminAuth() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase Admin is not configured");
  return createAdminClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function refresh() {
  revalidatePath("/portal/super-admin/employees");
  revalidatePath("/portal/admin/employees");
  revalidatePath("/portal/super-admin");
}

export async function changeEmployeeRole(form: FormData): Promise<void> {
  const actor = await authorizedSuperAdmin();
  const id = String(form.get("employeeId") ?? "");
  const role = String(form.get("role") ?? "");
  if (!allowedRoles.has(role)) throw new Error("Unsupported role");
  const employee = await prisma.employeeProfile.findUnique({where:{id}});
  if (!employee || employee.id === actor.id || employee.role === "SUPER_ADMIN" || employee.status === "DELETED") throw new Error("This account cannot be changed");
  const sb = adminAuth();
  const { data, error } = await sb.auth.admin.getUserById(employee.authUserId);
  if (error || !data.user) throw new Error("Auth account not found");
  const former = data.user.app_metadata ?? {};
  const updated = await sb.auth.admin.updateUserById(employee.authUserId, {
    app_metadata: {...former, role},
  });
  if (updated.error) throw new Error("Could not update employee access");
  try {
    await prisma.$transaction(async tx => {
      await tx.employeeProfile.update({where:{id},data:{role}});
      if (role === "ADMIN") await tx.employeeCategory.deleteMany({where:{employeeId:id}});
    });
  } catch (e) {
    // Restore previous Auth role if database update fails; error remains visible in logs.
    const rollback = await sb.auth.admin.updateUserById(employee.authUserId,{app_metadata:former});
    if (rollback.error) console.error("ROLE ROLLBACK FAILED", employee.authUserId, rollback.error.message);
    throw e;
  }
  refresh();
}

export async function changeEmployeeStatus(form: FormData): Promise<void> {
  const actor = await authorizedSuperAdmin();
  const id = String(form.get("employeeId") ?? "");
  const action = String(form.get("action") ?? "");
  const reason = String(form.get("reason") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid employee reference");
  if (!["temporary", "permanent", "reinstate"].includes(action)) throw new Error("Unknown action");
  if (reason.length < 10 || reason.length > 1000) throw new Error("Provide a written reason (10–1000 characters)");
  const value = String(form.get("until") ?? "");
  const until = action === "temporary" ? new Date(value) : null;
  if (action === "temporary" && (!value || !until || !Number.isFinite(until.getTime()) || until.getTime() <= Date.now())) {
    throw new Error("Choose a future suspension review date");
  }
  // Ban sign-ins in Supabase Auth as well as disabling every portal request.
  // A database status check alone does not revoke the Auth login.
  const target = await prisma.employeeProfile.findUnique({where:{id},select:{id:true,role:true,status:true,authUserId:true}});
  if(!target || target.id===actor.id || target.role==="SUPER_ADMIN" || target.status==="DELETED") throw new Error("Protected account");
  const sb=adminAuth();
  const ban=await sb.auth.admin.updateUserById(target.authUserId,{ban_duration:action==="reinstate"?"none":"876000h"});
  if(ban.error) throw new Error("Unable to update Auth login restriction: "+ban.error.message);
  // The profile lock serializes concurrent personnel actions. Release only unfinished
  // tasker assignments; completed/delivered orders and all historical reviews remain intact.
  let result: {released:number;status:string};
  try {
  result = await prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<Array<{id:string;role:string;status:string;fullName:string}>>`
      SELECT id,role,status,"fullName" FROM public."EmployeeProfile" WHERE id=${id}::uuid FOR UPDATE`;
    const employee = locked[0];
    if (!employee || employee.id === actor.id || employee.role === "SUPER_ADMIN" || employee.status === "DELETED") throw new Error("Protected account");
    if (action === "reinstate" && !["SUSPENDED", "TERMINATED"].includes(employee.status)) throw new Error("Employee is not suspended or terminated");
    const status = action === "reinstate" ? "ACTIVE" : action === "temporary" ? "SUSPENDED" : "TERMINATED";
    if (action !== "reinstate" && employee.status === "TERMINATED") throw new Error("Reactivate a terminated account before making other changes");
    await tx.employeeProfile.update({where:{id},data:{status,suspensionUntil:action === "temporary" ? until : null}});
    let released = 0;
    if (action !== "reinstate") {
      const tasks = await tx.workTask.findMany({
        where:{assignedToId:id,status:{in:["ASSIGNED","REWORK_REQUIRED","PENDING_REVIEW","REVIEW_IN_PROGRESS","PENDING_QA","QA_IN_PROGRESS"]}},
        select:{id:true,publicTaskId:true},
      });
      if (tasks.length) {
        const result = await tx.workTask.updateMany({
          where:{id:{in:tasks.map(t=>t.id)},assignedToId:id,status:{in:["ASSIGNED","REWORK_REQUIRED","PENDING_REVIEW","REVIEW_IN_PROGRESS","PENDING_QA","QA_IN_PROGRESS"]}},
          data:{assignedToId:null,status:"OPEN",deadline:null,reviewDeadline:null,qaDeadline:null,claimedReviewerId:null,claimedQaId:null},
        });
        if(result.count!==tasks.length) throw new Error("Task assignments changed during suspension; retry");
        released=result.count;
      }
      // Claims made in a separate Reviewer or QA role should not hold up the queues.
      await tx.workTask.updateMany({where:{claimedReviewerId:id,status:"PENDING_REVIEW"},data:{claimedReviewerId:null}});
      await tx.workTask.updateMany({where:{claimedQaId:id,status:"PENDING_QA"},data:{claimedQaId:null}});
    }
    await tx.portalNotification.create({data:{recipientId:id,title:status==="ACTIVE"?"Account reactivated":status==="SUSPENDED"?"Account suspended":"Employment access terminated",body:`${reason} ${released ? `${released} unfinished assignment(s) returned to the Task Hub.` : ""}`.trim(),href:"/portal/notifications"}});
    await tx.portalNotification.create({data:{recipientId:actor.id,title:`Employee ${status.toLowerCase()}: ${employee.fullName}`,body:`Reason: ${reason}. Unfinished task assignments released: ${released}.`,href:"/portal/super-admin/employees"}});
    return {released,status};
  });
  } catch (error) {
    const rollback=await sb.auth.admin.updateUserById(target.authUserId,{ban_duration:target.status==="ACTIVE"?"none":"876000h"});
    if(rollback.error) console.error("Employee Auth access rollback failed",rollback.error.message);
    throw error;
  }
  refresh();
  revalidatePath("/portal/task-hub");
  revalidatePath("/portal/tasker");
  revalidatePath("/portal/reviewer/queue");
  revalidatePath("/portal/qa/queue");
  revalidatePath("/portal/admin/task-management");
  revalidatePath("/portal/super-admin/payroll/pay-team");
  console.info("Employee access changed",{employeeId:id,action,released:result.released});
}

export async function deleteEmployeeAccount(form: FormData): Promise<void> {
  const actor = await authorizedSuperAdmin();
  const id=String(form.get("employeeId")??"");
  const confirmation=String(form.get("confirmation")??"");
  if(confirmation!=="DELETE") throw new Error("Type DELETE to confirm.");
  if(!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Invalid employee reference.");
  const employee=await prisma.employeeProfile.findUnique({where:{id}});
  if(!employee || employee.id===actor.id || employee.role==="SUPER_ADMIN" || employee.status==="DELETED") throw new Error("Protected employee account.");
  const sb=adminAuth();
  const banned=await sb.auth.admin.updateUserById(employee.authUserId,{ban_duration:"876000h"});
  if(banned.error) throw new Error("Could not disable employee sign-in: "+banned.error.message);
  // Mark inactive FIRST, release unfinished work, anonymize personal details and
  // delete nonfinancial category assignments. Historical work/pay records retain
  // their foreign-key links so the order register and payroll audits remain correct.
  await prisma.$transaction(async tx=>{
    await tx.workTask.updateMany({where:{assignedToId:id,status:{in:["ASSIGNED","REWORK_REQUIRED","PENDING_REVIEW","REVIEW_IN_PROGRESS","PENDING_QA","QA_IN_PROGRESS"]}},data:{assignedToId:null,status:"OPEN",deadline:null,reviewDeadline:null,qaDeadline:null,claimedReviewerId:null,claimedQaId:null}});
    await tx.workTask.updateMany({where:{claimedReviewerId:id},data:{claimedReviewerId:null}});
    await tx.workTask.updateMany({where:{claimedQaId:id},data:{claimedQaId:null}});
    await tx.employeeCategory.deleteMany({where:{employeeId:id}});
    await tx.employeeProfile.update({where:{id},data:{status:"DELETED",suspensionUntil:null,fullName:"Deleted employee",email:`deleted-${id}@invalid.example`,department:null}});
  });
  // Supabase Auth may have other FK dependents. Never turn a failed hard-delete
  // into an unhandled server error or claim all records were erased.
  const removed=await sb.auth.admin.deleteUser(employee.authUserId);
  if(removed.error) {
    console.error("Employee Auth delete blocked; profile remains deleted and login remains banned",removed.error.message);
  }
  refresh();
}

export async function deleteEmployeeAccountSafe(_previous:{message:string;ok:boolean},form:FormData):Promise<{message:string;ok:boolean}>{
  try {
    await deleteEmployeeAccount(form);
    return {ok:true,message:"Employee access revoked and profile anonymized. Linked payroll, orders and audit records are retained."};
  }catch(error){
    console.error("Employee deletion failed",error);
    return {ok:false,message:error instanceof Error?error.message:"Unable to delete employee account."};
  }
}

export async function changeEmployeeStatusSafe(_previous:{message:string;ok:boolean},form:FormData):Promise<{message:string;ok:boolean}>{
  try {
    await changeEmployeeStatus(form);
    return {ok:true,message:"Employee access updated successfully."};
  }catch(error){
    console.error("Employee status update failed",error);
    return {ok:false,message:error instanceof Error?error.message:"Unable to change employee status."};
  }
}
