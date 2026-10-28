"use server";
import { createEmployee, type CreateEmployeeState } from "@/app/portal/super-admin/employees/create-actions";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
export type HireState={error:string;employeeId:string;temporaryPassword:string};
export async function hireApplicant(_previous:HireState, form:FormData):Promise<HireState>{
 try {
  const auth=await requireEmployee(["SUPER_ADMIN"]);
  const manager=await prisma.employeeProfile.findUnique({where:{authUserId:auth.id},select:{id:true,role:true,status:true}});
  if(!manager||manager.role!=="SUPER_ADMIN"||manager.status!=="ACTIVE")return {error:"Access denied.",employeeId:"",temporaryPassword:""};
  const id=String(form.get("applicationId")??"");const role=String(form.get("role")??"TASKER");
  if(!["TASKER","REVIEWER","QA","ADMIN"].includes(role))return {error:"Invalid employee role.",employeeId:"",temporaryPassword:""};
  const application=await prisma.jobApplication.findUnique({where:{id},select:{id:true,name:true,email:true,role:true,status:true}});
  if(!application||application.status!=="SHORTLISTED")return {error:"Only shortlisted applications may be hired.",employeeId:"",temporaryPassword:""};
  const f=new FormData();f.set("fullName",application.name);f.set("email",application.email);f.set("role",role);f.set("department",application.role);
  if(form.get("emailVerified")==="yes")f.set("emailVerified","yes");
  for(const cat of form.getAll("categoryIds")) f.append("categoryIds",String(cat));
  const result:CreateEmployeeState=await createEmployee({error:"",employeeId:"",temporaryPassword:""},f);
  if(result.error)return result;
  // Only mark hired after the existing employee-creation flow succeeds.
  await prisma.jobApplication.update({where:{id},data:{status:"HIRED"}});
  const newProfile=await prisma.employeeProfile.findUnique({where:{email:application.email},select:{id:true}});
  if(newProfile)await prisma.portalNotification.create({data:{recipientId:manager.id,title:"Employee hired",body:`${application.name} was hired from Recruitment.`,href:"/portal/super-admin/employees"}});
  revalidatePath("/portal/super-admin/recruitment");revalidatePath("/portal/admin/recruitment");
  return result;
 }catch(err){console.error("Hire application error",err);return {error:"Hiring encountered an error. Check Supabase Auth and employee records before retrying.",employeeId:"",temporaryPassword:""};}
}
