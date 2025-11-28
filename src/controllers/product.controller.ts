import { Body, Controller, Get, Post, Query, UseGuards, UsePipes, Headers, ParseIntPipe, Param, Put, Delete } from '@nestjs/common';
import { CreateProductSchema, CreateProductDto } from '../dtos/CreateProduct.dto';
import { UpdateProductSchema, UpdateProductDto } from '../dtos/UpdateProduct.dto';
import { ZodValidationPipe } from '../pipes/zod.pipe';
import { ProductService } from '../services/product.service';
import { BasicGuard } from '../guards/basic.guard';
import { ADMIN, USER } from '../constants/role.constants';
import { GetAllDto, GetAllSchema } from '../dtos/GetAll.dto';


@Controller("api/products")
@UseGuards(new BasicGuard([USER, ADMIN]))
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  @Get("health")
  getHealth() {
    return { status: "UP" };
  }

  @Get("stats")
  @UseGuards(new BasicGuard([ADMIN]))
  async stats() {
    const data = await this.productService.getStatistics();
    return {
      success: true,
      message: "Statistics retrieved successfully",
      data,
    };
  }

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

  @Get()
  @UsePipes(new ZodValidationPipe(GetAllSchema))
  async getAll(@Query() getAllDto: GetAllDto, @Headers("x-user-role") role: string) {
    const { data, pagination } = await this.productService.getAll(getAllDto, role)
    return {
      success: true,
      message: "Products retrieved successfully",
      data,
      pagination
    };
  }

  @Get(":id")
  async get(@Param("id", ParseIntPipe) id: number, @Headers("x-user-role") role: string) {
    const data = await this.productService.get(id, role);
    return {
      success: true,
      message: "Product retrieved successfully",
      data,
    };
  }

  @Put(":id")
  @UseGuards(new BasicGuard([ADMIN]))
  async update(@Param("id") id: string, @Body(new ZodValidationPipe(UpdateProductSchema)) updateProductDto: UpdateProductDto) {
    const data = await this.productService.update(parseInt(id), updateProductDto);
    return {
      success: true,
      message: "Product updated successfully",
      data,
    };
  }

  @Delete(":id")
  @UseGuards(new BasicGuard([ADMIN]))
  async delete(@Param("id", ParseIntPipe) id: number) {
    const data = await this.productService.delete(id);
    return {
      success: true,
      message: "Product deleted successfully",
      data,
    };
  }




}

