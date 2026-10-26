"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { createClient as adminClient } from "@supabase/supabase-js";

type Result = { success: boolean; message: string };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;


export async function assignTask(formData: FormData): Promise<Result> {
  const user = await requireEmployee(["ADMIN", "SUPER_ADMIN", "QA"]);
  const creator = await prisma.employeeProfile.findUnique({ where: { authUserId: user.id }, select: { id: true, role: true, status: true } });
  if (!creator || creator.status !== "ACTIVE" || !["ADMIN", "SUPER_ADMIN", "QA"].includes(creator.role)) return { success:false,message:"Access denied." };
  const assignedToId = String(formData.get("assignedToId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const orderId = String(formData.get("orderId") ?? "");
  const category = String(formData.get("category") ?? "");
  const priority = String(formData.get("priority") ?? "NORMAL");
  if (!uuid.test(assignedToId) || title.length < 3 || title.length > 160 || description.length < 10 || description.length > 10000 || orderId.length > 10000 || !category || !["LOW","NORMAL","HIGH","URGENT"].includes(priority)) return {success:false,message:"Check the entered task details."};
  const validCategory = await prisma.taskCategory.findFirst({where:{name:category,active:true},select:{id:true}});
  if (!validCategory) return {success:false,message:"Please select an active category."};
  const worker = await prisma.employeeProfile.findUnique({where:{id:assignedToId},select:{status:true,role:true}});
  if (!worker || worker.status !== "ACTIVE" || worker.role !== "TASKER") return {success:false,message:"Please select an active Tasker."};
  const parseHours = (key:string) => {
    const text = String(formData.get(key) ?? "").trim();
    const hours=Number(text);
    if (!text || !Number.isFinite(hours) || hours <= 0 || hours > 8760) throw new Error("Enter a valid positive number of hours for each deadline (maximum 8760). ");
    return hours;
  };
  let submissionHours:number, reviewHours:number, qaHours:number;
  try { submissionHours=parseHours("submissionHours"); reviewHours=parseHours("reviewHours"); qaHours=parseHours("qaHours"); }
  catch (e) { return {success:false,message:e instanceof Error?e.message:"Invalid deadlines"}; }
  if (!(submissionHours <= reviewHours && reviewHours <= qaHours)) return {success:false,message:"Submission, review, then QA deadline hours must be in chronological order."};
  const file=formData.get("attachment");
  let attachmentKey:string|null=null, attachmentName:string|null=null;
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
  let client:ReturnType<typeof adminClient>|null=null;
  if (file instanceof File && file.size>0) {
    if (!url || !secret) return {success:false,message:"Attachment storage is not configured."};
    if(file.size>10*1024*1024) return {success:false,message:"Attachment exceeds 10 MB."};
    const permitted=["application/pdf","text/plain","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","image/png","image/jpeg"];
    if(!permitted.includes(file.type)) return {success:false,message:"Unsupported attachment type."};
    attachmentName=file.name.slice(0,200);
    attachmentKey=randomUUID();
    client=adminClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
    const {error}=await client.storage.from("task-attachments").upload(attachmentKey,file,{contentType:file.type,upsert:false});
    if(error) return {success:false,message:"Attachment upload failed. Check the private storage bucket."};
  }
  const start=Date.now();
  const stamp=(hours:number)=>new Date(start+hours*3600000);
  try {
    await prisma.workTask.create({data:{
      assignedToId,createdById:creator.id,title,description,priority,status:"ASSIGNED",
      orderId,category,publicTaskId:"TASK-"+randomUUID().replaceAll("-","").slice(0,12).toUpperCase(),
      deadline:stamp(submissionHours),reviewDeadline:stamp(reviewHours),qaDeadline:stamp(qaHours),
      attachmentKey,attachmentName,
    }});
  } catch(e) {
    if(attachmentKey && client) await client.storage.from("task-attachments").remove([attachmentKey]).catch(()=>{});
    console.error("Task creation error:",e);
    return {success:false,message:"Task could not be created. Check the server logs."};
  }
  revalidatePath("/portal/admin/task-management");
  revalidatePath("/portal/tasker");
  revalidatePath("/portal/qa");
  return {success:true,message:"Task assigned successfully."};
}
