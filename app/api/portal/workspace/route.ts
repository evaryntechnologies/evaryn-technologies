import { requireEmployee } from "@/lib/auth/require-employee";
export async function GET() {
  try {
    const employee = await requireEmployee();
    return Response.json({ role: employee.role, firstName: employee.firstName }, {
      headers: { "Cache-Control": "private, no-store" }
    });
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
}
