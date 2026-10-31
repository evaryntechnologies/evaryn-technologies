import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";

const explore = [
  { label: "Our Services", href: "/services" },
  { label: "How We Work", href: "/how-we-work" },
  { label: "Why Evaryn", href: "/why-evaryn" },
  { label: "Careers", href: "/careers" },
];

const touch = [
  { label: "Contact Us", href: "/contact" },
  { label: "Request a Custom Service", href: "/custom-request" },
  { label: "Staff Login", href: "/portal/login" },
];

const linkCls =
  "w-fit text-sm text-white/80 underline-offset-4 transition hover:text-[#52caff] hover:underline";

export default function PublicFooter() {
  return (
    <footer
      className="relative isolate overflow-hidden text-white"
      style={{
        background:
          "linear-gradient(160deg,var(--ev-hero-from),var(--ev-hero-via) 70%,var(--ev-hero-to))",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[url('/watermarks/evaryn-watermark.svg')] bg-[position:right_-60px_center] bg-no-repeat opacity-[0.07]"
      />
      <div className="h-1 w-full bg-[#00b0f8]" aria-hidden="true" />

      <div className="mx-auto grid w-full max-w-[1400px] gap-12 px-6 py-14 md:grid-cols-[1.4fr_1fr_1fr] md:px-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-[#f3fbff] p-2">
              <Image
                src="/brand/evaryn-icon.png"
                width={40}
                height={40}
                alt="Evaryn logo"
                className="object-contain"
              />
            </span>
            <div className="leading-tight">
              <p className="text-lg font-bold tracking-wide">EVARYN</p>
              <p className="text-xs font-semibold tracking-widest text-[#52caff]">
                TECHNOLOGIES LIMITED
              </p>
            </div>
          </div>

          <p className="mt-6 text-base font-semibold text-[#52caff]">
            Innovation. People. Progress.
          </p>
          <p className="mt-4 flex items-center gap-2 text-sm text-white/80">
            <MapPin size={16} aria-hidden="true" />
            Based in Nairobi, Kenya.
          </p>
        </div>

        <nav aria-label="Explore">
          <h2 className="mb-5 text-sm font-bold uppercase tracking-widest text-[#52caff]">
            Explore
          </h2>
          <div className="flex flex-col gap-3">
            {explore.map((l) => (
              <Link key={l.href} href={l.href} className={linkCls}>
                {l.label}
              </Link>
            ))}
          </div>
        </nav>

        <nav aria-label="Get in touch">
          <h2 className="mb-5 text-sm font-bold uppercase tracking-widest text-[#52caff]">
            Get in touch
          </h2>
          <div className="flex flex-col gap-3">
            {touch.map((l) => (
              <Link key={l.href} href={l.href} className={linkCls}>
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>

      <div className="border-t border-white/15 px-6 py-6 text-center text-xs text-white/65">
        © 2026 Evaryn Technologies Limited. All rights reserved.
      </div>
    </footer>
  );
}
