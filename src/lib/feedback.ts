import { z } from "zod";

export const FEEDBACK_SUBJECTS = [
  { key: "general", label: "fb.s.general" },
  { key: "bug", label: "fb.s.bug" },
  { key: "feature", label: "fb.s.feature" },
  { key: "product", label: "fb.s.product" },
  { key: "category", label: "fb.s.category" },
  { key: "account", label: "fb.s.account" },
  { key: "privacy", label: "fb.s.privacy" },
] as const;

export type FeedbackSubject = (typeof FEEDBACK_SUBJECTS)[number]["key"];

export const feedbackSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  subject: z.enum(FEEDBACK_SUBJECTS.map((s) => s.key) as [FeedbackSubject, ...FeedbackSubject[]]),
  message: z.string().trim().min(10).max(2000),
});
