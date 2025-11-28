import { Body, Controller, Post, UseGuards, UsePipes } from '@nestjs/common';
import { CreateProductSchema, CreateProductDto } from '../dtos/CreateProduct.dto';
import { ZodValidationPipe } from '../pipes/zod.pipe';
import { ProductService } from '../services/product.service';
import { BasicGuard } from '../guards/basic.guard';
import { ADMIN, USER } from '../constants/role.constants';


@Controller("api/products")
@UseGuards(new BasicGuard([USER, ADMIN]))
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  @Post()
  @UsePipes(new ZodValidationPipe(CreateProductSchema))
  @UseGuards(new BasicGuard([ADMIN]))
  async create(@Body() createProductDto: CreateProductDto) {
    const createdProduct = await this.productService.create(createProductDto);
    return {
      success: true,
      message: "Product created successfully",
      data: {
        ...createdProduct
      }
    };
  }
}

