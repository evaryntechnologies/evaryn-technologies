import "server-only";

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const redis =
  url && token ? new Redis({ url, token }) : null;

const visitorLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "10 m"),
      prefix: "evaryn:contact:visitor",
      timeout: 3000,
    })
  : null;

const globalLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(300, "1 m"),
      prefix: "evaryn:contact:global",
      timeout: 3000,
    })
  : null;

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; status: 429 | 503 };

export async function checkContactRateLimit(
  request: Request
): Promise<RateLimitResult> {
  if (!visitorLimiter || !globalLimiter) {
    return { allowed: false, status: 503 };
  }

  try {
    const overall = await globalLimiter.limit("all");

    if (!overall.success) {
      return { allowed: false, status: 429 };
    }

    // Use the client IP only from a trusted deployment proxy.
    // On Vercel, x-vercel-forwarded-for is the intended source.
    // Otherwise use a shared fallback bucket.
    const forwarded =
      process.env.VERCEL === "1"
        ? request.headers.get("x-vercel-forwarded-for")
        : null;

    const identifier =
      forwarded?.split(",")[0]?.trim() || "unidentified";

    const visitor = await visitorLimiter.limit(identifier);

    if (!visitor.success) {
      return { allowed: false, status: 429 };
    }

    return { allowed: true };
  } catch {
    // Never bypass limiting when Redis cannot be contacted.
    return { allowed: false, status: 503 };
  }
}