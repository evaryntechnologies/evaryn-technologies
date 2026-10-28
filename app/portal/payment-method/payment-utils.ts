import { createCipheriv, randomBytes } from "node:crypto";
export function encryptPaymentDetails(value:string):string {
  const secret=process.env.PAYMENT_DETAILS_ENCRYPTION_KEY;
  if (!secret || !/^[a-f0-9]{64}$/i.test(secret)) throw new Error("Payment encryption is not configured.");
  const iv=randomBytes(12);
  const cipher=createCipheriv("aes-256-gcm",Buffer.from(secret,"hex"),iv);
  const data=Buffer.concat([cipher.update(value,"utf8"),cipher.final()]);
  return `v1:${iv.toString("base64url")}:${cipher.getAuthTag().toString("base64url")}:${data.toString("base64url")}`;
}
// Local Nairobi calendar dates; cutoff is inclusive on the 1st and 16th.
export function canChangePaymentNow(date=new Date()): boolean {
  const day=Number(new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Nairobi",day:"numeric"}).format(date));
  return day<=1 || (day>=5 && day<=16) || day>=20;
}
export function paymentChangeWindowMessage(date=new Date()):string {
  const day=Number(new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Nairobi",day:"numeric"}).format(date));
  if(day>=2 && day<=4)return "Changes for the 5th payout closed after the 1st. New requests open on the 5th.";
  if(day>=17 && day<=19)return "Changes for the 20th payout closed after the 16th. New requests open on the 20th.";
  return "Changes require approval by an Admin or Super Admin.";
}
