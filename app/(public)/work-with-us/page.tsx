import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Handshake, TrendingUp, UserPlus, LogIn } from "lucide-react";

export const metadata: Metadata = {
  title: "Partners, Clients & Investors | Evaryn Technologies",
  description: "Open a client account, discuss a delivery partnership, or start an investor conversation with Evaryn Technologies.",
};

export default function WorkWithUs() {
  return (
    <main className="ev2-page">
      <section className="ev2-inner-hero">
        <div className="ev2-shell">
          <span className="ev2-kicker">Work with us</span>
          <h1>Three ways to<br /><em>work with Evaryn.</em></h1>
          <p>As a client with work to deliver, as a partner with capacity needs, or as an investor interested in how we are building. Each starts with a focused conversation.</p>
          <div className="ev2-actions">
            <Link href="/contact#consultation" className="ev2-primary">Book a consultation <ArrowUpRight size={17} /></Link>
            <Link href="/contact" className="ev2-secondary">Send an inquiry</Link>
          </div>
        </div>
      </section>

      <section className="ev2-section ev2-shell" id="clients">
        <span className="ev2-kicker">For clients</span>
        <h2>Your requests and projects, in one secure workspace.</h2>
        <p className="ev2-section-lead">Create a client account to submit briefs and follow each request through scoping and delivery, or sign in to your existing workspace.</p>
        <div className="ev2-two-col">
          <Link className="ev2-card ev2-action-card" href="/clients/register"><UserPlus size={29} /><h3>New client? Create an account.</h3><p>Submit your brief and track your requests from one place.</p><span>Client sign up <ArrowUpRight size={16} /></span></Link>
          <Link className="ev2-card ev2-action-card" href="/clients/login"><LogIn size={29} /><h3>Existing client? Log in.</h3><p>Return to your client dashboard and project requests.</p><span>Client login <ArrowUpRight size={16} /></span></Link>
        </div>
      </section>

      <section className="ev2-section ev2-section-tinted" id="partnerships">
        <div className="ev2-shell">
          <span className="ev2-kicker">Partnerships</span>
          <div className="ev2-split">
            <div><span className="ev2-icon"><Handshake size={26} /></span><h2 style={{ marginTop: "1rem" }}>Add specialist delivery capacity to your offer.</h2></div>
            <div className="ev2-about-intro-body">
              <p>Agencies, technology companies, studios and data providers work with us when they need dependable capacity behind their own client commitments.</p>
              <p>We discuss expected volumes, quality standards, confidentiality and working arrangements up front, and can start with a pilot so both sides see how it runs before committing.</p>
              <Link href="/contact?service=Partnership" className="ev2-textlink">Discuss a partnership <ArrowUpRight size={16} /></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="ev2-section ev2-shell" id="investors">
        <span className="ev2-kicker">Investors & strategic relationships</span>
        <div className="ev2-split">
          <div><span className="ev2-icon"><TrendingUp size={26} /></span><h2 style={{ marginTop: "1rem" }}>Operational discipline as the foundation for growth.</h2></div>
          <div className="ev2-about-intro-body">
            <p>Our direction combines managed specialist delivery, AI data services and an internally built workflow platform that handles assignment, review, QA and payment.</p>
            <p>We share commercial plans and traction directly and responsibly in conversation. We do not publish unsupported financial claims.</p>
            <Link href="/contact?service=Investor%20enquiry" className="ev2-textlink">Request a conversation <ArrowUpRight size={16} /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
