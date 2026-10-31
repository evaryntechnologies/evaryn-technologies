import { NextResponse } from "next/server";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
export async function GET() {
  const user=await requireEmployee();
  const profile=await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true}});
  const count=profile?await prisma.portalNotification.count({where:{recipientId:profile.id,readAt:null}}):0;
  return NextResponse.json({count},{headers:{"Cache-Control":"no-store, private"}});
}
