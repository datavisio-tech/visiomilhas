import { z } from "zod";

export const programCreateSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(["airline", "bank", "hotel", "cashback", "other"]),
  provider: z.string().optional(),
  currencyName: z.string().min(1).max(50),
  isActive: z.boolean().default(true),
});

export type ProgramCreate = z.infer<typeof programCreateSchema>;
