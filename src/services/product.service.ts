import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from '../dtos/CreateProduct.dto';
import { DataSource } from 'typeorm';
import { GetAllDto } from '../dtos/GetAll.dto';
import { ADMIN, USER } from '../constants/role.constants';
import { UpdateProductDto } from '../dtos/UpdateProduct.dto';

@Injectable()
export class ProductService {
  constructor(private readonly dateSource: DataSource) { }
  async create(createProductDto: CreateProductDto) {
    try {
      const result = await this.dateSource.manager.query(
        `INSERT INTO products (sku, name, description, category, type, price, discount_price, quantity)
         VALUES ( $1, $2, $3, $4, $5, $6, $7, $8 ) ON CONFLICT (sku) DO NOTHING RETURNING *`,
        [createProductDto.sku, createProductDto.name, createProductDto.description, createProductDto.category,
        createProductDto.type, createProductDto.price, createProductDto.discountPrice, createProductDto.quantity]);
      if (result.length === 0) {
        throw new ConflictException({
          code: "DUPLICATE_SKU",
          details: [{
            field: "sku",
            message: "value already exists"
          }]
        });
      }
      return result[0];
    } catch (err) {
      if (err instanceof ConflictException) {
        throw err;
      }
      throw new InternalServerErrorException({
        code: "DATABASE_ERROR",
        details: []
      });
    }
  }
  async getAll(getAllDto: GetAllDto, role: string) {
    const productTypes = ["public"];
    const offset = (getAllDto.page - 1) * getAllDto.limit;
    if (role.toLowerCase() === ADMIN) {
      productTypes.push("private");
    }
    try {
      const result = await this.dateSource.manager.query(
        `SELECT * FROM products WHERE category = $1 AND type = ANY($2) AND (name ILIKE $3 OR description ILIKE $3)
         AND price >= $4 AND price <= $5 ORDER BY ${getAllDto.sort} ${getAllDto.order} LIMIT $6 OFFSET $7`,
        [getAllDto.category, productTypes, "%" + getAllDto.search + "%",
        getAllDto.minPrice, getAllDto.maxPrice, getAllDto.limit, offset
        ]);
      const count = await this.dateSource.manager.query("SELECT COUNT(*) FROM products");
      const cnt = +count[0]["count"];

      return {
        data: result,
        pagination: {
          currentPage: getAllDto.page,
          totalPages: Math.floor(cnt / getAllDto.limit),
          totalItems: cnt,
          itemsPerPage: getAllDto.limit,
          hasPreviousPage: Boolean(offset),
          hasNextPage: Boolean((result.length + offset) < cnt)
        }
      };
    } catch (err) {
      throw new InternalServerErrorException({
        code: "DATABASE_ERROR",
        details: []
      });
    }

  }
  async get(id: number, role: string) {
    const productTypes = ["public", "private"];
    if (role.toLowerCase() === USER) {
      productTypes.pop();
    }
    try {
      const result = await this.dateSource.manager.query("SELECT * FROM products WHERE id = $1 AND type = ANY($2)",
        [id, productTypes]);
      if (result.length === 0) {
        throw new NotFoundException({
          code: "NOT_FOUND",
          details: {
            resource: "Product",
            id
          }
        });
      }
      return result[0];
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException({
        code: "DATABASE_ERROR",
        details: []
      });
    }


  }
  async update(id: number, updateProductDto: UpdateProductDto) {
    try {
      await this.dateSource.manager.query("BEGIN");
      let result;
      const exist = await this.dateSource.manager.query("SELECT id FROM products WHERE id = $1 FOR UPDATE", [id]);
      if (exist.length === 0) {
        await this.dateSource.manager.query("COMMIT");
        throw new NotFoundException({
          code: "NOT_FOUND",
          details: {
            resource: "Product",
            id
          }
        });
      }

      if (updateProductDto.price) {
        result = await this.dateSource.manager.query(
          `UPDATE products SET name = COALESCE($1, name), price = $2, quantity = COALESCE($3, quantity),
         updatedAt = NOW()
         WHERE id = $4 AND discount_price < $2 RETURNING *`,
          [updateProductDto.name, updateProductDto.price, updateProductDto.quantity, id]
        );
      } else {
        result = await this.dateSource.manager.query(
          `UPDATE products SET name = COALESCE($1, name), quantity = COALESCE($2, quantity),
         updatedAt = NOW()
         WHERE id = $3 RETURNING *`,
          [updateProductDto.name, updateProductDto.quantity, id]
        );
      }
      await this.dateSource.manager.query("COMMIT");
      if (result[0].length === 0) {
        throw new BadRequestException({
          code: "VALIDATION_ERROR",
          details: {
            field: "discountPrice",
            message: "discountPrice should be less than price"
          }
        });
      }
      return result[0];
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw err;
      } else if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException({
        code: "DATABASE_ERROR",
        details: []
      });
    }
  }
  async delete(id: number) {
    try {
      const result = await this.dateSource.manager.query("DELETE FROM products WHERE id = $1 RETURNING id, sku", [id]);
      if (result[0].length === 0) {
        throw new NotFoundException({
          code: "NOT_FOUND",
          details: {
            resource: "Product",
            id
          }
        });
      }
      return result[0];
    } catch (err) {
      if (err instanceof NotFoundException) {
        throw err;
      }
      throw new InternalServerErrorException({
        code: "DATABASE_ERROR",
        details: []
      });
    }
  }
  async getStatistics() {
    try {
      const result = await this.dateSource.manager.query(`
      SELECT COUNT(*) AS totalProducts, SUM(price * quantity) AS totalInventoryValue,
      SUM(quantity * COALESCE(discount_price, 0)) AS totalDiscountedValue FROM products`);
      result[0]["averagePrice"] = Math.floor(+result[0]["totalinventoryvalue"] / +result[0]["totalproducts"]);

      const outOfStockCount = await this.dateSource.manager.query("SELECT COUNT(*) AS cnt FROM products WHERE quantity = 0");
      result[0]["outOfStockCount"] = outOfStockCount[0]["cnt"];

      const productsByCategory = await this.dateSource.manager.query(`
      SELECT category, COUNT(*), SUM(price * quantity) AS totalValue FROM products GROUP BY category`);

      const productsByType = await this.dateSource.manager.query(`
      SELECT type, COUNT(*), SUM(price * quantity) AS totalValue FROM products GROUP BY type`);

      return {
        ...result[0],
        productsByCategory: productsByCategory,
        productsByType: productsByType
      }
    } catch (err) {
      throw new InternalServerErrorException({
        code: "DATABASE_ERROR",
        details: []
      });
    }
  }
}

