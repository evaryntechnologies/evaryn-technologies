import "server-only";

type TurnstileResult = {
  success: boolean;
  hostname?: string;
  action?: string;
};

export async function verifyTurnstile(
  token: string,
  expectedHostname: string
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret || !token || token.length > 2048) {
    return false;
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret,
          response: token,
        }),
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      }
    );

    if (!response.ok) return false;

    const result = (await response.json()) as TurnstileResult;

    return (
      result.success === true &&
      result.hostname === expectedHostname &&
      result.action === "contact"
    );
  } catch {
    return false;
  }
}