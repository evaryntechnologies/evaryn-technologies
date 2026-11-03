import type { ReactNode } from "react";

export default function SectionHead({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
}) {
  return (
    <div className="site-head">
      <p className="site-eyebrow">{eyebrow}</p>
      <h2 className="site-h2">{title}</h2>
      {lead && <p className="site-lead">{lead}</p>}
    </div>
  );
}
