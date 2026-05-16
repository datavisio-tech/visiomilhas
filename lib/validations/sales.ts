import { z } from "zod";

export const saleSchema = z.object({
  organizationId: z.union([z.string(), z.number()]),
  programAccountId: z.union([z.string(), z.number()]),
  customerId: z.union([z.string(), z.number()]).optional(),
  points: z.number().int().positive(),
  saleAmountCents: z.number().int().nonnegative(),
  costBasisCents: z.number().int().nonnegative().optional(),
  profitCents: z.number().int().optional(),
  status: z.enum(["draft", "confirmed", "cancelled"]),
  soldAt: z
    .preprocess((v) => (typeof v === "string" ? new Date(v) : v), z.date())
    .optional(),
  description: z.string().max(2000).optional(),
});

export type Sale = z.infer<typeof saleSchema>;
