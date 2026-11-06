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
  // The profile lock serializes concurrent personnel actions. Release only unfinished
  // tasker assignments; completed/delivered orders and all historical reviews remain intact.
  const result = await prisma.$transaction(async (tx) => {
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
  const id = String(form.get("employeeId") ?? "");
  const confirmation = String(form.get("confirmation") ?? "");
  if (confirmation !== "DELETE") throw new Error("Confirmation required");
  const employee = await prisma.employeeProfile.findUnique({where:{id}});
  if (!employee || employee.id === actor.id || employee.role === "SUPER_ADMIN" || employee.status === "DELETED") throw new Error("Protected account");
  // Preserve task ownership, submissions, reviews and financial audit records.
  // Revoke sign-in by deleting Auth user, archive and anonymize the profile.
  const result = await adminAuth().auth.admin.deleteUser(employee.authUserId);
  if (result.error) throw new Error("Unable to revoke Auth account: " + result.error.message);
  await prisma.$transaction(async tx => {
    await tx.employeeCategory.deleteMany({where:{employeeId:id}});
    await tx.employeeProfile.update({where:{id},data:{
      status:"DELETED", suspensionUntil:null, fullName:"Deleted employee",
      email:`deleted-${id}@invalid.example`, department:null,
    }});
  });
  refresh();
}
