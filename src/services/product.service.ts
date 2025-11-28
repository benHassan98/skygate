import { Injectable } from '@nestjs/common';
import { CreateProductDto } from '../dtos/CreateProduct.dto';
import { DataSource } from 'typeorm';

@Injectable()
export class ProductService {
  constructor(private readonly dateSource: DataSource) { }
  async create(createProductDto: CreateProductDto) {
    try {
      const result = await this.dateSource.manager.query(
        `INSERT INTO products (sku, name, description, category, type, price, discount_price, quantity)
         VALUES ( $1, $2, $3, $4, $5, $6, $7, $8 ) ON CONFLICT (sku) DO NOTHING`,
        [createProductDto.sku, createProductDto.name, createProductDto.description, createProductDto.category,
        createProductDto.type, createProductDto.price, createProductDto.discountPrice, createProductDto.quantity]);
      console.log("result", result);
      const result2 = await this.dateSource.manager.query("SELECT * FROM products");
      console.log("result2", result2);
      return result;
    } catch (err) {
      console.log(err);
    }
  }
  getAll() { }
  get() { }
  update() { }
  delete() { }
  getStatistics() { }
}

