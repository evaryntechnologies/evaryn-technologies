import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { listClientNotifications } from "@/lib/client-notifications";
export const dynamic = "force-dynamic";
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role || user.user_metadata?.evaryn_account_type !== "CLIENT") return NextResponse.json({error:"Unauthorized"},{status:401});
  const client = await prisma.clientProfile.findUnique({where:{authUserId:user.id},select:{id:true,status:true}});
  if (!client || client.status !== "ACTIVE") return NextResponse.json({error:"Unauthorized"},{status:403});
  const entries = await listClientNotifications(client.id, 1);
  return NextResponse.json({unread: entries[0]?.unreadCount ?? 0}, {headers:{"Cache-Control":"private, no-store"}});
}
