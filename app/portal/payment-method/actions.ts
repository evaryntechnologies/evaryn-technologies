"use server";
import { revalidatePath } from "next/cache";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { encryptPaymentDetails, canChangePaymentNow } from "./payment-utils";

export async function requestPaymentChange(form:FormData) {
  const auth=await requireEmployee();
  const profile=await prisma.employeeProfile.findUnique({where:{authUserId:auth.id},select:{id:true,status:true}});
  if(!profile || profile.status!=="ACTIVE") throw new Error("Employee access denied.");
  const existing = await prisma.$queryRaw<Array<{present:boolean}>>`SELECT EXISTS(SELECT 1 FROM public."EmployeePaymentMethod" WHERE "employeeId"=${profile.id}::uuid) AS present`;
  if(existing[0]?.present && !canChangePaymentNow()) throw new Error("Payment method changes close four days before payout. Initial registration remains available.");
  const method=String(form.get("method")??"");
  const provider=String(form.get("provider")??"");
  const other=String(form.get("otherProvider")??"").trim();
  const phone=String(form.get("phone")??"").trim();
  const bank=String(form.get("bankName")??"").trim();
  const owner=String(form.get("accountName")??"").trim();
  const number=String(form.get("accountNumber")??"").trim();
  let accountName="", details="";
  if(method==="MOBILE_MONEY") {
    if(!["MPESA","SAFARICOM","AIRTEL","TELKOM","OTHER"].includes(provider)) throw new Error("Select a mobile provider.");
    if(provider==="OTHER" && (other.length<2 || other.length>80)) throw new Error("Specify the mobile provider.");
    if(!/^\+?[0-9\s-]{9,20}$/.test(phone)) throw new Error("Enter a valid mobile money number.");
    accountName=provider==="OTHER"?other:provider;
    details=JSON.stringify({provider:accountName,number:phone});
  } else if(method==="BANK") {
    if(bank.length<2||bank.length>100||owner.length<2||owner.length>150||number.length<4||number.length>50) throw new Error("Enter valid bank details.");
    accountName=owner;
    details=JSON.stringify({bankName:bank,accountHolder:owner,accountNumber:number});
  } else throw new Error("Select mobile money or bank transfer.");
  const encrypted=encryptPaymentDetails(details);
  // Transactional pending record + administrator notifications. No account numbers in notifications.
  await prisma.$transaction(async tx => {
    const pending = await tx.$queryRaw<Array<{ id: string }>>`
      INSERT INTO public."PaymentChangeRequest" ("employeeId","method","accountName","details")
      VALUES (${profile.id}::uuid, ${method}, ${accountName}, ${encrypted})
      RETURNING "id"`;
    if (!pending[0]) throw new Error("Could not create the payment request.");
    const recipients = await tx.employeeProfile.findMany({
      where: { status: "ACTIVE", role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      select: { id: true },
    });
    if (recipients.length) {
      await tx.portalNotification.createMany({ data: recipients.map(recipient => ({
        recipientId: recipient.id,
        title: "Payment method approval required",
        body: `An employee submitted a ${existing[0]?.present ? "payment method change" : "first payment method"} for your approval.`,
        href: "/portal/admin/payment-approvals",
      })) });
    }
  });
  revalidatePath("/portal/payment-method");
  revalidatePath("/portal/admin/payment-approvals");
}

