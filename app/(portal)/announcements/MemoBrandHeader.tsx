import Image from "next/image";

export default function MemoBrandHeader() {
  return <div className="flex flex-wrap items-center gap-4 border-b border-[var(--ev-border)] pb-5">
    <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#E7F6FD] p-2 shadow-sm">
      <Image src="/memo-assets/evaryn-symbol.png" alt="Evaryn official logo mark" width={64} height={64} className="h-14 w-14 object-contain"/>
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-extrabold tracking-[.12em] text-[#156CB5] dark:text-[#8BD9F8]">EVARYN</p>
      <p className="text-xs font-semibold tracking-[.22em] text-[var(--ev-ink)]">TECHNOLOGIES LIMITED</p>
      <p className="mt-1 text-xs text-[#7956AF] dark:text-[#C6AAEF]">INTERNAL MEMORANDUM</p>
    </div>
  </div>;
}
