import { BadRequestException, ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateProductDto } from '../dtos/CreateProduct.dto';
import { DataSource } from 'typeorm';

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
  getAll() { }
  get() { }
  update() { }
  delete() { }
  getStatistics() { }
}

