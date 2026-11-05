import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@/generated/prisma/client";
import { createClient } from "@/lib/supabase/server";
import { signedPrivateFile } from "@/lib/private-order-files";
export async function GET(_req:NextRequest,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 if(!/^[0-9a-f-]{36}$/i.test(id))return new NextResponse("Not found",{status:404});
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return new NextResponse("Unauthorized",{status:401});
 const [file]=await prisma.$queryRaw<{storageKey:string;clientAuthId:string;messageId:string|null}[]>(Prisma.sql`
 SELECT a."storageKey",a."messageId",c."authUserId" AS "clientAuthId" FROM public."ClientOrderAttachment" a
 JOIN public."ClientProjectRequest" r ON r."id"=a."requestId" JOIN public."ClientProfile" c ON c."id"=r."clientId"
 WHERE a."id"=${id}::uuid LIMIT 1`);
 if(!file)return new NextResponse("Not found",{status:404});
 if(file.clientAuthId!==user.id){
  const staff=await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true,role:true,status:true}});
  if(!staff||staff.status!=="ACTIVE")return new NextResponse("Forbidden",{status:403});
  if(file.messageId && !["QA","ADMIN","SUPER_ADMIN"].includes(staff.role))return new NextResponse("Forbidden",{status:403});
  if(!["QA","ADMIN","SUPER_ADMIN"].includes(staff.role)){
   const linked=await prisma.$queryRaw<{allowed:boolean}[]>(Prisma.sql`
    SELECT true AS "allowed" FROM public."ClientOrderAttachment" a
    JOIN public."ClientOrderLink" l ON l."requestId"=a."requestId"
    JOIN public."WorkTask" t ON t."id"=l."taskId"
    WHERE a."id"=${id}::uuid AND (t."assignedToId"=${staff.id}::uuid OR t."claimedReviewerId"=${staff.id}::uuid OR t."claimedQaId"=${staff.id}::uuid)
    LIMIT 1`);
   if(!linked.length)return new NextResponse("Forbidden",{status:403});
  }
 }
 return NextResponse.redirect(await signedPrivateFile(file.storageKey),{status:302});
}
