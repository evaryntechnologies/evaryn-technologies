import { setHiringOpening } from "./opening-actions";
export default function HiringControls({openings}:{openings:{slug:string;title:string;isOpen:boolean}[]}) {
 return <section className="mt-8 rounded-xl border border-white/15 bg-[#101F39] p-5">
  <h2 className="text-xl font-semibold">Hiring availability</h2>
  <p className="mt-2 text-sm text-slate-300">Active task categories are listed automatically. Open hiring only for the categories recruiting now. Deactivated or deleted categories are removed from the public Careers list; past applications are preserved.</p>
  <div className="mt-4 grid gap-3 sm:grid-cols-2">{openings.map(o=><form key={o.slug} action={setHiringOpening} className="flex items-center justify-between gap-3 rounded-lg border border-white/15 p-4">
    <span className="min-w-0 break-words">{o.title}</span><input type="hidden" name="slug" value={o.slug}/><input type="hidden" name="open" value={String(!o.isOpen)}/>
    <button className="shrink-0 rounded-lg bg-[#0052CC] px-4 py-2 text-sm font-semibold">{o.isOpen?"Close hiring":"Open hiring"}</button>
  </form>)}</div>
  {!openings.length && <p className="mt-4 text-sm text-cyan-100">No active task categories yet. Add one in Task Categories to make it available here.</p>}
 </section>;
}
