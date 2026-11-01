import { NextRequest, NextResponse } from "next/server";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@supabase/supabase-js";
export async function GET(_request:NextRequest,{params}:{params:Promise<{taskId:string}>}) {
 const user=await requireEmployee();
 const profile=await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true,role:true,status:true}});
 if(!profile||profile.status!=="ACTIVE") return new NextResponse("Access denied",{status:403});
 const {taskId}=await params;
 const task=await prisma.workTask.findUnique({where:{id:taskId},select:{id:true,assignedToId:true,claimedReviewerId:true,attachmentKey:true,attachmentName:true,status:true}});
 if(!task||!task.attachmentKey) return new NextResponse("Attachment unavailable",{status:404});
 const permitted=["ADMIN","SUPER_ADMIN"].includes(profile.role)|| (profile.role==="TASKER"&&task.assignedToId===profile.id)|| (profile.role==="REVIEWER"&&task.status==="PENDING_REVIEW"&&task.claimedReviewerId===profile.id) || (profile.role==="QA" && ["PENDING_QA","COMPLETED","REWORK_REQUIRED"].includes(task.status));
 if(!permitted) return new NextResponse("Access denied",{status:403});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key) return new NextResponse("Storage unavailable",{status:503});
 const client=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
 const {data,error}=await client.storage.from("task-attachments").createSignedUrl(task.attachmentKey,60);
 if(error||!data?.signedUrl) return new NextResponse("Attachment unavailable",{status:404});
 return NextResponse.redirect(data.signedUrl,{status:302,headers:{"Cache-Control":"private, no-store"}});
}
