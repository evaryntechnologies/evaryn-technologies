import { redirect } from "next/navigation";
import { requireEmployee } from "@/lib/auth/require-employee";
// Retired: employee-wide adjustments now belong directly to Pay Team.
export default async function RetiredOnHold(){
 await requireEmployee(["SUPER_ADMIN"]);
 redirect("/super-admin/payroll/pay-team");
}
