import Image from "next/image";
import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer className="bg-[#071327] text-slate-300">
      <div className="mx-auto grid w-full gap-10 px-6 py-14 md:grid-cols-3 md:px-8">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src="/brand/evaryn-icon.png"
              width={44}
              height={44}
              alt="Evaryn logo"
              className="object-contain"
            />
            <div className="leading-tight">
              <p className="font-bold text-white">
                EVARYN
              </p>
              <p className="text-xs font-medium text-cyan-300">
                TECHNOLOGIES LIMITED
              </p>
            </div>
          </div>

          <p className="mt-5 text-sm">
            Innovation. People. Progress.
          </p>
          <p className="mt-2 text-sm">
            Based in Nairobi, Kenya.
          </p>
        </div>

        <div>
          <h2 className="mb-5 font-semibold text-white">
            Explore
          </h2>
          <div className="flex flex-col gap-3 text-sm">
            <Link href="/services">Our Services</Link>
            <Link href="/how-we-work">How We Work</Link>
            <Link href="/why-evaryn">Why Evaryn</Link>
            <Link href="/careers">Careers</Link>
          </div>
        </div>

        <div>
          <h2 className="mb-5 font-semibold text-white">
            Get in touch
          </h2>
          <div className="flex flex-col gap-3 text-sm">
            <Link href="/contact">Contact Us</Link>
            <Link href="/custom-request">
              Request a Custom Service
            </Link>
            <Link href="/login">Staff Login</Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-6 text-center text-xs text-slate-400">
        © 2026 Evaryn Technologies Limited.
        All rights reserved.
      </div>
    </footer>
  );
}
