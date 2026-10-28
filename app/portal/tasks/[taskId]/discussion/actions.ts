"use server";
import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { taskAccess } from "@/lib/tasks/access";
import { prisma } from "@/lib/db/prisma";

export async function sendTaskMessage(form: FormData) {
 const taskId=String(form.get("taskId")??"");
 const body=String(form.get("body")??"").trim();
 const recipient=String(form.get("recipient")??"GENERAL");
 if(body.length<2||body.length>5000)throw new Error("Message must contain 2–5,000 characters.");
 if(!["GENERAL","TASKER","REVIEWER","QA","ADMIN","SUPER_ADMIN"].includes(recipient))throw new Error("Invalid message recipient.");
 const {person,task}=await taskAccess(taskId);
 const file=form.get("attachment");
 const attachment=file instanceof File && file.size>0?file:null;
 if(attachment && (attachment.size>10*1024*1024 || !["application/pdf","image/png","image/jpeg","text/plain","application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(attachment.type)))throw new Error("Attachment must be a PDF, PNG, JPG, TXT or DOCX up to 10 MB.");
 const participantIds=[task.assignedToId,task.claimedReviewerId, ...(task.submissions??[]).flatMap(s=>[s.employeeId,...s.reviews.map(r=>r.reviewerId)])].filter((v):v is string=>Boolean(v));
 const managers=await prisma.employeeProfile.findMany({where:{status:"ACTIVE",role:{in:["ADMIN","SUPER_ADMIN","QA"]}},select:{id:true,role:true}});
 const audience=new Set<string>();
 if(recipient==="GENERAL"){
  for(const id of participantIds)audience.add(id);
  for(const member of managers)audience.add(member.id);
 }else if(recipient==="TASKER"){
  if(task.assignedToId)audience.add(task.assignedToId);
  for(const id of task.submissions.map(s=>s.employeeId))audience.add(id);
 }else if(recipient==="REVIEWER"){
  if(task.claimedReviewerId)audience.add(task.claimedReviewerId);
  for(const id of task.submissions.flatMap(s=>s.reviews.map(r=>r.reviewerId)))audience.add(id);
 }else{
  for(const member of managers)if(member.role===recipient)audience.add(member.id);
 }
 // Management and QA retain operational visibility of messages, even for directed messages.
 for(const member of managers)audience.add(member.id);
 audience.delete(person.id);
 if(recipient!=="GENERAL"&&audience.size===0)throw new Error("No active recipient is assigned to this task.");
 let storageKey:string|null=null;
 if(attachment){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key)throw new Error("Attachment storage is unavailable.");
  const client=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
  storageKey=`discussion/${taskId}/${randomUUID()}`;
  const uploaded=await client.storage.from("task-attachments").upload(storageKey,new Uint8Array(await attachment.arrayBuffer()),{contentType:attachment.type,upsert:false});
  if(uploaded.error)throw new Error("Unable to upload attachment.");
 }
 try{
 await prisma.$transaction(async tx=>{
  await tx.taskMessage.create({data:{taskId,senderId:person.id,body,recipientRole:recipient}});
  if(attachment&&storageKey)await tx.taskExtraAttachment.create({data:{taskId,uploadedById:person.id,storageKey,fileName:attachment.name.slice(0,180),contentType:attachment.type}});
  if(audience.size)await tx.portalNotification.createMany({data:[...audience].map(recipientId=>({recipientId,title:"Order message",body:`New ${recipient==="GENERAL"?"general":recipient.toLowerCase()} message on order ${taskId}.${attachment?" Includes an attachment.":""}`,href:`/portal/tasks/${taskId}/discussion`}))});
 });
 }catch(error){
  if(storageKey&&process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY){const client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{autoRefreshToken:false,persistSession:false}});await client.storage.from("task-attachments").remove([storageKey]);}
  throw error;
 }
 revalidatePath(`/portal/tasks/${taskId}/discussion`);revalidatePath('/portal/notifications');
}
export async function requestTaskReassignment(form:FormData){
 const taskId=String(form.get("taskId")??"");const reason=String(form.get("reason")??"").trim();
 if(reason.length<10||reason.length>3000)throw new Error("Provide 10–3,000 characters explaining the request.");
 const {person,task,manager}=await taskAccess(taskId);
 if(manager||task.assignedToId!==person.id||!["ASSIGNED","REWORK_REQUIRED"].includes(task.status))throw new Error("This request is not eligible.");
 const existing=await prisma.taskReassignmentRequest.findFirst({where:{taskId,employeeId:person.id,status:"PENDING"}});
 if(existing)throw new Error("A reassignment request is already pending.");
 await prisma.$transaction(async tx=>{
  await tx.taskReassignmentRequest.create({data:{taskId,employeeId:person.id,reason}});
  const team=await tx.employeeProfile.findMany({where:{status:"ACTIVE",role:{in:["ADMIN","SUPER_ADMIN"]}},select:{id:true}});
  if(team.length)await tx.portalNotification.createMany({data:team.map(member=>({recipientId:member.id,title:"Task reassignment requested",body:`A tasker requested reassignment of task ${taskId}. Reason: ${reason}`,href:`/portal/admin/reassignments`}))});
 });
 revalidatePath(`/portal/tasks/${taskId}/discussion`);revalidatePath('/portal/admin/reassignments');
}
