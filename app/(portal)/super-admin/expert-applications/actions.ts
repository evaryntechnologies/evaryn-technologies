"use server";
import {revalidatePath} from "next/cache";
import {createClient as createAdminClient} from "@supabase/supabase-js";
import {requireEmployee} from "@/lib/auth/require-employee";
import {prisma} from "@/lib/db/prisma";

export async function decideExpert(form:FormData){
 const admin=await requireEmployee(["SUPER_ADMIN"]);
 if(admin.role!=="SUPER_ADMIN")throw new Error("Forbidden");
 const id=String(form.get("id")??"");
 const decision=String(form.get("decision")??"");
 const reason=String(form.get("reason")??"").trim().slice(0,1000);
 const role=String(form.get("role")??"");
 if(!["APPROVE","REJECT","WAITLIST"].includes(decision))throw new Error("Invalid action");
 if(decision==="APPROVE"&&!(["TASKER","REVIEWER","QA"] as string[]).includes(role))throw new Error("Invalid role");
 if(decision==="REJECT"&&!reason)throw new Error("A rejection reason is required");
 const application=await prisma.expertApplication.findUnique({where:{id}});
 if(!application||!["PENDING","UNDER_REVIEW","WAITLISTED"].includes(application.status))throw new Error("Application already decided or unavailable");
 if(decision!=="APPROVE"){
   await prisma.expertApplication.updateMany({where:{id,status:{in:["PENDING","UNDER_REVIEW","WAITLISTED"]}},data:{status:decision==="REJECT"?"REJECTED":"WAITLISTED",reviewedById:admin.id,reviewedAt:new Date(),decisionReason:reason||null}});
   revalidatePath("/super-admin/expert-applications");return;
 }
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 if(!key||!url)throw new Error("Server authentication credentials are not configured");
 const supabase=createAdminClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
 const {data:{user},error}=await supabase.auth.admin.getUserById(application.authUserId);
 if(error||!user||!user.email_confirmed_at||user.email?.toLowerCase()!==application.email.toLowerCase())throw new Error("Verified expert identity not found");
 if(user.app_metadata?.role)throw new Error("Account already has an assigned role");
 const other=await prisma.employeeProfile.findFirst({where:{OR:[{authUserId:user.id},{email:application.email}]},select:{id:true}});
 if(other)throw new Error("Employee account already exists. Review manually.");
 // Inactive profile is a safety barrier if the auth role update fails.
 const employee=await prisma.employeeProfile.create({data:{authUserId:user.id,email:application.email,fullName:application.fullName,role,status:"PENDING"}});
 const {error:assignError}=await supabase.auth.admin.updateUserById(user.id,{app_metadata:{...user.app_metadata,role}});
 if(assignError)throw new Error("Role assignment failed; employee remains inactive. Reconcile manually before retrying.");
 await prisma.employeeProfile.update({where:{id:employee.id},data:{status:"ACTIVE"}});
 await prisma.expertApplication.update({where:{id},data:{status:"APPROVED",reviewedById:admin.id,reviewedAt:new Date(),decisionReason:reason||null}});
 revalidatePath("/super-admin/expert-applications");
}

// Server actions used with useActionState return validation errors instead of
// producing unhandled production exceptions. Existing decision logic remains authoritative.
export async function decideExpertWithFeedback(_previous: { error: string }, form: FormData): Promise<{ error: string }> {
  try {
    await decideExpert(form);
    return { error: "" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update the application.";
    // Avoid leaking database internals or secrets to browsers.
    if (/rejection reason|invalid action|invalid role|already decided|unavailable|forbidden/i.test(message)) {
      return { error: message };
    }
    console.error("Expert application decision failed", error);
    return { error: "Could not save this decision. Please retry or contact the administrator." };
  }
}
