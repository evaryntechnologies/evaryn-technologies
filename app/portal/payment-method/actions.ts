"use server";
import { randomBytes, createCipheriv } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { requireEmployee } from "@/lib/auth/require-employee";
import { revalidatePath } from "next/cache";

// Keep the 32-byte key in Vercel secrets; never commit it to GitHub.
function encryptPaymentDetails(plaintext:string):string {
 const hex=process.env.PAYMENT_DETAILS_ENCRYPTION_KEY;
 if(!hex || !/^[a-f0-9]{64}$/i.test(hex)) throw new Error("Payment details cannot be saved until encryption is configured.");
 const key=Buffer.from(hex,"hex"), iv=randomBytes(12);
 const cipher=createCipheriv("aes-256-gcm",key,iv);
 const ciphertext=Buffer.concat([cipher.update(plaintext,"utf8"),cipher.final()]);
 return `v1:${iv.toString("base64url")}:${cipher.getAuthTag().toString("base64url")}:${ciphertext.toString("base64url")}`;
}
export async function savePaymentMethod(form:FormData){
 const user=await requireEmployee();
 const p=await prisma.employeeProfile.findUnique({where:{authUserId:user.id},select:{id:true,status:true}});
 if(!p||p.status!=="ACTIVE") throw new Error("Access denied");
 const method=String(form.get("method")??"");
 const accountName=String(form.get("accountName")??"").trim();
 const details=String(form.get("details")??"").trim();
 if(!["MPESA","BANK","PAYPAL","PAYONEER","OTHER"].includes(method)||accountName.length<2||accountName.length>150||details.length<4||details.length>500) throw new Error("Check your payment details");
 const secured=encryptPaymentDetails(details);
 await prisma.$executeRaw`INSERT INTO public."EmployeePaymentMethod" ("employeeId","method","accountName","details") VALUES (${p.id}::uuid,${method},${accountName},${secured}) ON CONFLICT ("employeeId") DO UPDATE SET "method"=EXCLUDED."method","accountName"=EXCLUDED."accountName","details"=EXCLUDED."details","updatedAt"=now()`;
 revalidatePath("/portal/payment-method");
}
