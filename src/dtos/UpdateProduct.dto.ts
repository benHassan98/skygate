import * as z from "zod";

export const UpdateProductSchema = z.object({
  name: z.string().trim().min(3).max(200),

  price: z.coerce.number().gt(0).refine(val => Number(val * 100).toString().split('.').length === 1, {
    error: "price should have only 2 decimal points maximum"
  }),

  quantity: z.coerce.number().gte(0)
})
  .partial();
export type UpdateProductDto = z.output<typeof UpdateProductSchema>;
