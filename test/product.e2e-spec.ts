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
  it('/api/products (GET)', async () => {
    const testObj = {
      sku: "LAPTOP-001",
      name: "Gaming Laptop",
      category: "Electronics",
      type: "public",
      price: 1299.99,
      discountPrice: 1099.99,
      quantity: 50
    };
    await request(app.getHttpServer())
      .post('/api/products')
      .set("x-user-role", "admin")
      .send(testObj)
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/api/products')
      .set("x-user-role", "admin")
      .query({ page: 1, limit: 10, category: "Electronics", type: "public", search: "laptop", sort: "price", order: "asc", minPrice: 100, maxPrice: 2000 })
      .expect(200);
    expect(res.body.data.length).toBe(1);
  });

  it('/api/products/:id (GET) only admin can get private product', async () => {
    const testObj = {
      sku: "LAPTOP-001",
      name: "Gaming Laptop",
      category: "Electronics",
      type: "private",
      price: 1299.99,
      discountPrice: 1099.99,
      quantity: 50
    };
    const product = await request(app.getHttpServer())
      .post('/api/products')
      .set("x-user-role", "admin")
      .send(testObj)
      .expect(201);

    await request(app.getHttpServer())
      .get('/api/products/' + product.body.data.id)
      .set("x-user-role", "user")
      .expect(404);


    await request(app.getHttpServer())
      .get('/api/products/99')
      .set("x-user-role", "admin")
      .expect(404);
  });

  it('/api/products/:id (GET) ', async () => {
    const testObj = {
      sku: "LAPTOP-001",
      name: "Gaming Laptop",
      category: "Electronics",
      type: "public",
      price: 1299.99,
      discountPrice: 1099.99,
      quantity: 50
    };
    const product = await request(app.getHttpServer())
      .post('/api/products')
      .set("x-user-role", "admin")
      .send(testObj)
      .expect(201);

    await request(app.getHttpServer())
      .get('/api/products/' + product.body.data.id)
      .set("x-user-role", "user")
      .expect(200);
  });

  it('/api/products/:id (PUT) ', async () => {
    const testObj = {
      sku: "LAPTOP-001",
      name: "Gaming Laptop",
      category: "Electronics",
      type: "public",
      price: 1299.99,
      discountPrice: 1099.99,
      quantity: 50
    };
    const product = await request(app.getHttpServer())
      .post('/api/products')
      .set("x-user-role", "admin")
      .send(testObj)
      .expect(201);

    await request(app.getHttpServer())
      .put('/api/products/' + product.body.data.id)
      .set("x-user-role", "admin")
      .send({
        price: 1150
      }).expect(200);

    const updatedProduct = await request(app.getHttpServer())
      .get('/api/products/' + product.body.data.id)
      .set("x-user-role", "admin")
      .expect(200);
    expect(updatedProduct.body.data.price * 100).toBe(115000);
  });
  it('/api/products/:id (PUT) price should be greater than discountPrice', async () => {
    const testObj = {
      sku: "LAPTOP-001",
      name: "Gaming Laptop",
      category: "Electronics",
      type: "public",
      price: 1299.99,
      discountPrice: 1099.99,
      quantity: 50
    };
    const product = await request(app.getHttpServer())
      .post('/api/products')
      .set("x-user-role", "admin")
      .send(testObj)
      .expect(201);

    await request(app.getHttpServer())
      .put('/api/products/' + product.body.data.id)
      .set("x-user-role", "admin")
      .send({
        price: 100
      }).expect(400);

    await request(app.getHttpServer())
      .put('/api/products/' + product.body.data.id)
      .set("x-user-role", "admin")
      .send({
        quantity: 100
      }).expect(200);

  });
  it('/api/products/:id (DELETE)', async () => {
    const testObj = {
      sku: "LAPTOP-001",
      name: "Gaming Laptop",
      category: "Electronics",
      type: "public",
      price: 1299.99,
      discountPrice: 1099.99,
      quantity: 50
    };
    const product = await request(app.getHttpServer())
      .post('/api/products')
      .set("x-user-role", "admin")
      .send(testObj)
      .expect(201);

    await request(app.getHttpServer())
      .delete('/api/products/' + product.body.data.id)
      .set("x-user-role", "admin")
      .expect(200);

    await request(app.getHttpServer())
      .delete('/api/products/' + product.body.data.id)
      .set("x-user-role", "admin")
      .expect(404);

  });


  it('/api/products/stats (GET)', async () => {
    for (let i = 0; i < 10; i++) {
      const testObj = {
        sku: "LAPTOP-001" + i.toString(),
        name: "Gaming Laptop",
        category: "Electronics",
        type: "public",
        price: 10000,
        discountPrice: 1000,
        quantity: 50
      };
      await request(app.getHttpServer())
        .post('/api/products')
        .set("x-user-role", "admin")
        .send(testObj)
        .expect(201);
    }

    const res = await request(app.getHttpServer())
      .get('/api/products/stats')
      .set("x-user-role", "admin");

    console.log(res.body);


  });

});
