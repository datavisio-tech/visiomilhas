import { z } from "zod";

export const createSaleSchema = z.object({
  orgSlug: z.string().optional(),
  accountId: z.string().transform((s) => Number(s)),
  programId: z
    .string()
    .optional()
    .transform((s) => (s ? Number(s) : null)),
  points: z
    .string()
    .transform((s) => Number(s))
    .refine((n) => n > 0, "points must be > 0"),
  totalAmountCents: z
    .string()
    .transform((s) => Number(s))
    .refine((n) => n >= 0, "totalAmountCents must be >= 0"),
  soldAt: z.string().optional(),
  customerName: z.string().max(255).optional(),
  description: z.string().max(1024).optional(),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;

export default createSaleSchema;

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
