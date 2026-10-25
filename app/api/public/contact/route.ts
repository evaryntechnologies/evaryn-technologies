import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validations/contact";
import { checkContactRateLimit } from "@/lib/security/rate-limit";
import { verifyTurnstile } from "@/lib/security/turnstile";

type ContactRequest = {
  name?: unknown;
  email?: unknown;
  service?: unknown;
  details?: unknown;
  turnstileToken?: unknown;
  website?: unknown;
};

export async function POST(request: Request) {
  if (process.env.ENABLE_PUBLIC_SUBMISSIONS !== "true") {
    return NextResponse.json(
      { error: "Online submissions are not available yet." },
      { status: 503 }
    );
  }

  if (process.env.PUBLIC_SUBMISSION_PROTECTION_READY !== "true") {
    return NextResponse.json(
      { error: "Submission protection is not enabled." },
      { status: 503 }
    );
  }

  const configuredOrigin = process.env.PUBLIC_FORM_ORIGIN;

  if (!configuredOrigin) {
    return NextResponse.json(
      { error: "Submission service is not configured." },
      { status: 503 }
    );
  }

  let allowedOrigin: URL;

  try {
    allowedOrigin = new URL(configuredOrigin);
  } catch {
    return NextResponse.json(
      { error: "Submission service is not configured." },
      { status: 503 }
    );
  }

  const origin = request.headers.get("origin");

  if (origin !== allowedOrigin.origin) {
    return NextResponse.json(
      { error: "Request origin is not allowed." },
      { status: 403 }
    );
  }

  const rateLimit = await checkContactRateLimit(request);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error:
          rateLimit.status === 429
            ? "Too many requests. Please try again later."
            : "Submission service temporarily unavailable.",
      },
      { status: rateLimit.status }
    );
  }
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().startsWith("application/json")) {
    return NextResponse.json(
      { error: "JSON is required." },
      { status: 415 }
    );
  }

  const declaredLength = Number(
    request.headers.get("content-length") ?? "0"
  );

  if (declaredLength > 16000) {
    return NextResponse.json(
      { error: "Request is too large." },
      { status: 413 }
    );
  }

  try {
    // Bound the actual body size, not just Content-Length.
    const reader = request.body?.getReader();

    if (!reader) {
      return NextResponse.json(
        { error: "Request body is required." },
        { status: 400 }
      );
    }

    const chunks: Uint8Array[] = [];
    let total = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      total += value.byteLength;

      if (total > 16000) {
        await reader.cancel();
        return NextResponse.json(
          { error: "Request is too large." },
          { status: 413 }
        );
      }

      chunks.push(value);
    }

    const buffer = new Uint8Array(total);
    let offset = 0;

    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.byteLength;
    }

    let body: ContactRequest;

    try {
      body = JSON.parse(new TextDecoder("utf-8", {
        fatal: true,
      }).decode(buffer)) as ContactRequest;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON." },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid request." },
        { status: 400 }
      );
    }

    // Hidden honeypot field: ordinary visitors leave it blank.
    if (body.website !== undefined && body.website !== "") {
      return NextResponse.json(
        { error: "Invalid submission." },
        { status: 400 }
      );
    }

    const result = contactSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Please check the information provided." },
        { status: 400 }
      );
    }

    if (typeof body.turnstileToken !== "string") {
      return NextResponse.json(
        { error: "Spam verification is required." },
        { status: 400 }
      );
    }

    const verified = await verifyTurnstile(
      body.turnstileToken,
      allowedOrigin.hostname
    );

    if (!verified) {
      return NextResponse.json(
        { error: "Spam verification failed. Please try again." },
        { status: 403 }
      );
    }

    // The production submission switch above remains OFF.
    // Rate limiting must be added before activating this route.
    const { prisma } = await import("@/lib/db/prisma");

    const inquiry = await prisma.clientInquiry.create({
      data: result.data,
      select: { id: true },
    });

    return NextResponse.json(
      {
        success: true,
        reference: inquiry.id,
        message: "Your inquiry has been received.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Contact API error:",
      error instanceof Error ? error.name : "Unknown error"
    );

    return NextResponse.json(
      { error: "Unable to process your request." },
      { status: 500 }
    );
  }
}