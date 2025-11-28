import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { CreateProductSchema, CreateProductDto } from '../dtos/CreateProduct.dto';
import { ZodValidationPipe } from '../pipes/zod.pipe';
import { ProductService } from '../services/product.service';

@Controller("api/products")
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  @Post()
  @UsePipes(new ZodValidationPipe(CreateProductSchema))
  async create(@Body() createProductDto: CreateProductDto) {
    return await this.productService.create(createProductDto);
  }
}

