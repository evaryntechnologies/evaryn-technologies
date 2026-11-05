import "server-only";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";

export const messageUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const messageFileTypes = [
  "application/pdf", "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png", "image/jpeg"
];

export async function authorizeMessage(requestId: string) {
  if (!messageUuid.test(requestId)) return null;
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const request = await prisma.clientProjectRequest.findUnique({
    where: { id: requestId }, select: { id: true, title: true, clientId: true }
  });
  if (!request) return null;
  const client = await prisma.clientProfile.findUnique({
    where: { authUserId: user.id }, select: { id: true, status: true }
  });
  if (client?.id === request.clientId && client.status === "ACTIVE" && !user.app_metadata?.role) {
    const employee = await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true}});
    if (!employee) return { authUserId: user.id, request, kind: "CLIENT" as const, senderId: client.id };
  }
  const employee = await prisma.employeeProfile.findUnique({
    where: { authUserId: user.id }, select: { id: true, status: true, role: true }
  });
  if (employee?.status === "ACTIVE" && ["QA", "ADMIN", "SUPER_ADMIN"].includes(employee.role) && user.app_metadata?.role === employee.role) {
    return { authUserId: user.id, request, kind: "STAFF" as const, senderId: employee.id };
  }
  return null;
}
