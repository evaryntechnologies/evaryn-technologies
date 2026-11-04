import "server-only";
import { randomUUID } from "node:crypto";
import { createClient as adminClient } from "@supabase/supabase-js";

const BUCKET = "evaryn-private-uploads";
function storage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Private attachment storage is not configured");
  return adminClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}).storage.from(BUCKET);
}
export async function uploadPrivateFile(file:File,namespace:string,allowed:string[]) {
  if(file.size < 1 || file.size > 10*1024*1024 || !allowed.includes(file.type)) throw new Error("Invalid file or size");
  const storageKey=`${namespace}/${randomUUID()}`;
  const {error}=await storage().upload(storageKey,file,{contentType:file.type,upsert:false});
  if(error) throw error;
  return {storageKey,fileName:file.name.slice(0,200),contentType:file.type,fileSize:file.size};
}
export async function removePrivateFile(key:string){ const {error}=await storage().remove([key]);if(error)console.error("Private attachment cleanup failed",error); }
export async function signedPrivateFile(key:string){ const {data,error}=await storage().createSignedUrl(key,60);if(error||!data?.signedUrl)throw new Error("Attachment unavailable");return data.signedUrl; }
