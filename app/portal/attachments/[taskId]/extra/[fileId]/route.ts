import { NextRequest,NextResponse } from "next/server";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@supabase/supabase-js";
export async function GET(_request:NextRequest,{params}:{params:Promise<{taskId:string;fileId:string}>}){
 const auth=await requireEmployee();
 const person=await prisma.employeeProfile.findUnique({where:{authUserId:auth.id},select:{id:true,role:true,status:true}});
 if(!person||person.status!=="ACTIVE") return new NextResponse("Access denied",{status:403});
 const {taskId,fileId}=await params;
 const file=await prisma.taskExtraAttachment.findFirst({where:{id:fileId,taskId},include:{task:{select:{assignedToId:true,claimedReviewerId:true,status:true,category:true}}}});
 if(!file)return new NextResponse("File not found",{status:404});
 const task=file.task;
 const past=await prisma.taskSubmission.findFirst({where:{taskId,OR:[{employeeId:person.id},{reviews:{some:{reviewerId:person.id}}}]},select:{id:true}});
 const allowed=["ADMIN","SUPER_ADMIN"].includes(person.role)||person.role==="QA"||(task.assignedToId===person.id)||(task.claimedReviewerId===person.id)||Boolean(past);
 if(!allowed)return new NextResponse("Access denied",{status:403});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return new NextResponse("Storage not configured",{status:503});
 const client=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
 const {data,error}=await client.storage.from("task-attachments").createSignedUrl(file.storageKey,60);
 if(error||!data?.signedUrl)return new NextResponse("File unavailable",{status:404});
 return NextResponse.redirect(data.signedUrl,{status:302,headers:{"Cache-Control":"private, no-store"}});
}
