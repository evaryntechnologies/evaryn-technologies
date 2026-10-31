import "server-only";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";

type DbRow = {
  id: string; sourceType: string; label: string; category: string | null;
  grossAmount: unknown; fineAmount: unknown; payableAmount: unknown;
  payoutDate: Date | string; status: string; paidAt: Date | null;
  actualPaid: unknown; settlementReason: string | null;
};
export type EarningsRow = {
  id: string; sourceType: string; label: string; category: string;
  gross: number; fines: number; net: number; originalNet: number;
  cycle: string; status: string; adjustmentReason: string | null;
};
export type EarningsFilters = { month: string; category: string; role: string; status: string };
export const roles = ["TASKER", "REVIEWER", "QA", "ADMIN_TIME", "LEGACY"];
export function cleanFilters(input: Record<string, string | undefined>): EarningsFilters {
  return {
    month: /^\d{4}-(0[1-9]|1[0-2])$/.test(input.month ?? "") ? input.month! : "",
    category: (input.category ?? "").slice(0,100),
    role: roles.includes(input.role ?? "") ? input.role! : "",
    status: ["PENDING", "PAID"].includes(input.status ?? "") ? input.status! : "",
  };
}
export async function getEarningsReport() {
  const user = await requireEmployee();
  const employee = await prisma.employeeProfile.findUnique({
    where: { authUserId: user.id }, select: { id: true, fullName: true, role: true },
  });
  if (!employee) throw new Error("Employee profile not found");
  // An employee can never supply a different employee ID via query parameters.
  // PayTeamAllocation only links to WorkforcePayLedger, NOT the legacy PayrollEntry table.
  // A declined/adjusted balance is not counted as an unpaid debt once finally settled.
  const modern = await prisma.$queryRaw<DbRow[]>`
    SELECT l.id, l."sourceType", COALESCE(t.title,'Admin activity') AS label,
      t.category, l."grossAmount", l."fineAmount", l."payableAmount", l."payoutDate",
      l.status, l."paidAt", a."paidAmount" AS "actualPaid", s.reason AS "settlementReason"
    FROM public."WorkforcePayLedger" l
    LEFT JOIN public."PayTeamAllocation" a ON a."ledgerId"=l.id
    LEFT JOIN public."PayTeamSettlement" s ON s.id=a."settlementId"
    LEFT JOIN public."WorkTask" t ON t.id=l."taskId"
    WHERE l."employeeId"=${employee.id}::uuid
    ORDER BY l."payoutDate" DESC LIMIT 5000`;
  const legacy = await prisma.$queryRaw<DbRow[]>`
    SELECT l.id, 'LEGACY'::text AS "sourceType", t.title AS label, t.category,
      l."grossAmount", l."fineAmount", l."payableAmount", l."payoutDate",
      l.status, l."paidAt", NULL::numeric AS "actualPaid", NULL::text AS "settlementReason"
    FROM public."PayrollEntry" l JOIN public."WorkTask" t ON t.id=l."taskId"
    WHERE l."employeeId"=${employee.id}::uuid
    ORDER BY l."payoutDate" DESC LIMIT 5000`;
  const rows: EarningsRow[] = [...modern, ...legacy].map(x => {
    const originalNet = Number(x.payableAmount);
    const recordedPaid = x.actualPaid == null ? originalNet : Number(x.actualPaid);
    return {
      id: x.id, sourceType: x.sourceType, label: x.label,
      category: x.category ?? (x.sourceType === "ADMIN_TIME" ? "Administration" : "Uncategorized"),
      gross: Number(x.grossAmount), fines: Number(x.fineAmount),
      net: x.status === "PAID" ? recordedPaid : originalNet,
      originalNet,
      cycle: x.payoutDate instanceof Date ? x.payoutDate.toISOString().slice(0,10) : String(x.payoutDate).slice(0,10),
      status: x.status,
      adjustmentReason: x.settlementReason,
    };
  }).sort((a,b) => b.cycle.localeCompare(a.cycle));
  return { employee, rows };
}
export function applyEarningsFilters(rows: EarningsRow[], filters: EarningsFilters) {
  return rows.filter(r => (!filters.month || r.cycle.startsWith(filters.month)) &&
    (!filters.category || r.category === filters.category) &&
    (!filters.role || r.sourceType === filters.role) &&
    (!filters.status || r.status === filters.status));
}
export function summarize(rows: EarningsRow[]) {
  const active = rows.filter(r => r.status === "PENDING" || r.status === "PAID");
  return {
    gross: active.reduce((n,r) => n+r.gross,0),
    fines: active.reduce((n,r) => n+r.fines,0),
    net: active.reduce((n,r) => n+r.net,0),
    pending: active.filter(r=>r.status === "PENDING").reduce((n,r)=>n+r.net,0),
    paid: active.filter(r=>r.status === "PAID").reduce((n,r)=>n+r.net,0),
  };
}
