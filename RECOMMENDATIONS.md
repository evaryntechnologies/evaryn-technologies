# Evaryn: what to change to win larger accounts

The redesign makes the site look like an established delivery company. These are the content and credibility gaps that decide whether a procurement or engineering lead says yes. Ordered by impact.

## 1. Proof (highest impact)
- Fill `proofPoints`, `testimonials` and `clientNames` in `lib/site.ts` the moment you have real, approved items. Until then the site honestly offers a pilot instead. Never publish placeholders.
- Turn your first 2 or 3 pilots into short case studies: brief, approach, outcome, one measurable result (accuracy, turnaround, rework rate). Add them in `lib/public-showcase`.
- Publish a redacted sample deliverable and a sample batch quality report. Buyers of data work want to see the artefact.

## 2. Security and data handling (the question every enterprise asks)
- Add a short "Security and data handling" page: where data is stored, who can access it, how team members are vetted, NDA availability, retention and deletion, and Kenya Data Protection Act compliance. Only state what is true today.
- State your data-processing agreement and NDA process in one sentence on the contact page.

## 3. Commercial clarity
- Give indicative turnaround ranges per service (for example "pilot in 5 to 10 working days"), a minimum engagement size, and what a pilot typically costs. Hiding these filters out serious buyers who do not want to guess.
- Name the people: a leadership section with real names, roles and LinkedIn links. Anonymous companies lose to named ones.
- Add registration details (company number, registered address) to the footer.

## 4. Consistency
- Use one email domain everywhere (`evaryninc.com`) and keep the website on the same domain.
- Respond-time promise on the contact form ("we reply within one business day") only if you can keep it.
- Create a one-page PDF capability statement for email attachments.

## 5. Copy rules we applied (keep following them)
- Lead with how you work and under what conditions, not with "we are a platform".
- Every claim must be something you can demonstrate in a pilot.
- Specific beats adjective: "two checks on every batch" beats "high quality".

## Technical notes
- Careers and the extra-services grid read from the database; the services grid now degrades gracefully if the database is unreachable.
- Delete `.env.local` if present; it was only a local-preview placeholder.
- The hero, CTA band and footer are always deep brand gradients so light text on them is readable in both modes. To make the hero pale in light mode, edit the `.ev2-hero` rules in `app/(public)/public.css`.
