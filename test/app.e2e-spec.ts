import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { GlobalHttpExceptionFilter } from './../src/filters/global.filter';
import { resolve } from 'node:path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { ProductModule } from 'src/modules/product.module';

describe('ProductController (e2e)', () => {
  jest.setTimeout(60000)
  let app: INestApplication<App>;
  let container;


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

    app.useGlobalFilters(new GlobalHttpExceptionFilter());
    await app.init();
  },);

  it('/api/products (POST)', (done) => {
    const testObj = {
      sku: "sku",
      name: "Hell",
      description: "description",
      category: "category",
      price: 10,
      discountPrice: 5,
      quantity: 55
    };
    request(app.getHttpServer())
      .post('/api/products')
      .send(testObj)
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        return done(res);
      });
  });
});
