import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email().max(254),
  service: z.string().trim().min(2).max(120),
  details: z.string().trim().min(10).max(10000),
});

export type ContactInput = z.infer<typeof contactSchema>;