import "server-only";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/db/prisma";

/** Upload to an existing PRIVATE Supabase storage bucket. Never accept an arbitrary storage URL. */
export async function saveOrderAttachment(form: FormData, taskId: string, employeeId: string, mandatory = true) {
  const file = form.get("attachment");
  if (!(file instanceof File) || file.size === 0) {
    if (mandatory) throw new Error("A file attachment is required to submit this stage.");
    return null;
  }
  if (file.size > 10 * 1024 * 1024) throw new Error("Files must be 10 MB or smaller.");
  if (file.name.length < 1 || file.name.length > 200 || /[\x00-\x1F]/.test(file.name)) throw new Error("Invalid filename.");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret) throw new Error("Private attachment storage is not configured.");
  const client = createClient(url, secret, {auth:{autoRefreshToken:false,persistSession:false}});
  const key = `${taskId}/${randomUUID()}`;
  const {error} = await client.storage.from("task-attachments").upload(key,file,{
    contentType:"application/octet-stream",upsert:false
  });
  if (error) throw new Error("Could not store attachment.");
  try {
    return await prisma.taskExtraAttachment.create({data:{
      taskId,uploadedById:employeeId,storageKey:key,fileName:file.name,
      contentType:"application/octet-stream"
    }});
  } catch (e) {
    await client.storage.from("task-attachments").remove([key]);
    throw e;
  }
}

/** Called if a submission loses its stage-ownership race after storage upload. */
export async function removeOrderAttachment(file: {id:string;storageKey:string}|null) {
 if (!file) return;
 await prisma.taskExtraAttachment.deleteMany({where:{id:file.id}});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL, secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(url&&secret){const client=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});await client.storage.from("task-attachments").remove([file.storageKey]);}
}
