"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@supabase/supabase-js";

export type EditResult = { success: boolean; message: string };
const validId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const editableStates = ["DRAFT","OPEN","ASSIGNED","CLAIMED","IN_PROGRESS"];

export async function updateOrderDetails(form: FormData): Promise<EditResult> {
  const auth = await requireEmployee(["ADMIN", "SUPER_ADMIN"]);
  const manager = await prisma.employeeProfile.findUnique({where:{authUserId:auth.id},select:{role:true,status:true,id:true}});
  if(!manager || manager.status!=="ACTIVE" || !["ADMIN","SUPER_ADMIN"].includes(manager.role)) return {success:false,message:"Administrator access required."};
  const taskId = String(form.get("taskId")??"");
  if(!validId.test(taskId)) return {success:false,message:"Invalid order."};
  const title=String(form.get("title")??"").trim();
  const description=String(form.get("description")??"").trim();
  const instructions=String(form.get("instructions")??"").trim();
  const priority=String(form.get("priority")??"");
  if(title.length<3||title.length>160||description.length<10||description.length>10000||instructions.length>10000||!["LOW","NORMAL","HIGH","URGENT"].includes(priority)) return {success:false,message:"Check the title, details, instructions and priority."};
  const task=await prisma.workTask.findUnique({where:{id:taskId},select:{status:true,assignedToId:true,deadline:true,reviewDeadline:true,qaDeadline:true,submissionHours:true,reviewHours:true,qaHours:true,_count:{select:{submissions:true}}}});
  if(!task || !editableStates.includes(task.status) || task._count.submissions>0) return {success:false,message:"Only orders that have not been submitted can be edited."};
  // Keep the current deadlines unchanged unless new positive durations are supplied.
  const parseHours=(name:string,old:number|null)=>{
    const raw=String(form.get(name)??"").trim();
    if(!raw) return old;
    const n=Number(raw); if(!Number.isFinite(n)||n<=0||n>8760) throw new Error("Enter valid deadline hours (1–8760). ");
    return n;
  };
  let submissionHours:number|null,reviewHours:number|null,qaHours:number|null;
  try {
    submissionHours=parseHours("submissionHours",task.submissionHours);
    reviewHours=parseHours("reviewHours",task.reviewHours);
    qaHours=parseHours("qaHours",task.qaHours);
  } catch {return {success:false,message:"Invalid deadline hours."};}
  if([submissionHours,reviewHours,qaHours].every(v=>v!==null) && !(submissionHours!<=reviewHours! && reviewHours!<=qaHours!)) return {success:false,message:"Deadline stages must be chronological."};
  // Only recompute deadlines when a new duration is explicitly provided and the order is already assigned.
  const now=Date.now();
  const due=(field:string,h:number|null,prior:Date|null)=>String(form.get(field)??"").trim() && task.assignedToId && h ? new Date(now+h*3600000) : prior;
  const file=form.get("attachment");
  let uploaded:{storageKey:string;fileName:string;contentType:string}|null=null;
  let client:ReturnType<typeof createClient>|null=null;
  if(file instanceof File && file.size>0){
    if(file.size>10*1024*1024) return {success:false,message:"Attachment must be 10 MB or smaller."};
    const permitted=["application/pdf","text/plain","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","image/png","image/jpeg"];
    if(!permitted.includes(file.type)) return {success:false,message:"Unsupported file type."};
    const url=process.env.NEXT_PUBLIC_SUPABASE_URL,secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
    if(!url||!secret) return {success:false,message:"Attachment storage is not configured."};
    client=createClient(url,secret,{auth:{autoRefreshToken:false,persistSession:false}});
    const storageKey=randomUUID();
    const {error}=await client.storage.from("task-attachments").upload(storageKey,file,{contentType:file.type,upsert:false});
    if(error) return {success:false,message:"Attachment upload failed."};
    uploaded={storageKey,fileName:file.name.slice(0,200),contentType:file.type};
  }
  try {
    await prisma.$transaction(async tx=>{
      // Recheck status and submission count inside the transaction before the amendment.
      const current=await tx.workTask.findUnique({where:{id:taskId},select:{status:true,_count:{select:{submissions:true}}}});
      if(!current || !editableStates.includes(current.status) || current._count.submissions>0) throw new Error("Order was submitted or closed while editing.");
      await tx.workTask.update({where:{id:taskId},data:{title,description,instructions:instructions||null,priority,submissionHours,reviewHours,qaHours,deadline:due("submissionHours",submissionHours,task.deadline),reviewDeadline:due("reviewHours",reviewHours,task.reviewDeadline),qaDeadline:due("qaHours",qaHours,task.qaDeadline)}});
      if(uploaded) await tx.taskExtraAttachment.create({data:{taskId,uploadedById:manager.id,...uploaded}});
    });
  } catch(e) {
    if(uploaded&&client) await client.storage.from("task-attachments").remove([uploaded.storageKey]).catch(()=>{});
    console.error("Order amendment failed",e);
    return {success:false,message:"Order could not be updated. It may have been submitted while you were editing."};
  }
  for(const path of ["/portal/admin/task-management",`/portal/admin/task-management/edit/${taskId}`,"/portal/task-hub","/portal/tasker","/portal/reviewer","/portal/qa"]) revalidatePath(path);
  return {success:true,message:"Order details saved successfully."};
}
