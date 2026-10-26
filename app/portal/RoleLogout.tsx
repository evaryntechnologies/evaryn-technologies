import { signOut } from "./actions";

export default function RoleLogout() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
      >
        Log Out
      </button>
    </form>
  );
}