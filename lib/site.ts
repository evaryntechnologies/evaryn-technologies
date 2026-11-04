/**
 * Company facts used across the public website.
 *
 * Anything left empty is simply not shown, so the site never displays a placeholder.
 * Fill these in with REAL information as you have it; investors and clients both respond
 * to specifics, and they check them.
 */
export const site = {
  name: "Evaryn Technologies Limited",
  short: "Evaryn",
  tagline: "Innovation. People. Progress.",
  location: "Nairobi, Kenya",
  /** e.g. "hello@yourdomain.com" - shown on Contact and Investors when set. */
  contactEmail: "contact@evaryninc.com",
  /** e.g. "+254 700 000 000" */
  contactPhone: "+254 712 798 426",
  /** Where investor briefing requests should go, if different from contactEmail. */
  investorEmail: "contact@evaryninc.com",
  /** Add the verified LinkedIn company URL in Vercel Production when supplied. */
  linkedinUrl: process.env.NEXT_PUBLIC_EVARYN_LINKEDIN_URL?.startsWith("https://www.linkedin.com/company/") ? process.env.NEXT_PUBLIC_EVARYN_LINKEDIN_URL : "https://www.linkedin.com/company/evaryntechnologies",
};

/** Real headline numbers, e.g. { value: "250k+", label: "Labels delivered" }. Shown only when filled. */
export const proofPoints: { value: string; label: string }[] = [];

/** Real client quotes. Shown only when filled. */
export const testimonials: { quote: string; name: string; role: string }[] = [];

/** Names of clients you may publicly reference. Shown only when filled. */
export const clientNames: string[] = [];
