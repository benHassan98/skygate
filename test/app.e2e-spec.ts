import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { GlobalHttpExceptionFilter } from './../src/filters/global.filter';

describe('ProductController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new GlobalHttpExceptionFilter());
    await app.init();
  });

  it('/api/products (POST)', (done) => {
    const testObj = {
      sku: "sku",
      name: "Hell",
      price: 0,
      quantity: 55
    };
    request(app.getHttpServer())
      .post('/api/products')
      .send(testObj)
      .expect(400)
      .end((err, res) => {
        if (err) return done(err);
        return done(res);
      });
  });
});
