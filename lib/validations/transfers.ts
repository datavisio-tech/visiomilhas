import { z } from "zod";

export const transferSchema = z
  .object({
    organizationId: z.union([z.string(), z.number()]),
    fromProgramAccountId: z.union([z.string(), z.number()]),
    toProgramAccountId: z.union([z.string(), z.number()]),
    pointsOut: z.number().int().positive(),
    bonusPercent: z.number().min(0).optional().default(0),
    pointsIn: z.number().int().nonnegative().optional(),
    feeCents: z.number().int().nonnegative().optional().default(0),
    status: z.enum(["draft", "confirmed", "cancelled"]),
    transferredAt: z
      .preprocess((v) => (typeof v === "string" ? new Date(v) : v), z.date())
      .optional(),
    description: z.string().max(2000).optional(),
  })
  .refine((data) => data.fromProgramAccountId !== data.toProgramAccountId, {
    message: "fromProgramAccountId and toProgramAccountId must be different",
  });

export type Transfer = z.infer<typeof transferSchema>;
