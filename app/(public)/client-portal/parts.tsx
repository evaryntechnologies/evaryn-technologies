import { Check } from "lucide-react";
import { STAGES, stepIndex, type Stage } from "@/lib/client-orders";

const LABEL: Record<Stage, string> = {
  TASKING: "Tasking", REVIEW: "In review", QA: "Quality assurance", READY: "Final checks complete",
  DELIVERED: "Delivered", COMPLETED: "Completed", CANCELED: "Canceled",
};
const TONE: Record<Stage, string> = {
  TASKING: "cyan", REVIEW: "blue", QA: "violet", READY: "violet", DELIVERED: "green", COMPLETED: "green", CANCELED: "slate",
};

export function StagePill({ stage, revision }: { stage: Stage; revision?: boolean }) {
  return (
    <span className="cp-badges">
      <span className={`cp-pill cp-pill--${TONE[stage]}`}>{LABEL[stage]}</span>
      {revision && <span className="cp-pill cp-pill--amber">Revision in progress</span>}
    </span>
  );
}

/** Four-step tracker: Tasking, Review, Quality assurance, Delivered. */
export function OrderTracker({ stage }: { stage: Stage }) {
  if (stage === "CANCELED") return <p className="cp-note">This order was canceled.</p>;
  const finished = stage === "DELIVERED" || stage === "COMPLETED";
  const current = stepIndex(stage);
  return (
    <ol className="cp-tracker" aria-label="Order progress">
      {STAGES.map((s, i) => {
        const state = finished || i < current ? "done" : i === current ? "active" : "todo";
        return (
          <li key={s.key} data-state={state} aria-current={state === "active" ? "step" : undefined}>
            <span className="cp-dot">{state === "done" ? <Check size={14} aria-hidden="true" /> : i + 1}</span>
            <span className="cp-step-label">{s.label}</span>
            {state === "active" && <span className="cp-step-hint">{s.hint}</span>}
          </li>
        );
      })}
    </ol>
  );
}
