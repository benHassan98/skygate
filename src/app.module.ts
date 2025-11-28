import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ProductModule } from './modules/product.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ".env.example"
    }),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST,
      port: process.env.DB_PORT as (number | undefined),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB,
      entities: [],
    }),
    ProductModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
