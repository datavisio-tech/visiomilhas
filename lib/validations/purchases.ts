import { z } from "zod";

export const createPurchaseSchema = z.object({
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
  totalCostCents: z
    .string()
    .transform((s) => Number(s))
    .refine((n) => n >= 0, "totalCostCents must be >= 0"),
  purchasedAt: z.string().optional(),
  description: z.string().max(1024).optional(),
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;

export default createPurchaseSchema;

export const purchaseSchema = z
  .object({
    organizationId: z.union([z.string(), z.number()]),
    programAccountId: z.union([z.string(), z.number()]),
    points: z.number().int().positive(),
    totalCostCents: z.number().int().nonnegative(),
    costPerThousandCents: z.number().int().nonnegative().optional(),
    expectedReceiptDate: z
      .preprocess((v) => (typeof v === "string" ? new Date(v) : v), z.date())
      .optional(),
    status: z.enum(["pending", "received", "cancelled"]),
    description: z.string().max(2000).optional(),
  })
  .refine((data) => {
    if (data.points && data.totalCostCents) return true;
    return true;
  });

export type Purchase = z.infer<typeof purchaseSchema>;
