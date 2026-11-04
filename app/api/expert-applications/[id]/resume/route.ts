import { NextResponse } from "next/server";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { signedPrivateFile } from "@/lib/private-order-files";
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){
 await requireEmployee(["SUPER_ADMIN"]);
 const {id}=await params;
 if(!/^[0-9a-f-]{36}$/i.test(id))return new NextResponse("Not found",{status:404});
 const application=await prisma.expertApplication.findUnique({where:{id},select:{cvStorageKey:true}});
 if(!application?.cvStorageKey)return new NextResponse("Not found",{status:404});
 return NextResponse.redirect(await signedPrivateFile(application.cvStorageKey),{status:302});
}
