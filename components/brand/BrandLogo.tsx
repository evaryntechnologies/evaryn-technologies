import Image from "next/image";

/**
 * The full Evaryn logo on a transparent background.
 * Light mode uses the original colours; dark mode swaps to a variant whose deep-blue
 * parts (the tagline and the "A") are lifted so they stay readable on the navy pages.
 * Size it with `className` (for example "h-12 w-auto").
 */
export default function BrandLogo({
  className = "",
  priority = false,
  tone = "auto",
}: {
  className?: string;
  priority?: boolean;
  /** "auto" follows the theme; "dark-surface" always uses the lifted variant (for navy/gradient bands). */
  tone?: "auto" | "dark-surface";
}) {
  const w = 1400;
  const h = 428;
  if (tone === "dark-surface") {
    return (
      <Image src="/brand/evaryn-full-dark.png" alt="Evaryn Technologies Limited" width={w} height={h} priority={priority} className={className} />
    );
  }
  return (
    <>
      <Image src="/brand/evaryn-full-trimmed.png" alt="Evaryn Technologies Limited" width={w} height={h} priority={priority} className={`${className} dark:hidden`} />
      <Image src="/brand/evaryn-full-dark.png" alt="" aria-hidden="true" width={w} height={h} priority={priority} className={`${className} hidden dark:block`} />
    </>
  );
}
