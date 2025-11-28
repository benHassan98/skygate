import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { GlobalHttpExceptionFilter } from './../src/filters/global.filter';
import { resolve } from 'node:path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { ProductModule } from './../src/modules/product.module';
import { DataSource } from 'typeorm';

describe('ProductController (e2e)', () => {
  jest.setTimeout(60000)
  let app: INestApplication<App>;
  let container;
  let dataSource: DataSource;


  beforeAll(async () => {
    const initScriptPath = resolve(__dirname, "../", "schema.sql");
    container = await new PostgreSqlContainer("postgres:18")
      .withBindMounts([{ source: initScriptPath, target: "/docker-entrypoint-initdb.d/schema.sql" }])
      .start();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: "postgres",
          host: container.getHost(),
          port: container.getPort(),
          username: container.getUsername(),
          password: container.getPassword(),
          database: container.getDatabase(),
          entities: [],
        }),
        ProductModule,
      ]
    })
      .compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get<DataSource>(DataSource);

    app.useGlobalFilters(new GlobalHttpExceptionFilter());
    await app.init();
  });
  afterEach(async () => {
    console.log("DELETING ROWS");
    await dataSource.manager.query("TRUNCATE products");
    console.log("ROWS DELETED");
  });
  it('/api/products (POST) only admin can create a product', async () => {
    const testObj = {
      sku: "sku",
      name: "name",
      description: "description",
      category: "category",
      price: 10,
      discountPrice: 5,
      quantity: 55
    };
    await request(app.getHttpServer())
      .post('/api/products')
      .send(testObj)
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/products')
      .set("x-user-role", "admin")
      .send(testObj)
      .expect(201);

  });

  it('/api/products (POST) create a product with existing sku', async () => {
    const testObj = {
      sku: "sku",
      name: "name",
      description: "description",
      category: "category",
      price: 10,
      discountPrice: 5,
      quantity: 55
    };
    await request(app.getHttpServer())
      .post('/api/products')
      .set("x-user-role", "admin")
      .send(testObj)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/products')
      .set("x-user-role", "admin")
      .send(testObj)
      .expect(409);

  });
});
