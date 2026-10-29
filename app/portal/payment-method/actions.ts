"use server";
import { revalidatePath } from "next/cache";
import { requireEmployee } from "@/lib/auth/require-employee";
import { prisma } from "@/lib/db/prisma";
import { encryptPaymentDetails, canChangePaymentNow } from "./payment-utils";

export async function requestPaymentChange(form:FormData) {
  const auth=await requireEmployee();
  const profile=await prisma.employeeProfile.findUnique({where:{authUserId:auth.id},select:{id:true,status:true}});
  if(!profile || profile.status!=="ACTIVE") throw new Error("Employee access denied.");
  if(!canChangePaymentNow()) throw new Error("Payment details cannot change within four days before a payout.");
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
  // DB unique partial index prevents simultaneous duplicate pending requests.
  await prisma.$executeRaw`INSERT INTO public."PaymentChangeRequest" ("employeeId","method","accountName","details") VALUES (${profile.id}::uuid,${method},${accountName},${encrypted})`;
  revalidatePath("/portal/payment-method");
  revalidatePath("/portal/admin/payment-approvals");
}


/** Keeps expected validation and configuration failures on the form instead of throwing an error page. */
export async function requestPaymentChangeWithFeedback(
  _previous: { error: string; success: string },
  form: FormData
): Promise<{ error: string; success: string }> {
  try {
    await requestPaymentChange(form);
    return { error: "", success: "Your request has been submitted for approval." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "Payment encryption is not configured.") {
      return { error: "Payment changes are temporarily unavailable. Please contact an administrator to configure secure payment details.", success: "" };
    }
    if (/Payment details cannot change|Employee access denied|Select a mobile provider|Specify the mobile provider|Enter a valid mobile money number|Enter valid bank details|Select mobile money or bank transfer/.test(message)) {
      return { error: message, success: "" };
    }
    if (/unique constraint|duplicate key/i.test(message)) {
      return { error: "You already have a payment method change request awaiting approval.", success: "" };
    }
    console.error("Payment method change submission failed", error);
    return { error: "We could not submit your request. Please contact an administrator to verify payment request configuration.", success: "" };
  }
}
