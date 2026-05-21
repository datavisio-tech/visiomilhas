import { z } from "zod";

export const createTransferSchema = z
  .object({
    orgSlug: z.string().optional(),
    fromAccountId: z.string().transform((s) => Number(s)),
    toAccountId: z.string().transform((s) => Number(s)),
    pointsSent: z
      .string()
      .transform((s) => Number(s))
      .refine((n) => n > 0, "points must be > 0"),
    bonusPercent: z
      .string()
      .optional()
      .transform((s) => (s ? Number(s) : 0)),
    feeCents: z
      .string()
      .optional()
      .transform((s) => (s ? Number(s) : 0)),
    transferredAt: z.string().optional(),
    description: z.string().max(1024).optional(),
  })
  .refine((d) => d.fromAccountId !== d.toAccountId, {
    message: "from and to accounts must differ",
  });

export type CreateTransferInput = z.infer<typeof createTransferSchema>;

export default createTransferSchema;

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
