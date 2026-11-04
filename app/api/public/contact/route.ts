import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validations/contact";
import { checkContactRateLimit } from "@/lib/security/rate-limit";

type ContactRequest = {
  name?: unknown;
  email?: unknown;
  service?: unknown;
  details?: unknown;
  website?: unknown;
};

export async function POST(request: Request) {
  if (process.env.ENABLE_PUBLIC_SUBMISSIONS !== "true") {
    return NextResponse.json(
      { error: "Online submissions are not available yet." },
      { status: 503 }
    );
  }

  // Allow only explicitly configured website origins. This supports both the
  // apex and www production domains without disabling CSRF origin checks.
  const configuredOrigins = [
    process.env.PUBLIC_FORM_ORIGIN ?? "",
    process.env.PUBLIC_FORM_ALLOWED_ORIGINS ?? "",
  ]
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  const allowedOrigins = new Set<string>();
  for (const configured of configuredOrigins) {
    try {
      const candidate = new URL(configured);
      if (candidate.protocol === "https:" ||
          (process.env.NODE_ENV !== "production" && candidate.origin.startsWith("http://localhost:"))) {
        allowedOrigins.add(candidate.origin);
      }
    } catch {
      // Ignore malformed entries; never treat them as wildcards.
    }
  }

  if (allowedOrigins.size === 0) {
    return NextResponse.json(
      { error: "Submission service is not configured." },
      { status: 503 }
    );
  }

  const origin = request.headers.get("origin");
  if (!origin || !allowedOrigins.has(origin)) {
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

    const { prisma } = await import("@/lib/db/prisma");

    const inquiry = await prisma.clientInquiry.create({
      data: result.data,
      select: { id: true },
    });

    // Best-effort notifications: failures must not erase saved contact inquiries.
    try {
      const admins = await prisma.employeeProfile.findMany({
        where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, status: "ACTIVE" },
        select: { id: true, role: true },
      });
      if (admins.length > 0) {
        await prisma.portalNotification.createMany({
          data: admins.map((admin) => ({
            recipientId: admin.id,
            title: "New website contact inquiry",
            body: `${result.data.name} submitted an inquiry about ${result.data.service}.`,
            href: admin.role === "SUPER_ADMIN"
              ? "/portal/super-admin/inquiries"
              : "/portal/admin",
          })),
        });
      }
    } catch (notificationError) {
      console.error(
        "Contact inquiry saved but notification failed:",
        notificationError instanceof Error ? notificationError.name : "UnknownError"
      );
    }

    return NextResponse.json(
      {
        success: true,
        reference: inquiry.id,
        message: "Thank you for contacting us. Our team will reach out to you soon.",
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