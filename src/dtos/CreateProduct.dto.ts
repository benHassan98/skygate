import * as z from "zod";

export const CreateProductSchema = z.object({
  sku: z.string().trim().min(3).max(50),

  name: z.string().trim().min(3).max(200),

  description: z.string().trim().nonempty().max(1000),

  category: z.string().trim().min(2).max(100),

  type: z.enum(["public", "private"]).default("public"),

  price: z.coerce.number().gt(0).refine(val => Number(val * 100).toString().split('.').length === 1, {
    error: "price should have only 2 decimal points maximum"
  }),

  discountPrice: z.coerce.number().gte(0),

  quantity: z.coerce.number().gte(0)

}).refine(data => data.discountPrice < data.price, {
  message: "discountPrice should be less than price",
  path: ["discountPrice"]
})
  .partial({
    description: true,
    discountPrice: true
  });

export type CreateProductDto = z.output<typeof CreateProductSchema>;
