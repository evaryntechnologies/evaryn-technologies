/**
 * Public-approved showcase records ONLY. Never include client-identifying
 * details, images or outcome metrics without client permission and evidence.
 * Adding records here requires a new review and deployment.
 */
export type PublicProject = {
  slug: string;
  title: string;
  category: string;
  challenge: string;
  approach: string;
  outcome: string;
  published: boolean;
};
export type PublicReview = {
  id: string;
  quote: string;
  attribution: string;
  projectSlug?: string;
  published: boolean;
};
export const projects: PublicProject[] = [];
export const reviews: PublicReview[] = [];
export const publishedProjects = projects.filter((p) => p.published);
export const publishedReviews = reviews.filter((r) => r.published);
