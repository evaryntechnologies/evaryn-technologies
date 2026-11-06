import { createClientRequest } from "../../../clients/actions";

export default async function NewClientRequest({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const p = await searchParams;
  return (
    <main className="cp-page cp-narrow">
      <div className="cp-head"><div><h1 className="cp-title">New project request</h1><p className="cp-sub">Tell Evaryn about the work you need. Every request is reviewed before it becomes an active order.</p></div></div>
      {p.error && <p role="alert" className="cp-flash cp-flash--err">{p.error === "rate" ? "Too many requests in a short time. Please try again later." : "Please check your title, service and description."}</p>}
      <form action={createClientRequest} className="cp-panel cp-form">
        <label>Project title<input required minLength={5} maxLength={180} name="title" placeholder="e.g. Annotate 12,000 LiDAR frames" /></label>
        <label>Service required
          <select name="service" required defaultValue="">
            <option value="" disabled>Select a service</option>
            <option>AI Data Annotation</option><option>AI Training Data Operations</option><option>Technical Writing</option>
            <option>Non-Technical Writing</option><option>Video Editing</option><option>Website Development</option><option>Other</option>
          </select>
        </label>
        <label>Project details<small>At least 30 characters. Include volume, deadline and target format.</small>
          <textarea required minLength={30} maxLength={10000} rows={8} name="details" />
        </label>
        <div><button className="ev2-primary">Submit request</button></div>
      </form>
    </main>
  );
}
