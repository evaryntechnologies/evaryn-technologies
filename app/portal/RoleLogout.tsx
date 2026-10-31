import { signOut } from "./actions";

export default function RoleLogout() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="rounded-xl border border-[var(--ev-border)] bg-[var(--ev-surface)] px-5 py-2.5 text-sm font-bold text-[var(--ev-ink)] transition hover:bg-[var(--ev-surface-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
      >
        Log Out
      </button>
    </form>
  );
}
