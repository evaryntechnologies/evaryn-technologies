"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";

type Candidate = { id: string; assignedToId: string | null; status: string; clientActionAt: Date | null; totalOrderCost: unknown; };
type Actor = { id: string };
async function superAdmin(): Promise<Actor> {
  const user = await requireEmployee(["SUPER_ADMIN"]);
  if (user.role !== "SUPER_ADMIN") throw new Error("Super Admin only.");
  const profile = await prisma.employeeProfile.findUnique({ where: { authUserId: user.id }, select: { id: true, status: true, role: true } });
  if (!profile || profile.role !== "SUPER_ADMIN" || profile.status !== "ACTIVE") throw new Error("Access denied.");
  return { id: profile.id };
}
const decimalAmount = (value: FormDataEntryValue | null) => {
  const s = String(value ?? "").trim();
  if (!/^\d{1,12}(?:\.\d{1,2})?$/.test(s)) throw new Error("Enter a valid amount with up to 2 decimal places.");
  return Number(s);
};
function nextPayout(date: Date) {
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Nairobi", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const part = (key: string) => Number(day.find(x => x.type === key)?.value);
  let y=part("year"), m=part("month"), d=part("day");
  if (d < 5) d=5; else if (d < 20) d=20; else { d=5; m++; if (m>12) {m=1;y++;} }
  return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

export async function approvePayrollEntry(form: FormData) {
  const actor = await superAdmin();
  const taskId = String(form.get("taskId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(taskId)) throw new Error("Invalid order.");
  const gross = decimalAmount(form.get("gross"));
  const task = await prisma.workTask.findUnique({where:{id:taskId},select:{id:true,assignedToId:true,status:true,clientActionAt:true,totalOrderCost:true}}) as Candidate | null;
  if (!task || task.status !== "COMPLETED" || !task.clientActionAt || !task.assignedToId) throw new Error("Only completed, client-paid, assigned orders qualify.");
  const orderValue = Number(task.totalOrderCost ?? 0);
  if (!Number.isFinite(orderValue) || orderValue <= 0) throw new Error("Order value must be configured before payroll approval.");
  const fineRows = await prisma.$queryRaw<Array<{ amount: unknown }>>`
    SELECT COALESCE(SUM("amount"),0) AS amount FROM public."TaskPenalty" WHERE "taskId"=${taskId}::uuid AND "status"='ACTIVE'`;
  const fines = Number(fineRows[0]?.amount ?? 0);
  const cap = Math.max(0, Math.round((orderValue-fines)*100)/100);
  if (gross > cap) throw new Error("Approved employee amount exceeds the net order value. Adjust the amount.");
  const payableDate = nextPayout(task.clientActionAt);
  await prisma.$executeRaw`
    INSERT INTO public."PayrollEntry" ("taskId","employeeId","clientPaidAt","payoutDate","grossAmount","fineAmount","payableAmount","approvedById")
    SELECT t.id, t."assignedToId", t."clientActionAt", ${payableDate}::date, ${gross}::numeric, ${fines}::numeric, ${gross}::numeric, ${actor.id}::uuid
    FROM public."WorkTask" t
    WHERE t.id=${taskId}::uuid AND t.status='COMPLETED' AND t."clientActionAt" IS NOT NULL AND t."assignedToId" IS NOT NULL
    ON CONFLICT ("taskId") DO NOTHING`;
  revalidatePath("/portal/super-admin/payroll");
}

export async function markPayrollPaid(form: FormData) {
  const actor = await superAdmin();
  const id = String(form.get("entryId") ?? "");
  const ref = String(form.get("paymentReference") ?? "").trim();
  const note = String(form.get("paymentNote") ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(id) || ref.length < 3 || ref.length > 150 || note.length > 1000) throw new Error("Provide a valid entry and payment reference.");
  const rows = await prisma.$executeRaw`
    UPDATE public."PayrollEntry" SET "status"='PAID',"paidAt"=now(),"paidById"=${actor.id}::uuid,
    "paymentReference"=${ref},"paymentNote"=${note}
    WHERE id=${id}::uuid AND "status"='PENDING' AND "payoutDate" <= (now() AT TIME ZONE 'Africa/Nairobi')::date`;
  if (rows !== 1) throw new Error("Entry not pending or payout date has not arrived.");
  revalidatePath("/portal/super-admin/payroll");
}
