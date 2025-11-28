import * as z from "zod";

export const GetAllSchema = z.object({
  page: z.coerce.number().min(1).default(1),

  limit: z.coerce.number().min(1).max(100).default(10),

  category: z.string().trim().min(2).max(100),

  type: z.enum(["public", "private"]),

  search: z.string().trim().nonempty(),

  sort: z.enum(["name", "price", "quantity", "createdAt"]),

  order: z.enum(["asc", "desc"]).default("asc"),

  minPrice: z.coerce.number().gt(0).refine(val => Number(val * 100).toString().split('.').length === 1, {
    error: "min price should have only 2 decimal points maximum"
  }),

  maxPrice: z.coerce.number().gt(0).refine(val => Number(val * 100).toString().split('.').length === 1, {
    error: "max price should have only 2 decimal points maximum"
  })
});

export type GetAllDto = z.output<typeof GetAllSchema>;

