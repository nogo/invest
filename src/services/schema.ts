import z from "zod";

export const FilterSchema = z.object({
  q: z.string().optional(),
});