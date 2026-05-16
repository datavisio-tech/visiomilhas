import { z } from "zod";

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
