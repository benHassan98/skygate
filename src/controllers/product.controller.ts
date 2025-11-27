import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { CreateProductSchema, CreateProductDto } from '../dtos/CreateProduct.dto';
import { ZodValidationPipe } from '../pipes/zod.pipe';

@Controller("api/products")
export class ProductController {
  @Post()
  @UsePipes(new ZodValidationPipe(CreateProductSchema))
  create(@Body() createProductDto: CreateProductDto) {
    console.log("result", createProductDto);
    return "Hell";
  }
}

