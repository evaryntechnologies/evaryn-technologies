import Link from "next/link";

export default function GoogleAuthLink({
  area,
  intent,
}: {
  area: "clients" | "experts";
  intent: "login" | "register";
}) {
  const url = `/auth/google?area=${area}&intent=${intent}`;
  return (
    <div className="my-5">
      <Link
        href={url}
        className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-sky-300/45 bg-white/90 px-4 py-3 text-sm font-semibold text-[#123865] shadow-sm transition hover:border-[#7956AF] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7956AF] dark:border-sky-300/30 dark:bg-[#15345B] dark:text-sky-50"
      >
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M21.35 12.22c0-.72-.06-1.44-.19-2.12H12v4.01h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.15c1.84-1.7 2.9-4.2 2.9-7.28z" />
          <path fill="#34A853" d="M12 21.5c2.63 0 4.84-.87 6.45-2.35l-3.15-2.45c-.87.58-1.98.93-3.3.93-2.54 0-4.68-1.71-5.45-4.01H3.3v2.53A9.74 9.74 0 0 0 12 21.5z" />
          <path fill="#FBBC05" d="M6.55 13.62A5.86 5.86 0 0 1 6.25 12c0-.56.1-1.11.3-1.62V7.85H3.3A9.73 9.73 0 0 0 2.25 12c0 1.57.38 3.05 1.05 4.15l3.25-2.53z" />
          <path fill="#EA4335" d="M12 6.37c1.43 0 2.71.49 3.72 1.46l2.79-2.79A9.26 9.26 0 0 0 12 2.5a9.74 9.74 0 0 0-8.7 5.35l3.25 2.53c.77-2.3 2.91-4.01 5.45-4.01z" />
        </svg>
        Continue with Google
      </Link>
      <p className="mt-2 text-center text-xs text-slate-500 dark:text-sky-200/75">
        Or use your Evaryn email and password below.
      </p>
    </div>
  );
}
