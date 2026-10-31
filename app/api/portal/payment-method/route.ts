import { NextResponse } from "next/server";
import { requestPaymentChange } from "@/app/portal/payment-method/actions";

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    await requestPaymentChange(data);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit payment method.";
    // Do not expose database, encryption or authentication internals to the browser.
    const safe = /pending|already|close|valid|select|enter|denied|access|first|four days/i.test(message)
      ? message : "Submission failed. Please contact an administrator if the issue continues.";
    console.error("Payment method submission failed:", error);
    return NextResponse.json({ ok: false, error: safe }, { status: 400 });
  }
}
