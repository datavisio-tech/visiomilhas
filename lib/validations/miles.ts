import { z } from "zod";

export const mileEntrySchema = z.object({
  organizationId: z.union([z.string(), z.number()]),
  programAccountId: z.union([z.string(), z.number()]).optional(),
  type: z.string(),
  direction: z.enum(["in", "out"]),
  points: z.number().int().nonnegative(),
  moneyAmountCents: z.number().int().nonnegative().optional(),
  costPerThousandCents: z.number().int().nonnegative().optional(),
  occurredAt: z.preprocess(
    (v) =>
      typeof v === "string" || v instanceof Date ? new Date(v as any) : v,
    z.date(),
  ),
  description: z.string().max(2000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type MileEntry = z.infer<typeof mileEntrySchema>;
