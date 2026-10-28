import { setHiringOpening } from "./opening-actions";
const names: Record<string, string> = {
 "technical-writer":"Technical Writer", "content-writer":"Content Writer", "data-annotator":"Data Annotator", "video-editor":"Video Editor"
};
export default function HiringControls({openings}:{openings:{slug:string;isOpen:boolean}[]}) {
 return <section className="mt-8 rounded-xl border border-white/15 bg-[#101F39] p-5">
  <h2 className="text-xl font-semibold">Hiring availability</h2>
  <p className="mt-2 text-sm text-slate-300">Only open roles appear for applications. Turning a role off does not delete past applications.</p>
  <div className="mt-4 grid gap-3 sm:grid-cols-2">{openings.map(o=><form key={o.slug} action={setHiringOpening} className="flex items-center justify-between gap-3 rounded-lg border border-white/15 p-4">
    <span>{names[o.slug] ?? o.slug}</span><input type="hidden" name="slug" value={o.slug}/><input type="hidden" name="open" value={String(!o.isOpen)}/>
    <button className="rounded-lg bg-[#0052CC] px-4 py-2 text-sm font-semibold">{o.isOpen?"Close hiring":"Open hiring"}</button>
  </form>)}</div>
 </section>;
}
