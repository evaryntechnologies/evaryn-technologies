import Link from "next/link";
import BrandLogo from "@/components/brand/BrandLogo";
import { signInExpert } from "../actions";

export default async function ExpertLogin({ searchParams }: { searchParams: Promise<{error?:string}> }) {
  const params = await searchParams;
  return <main className="ev2-expert-login">
    <section className="ev2-expert-login-card">
      <Link href="/" className="ev2-expert-logo" aria-label="Evaryn home"><BrandLogo priority /></Link>
      <span className="ev2-kicker">For Experts</span>
      <h1>Expert Login</h1>
      <p className="ev2-expert-desc">Return to your workspace or check the status of your expert application.</p>
      {params.error && <p className="ev2-expert-error" role="alert">We could not sign you in. Check your email and password, then try again.</p>}
      <form action={signInExpert} className="ev2-expert-form">
        <label>Email address<input type="email" name="email" autoComplete="username" required /></label>
        <label>Password<input type="password" name="password" autoComplete="current-password" required /></label>
        <button type="submit" className="ev2-primary">Log In</button>
      </form>
<p className="mt-4 text-sm"><Link className="font-semibold text-cyan-600 underline underline-offset-4 dark:text-cyan-300" href="/forgot-password?for=experts">Forgot password?</Link></p>
      <p className="ev2-expert-register">New to Evaryn? <Link href="/experts/register">Create an expert account</Link></p>
      <Link href="/" className="ev2-expert-back">Back to homepage</Link>
    </section>
  </main>;
}
