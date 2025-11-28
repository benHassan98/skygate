CREATE DATABASE skygate;

CREATE TYPE type_status AS ENUM ('public', 'private');

CREATE TABLE IF NOT EXISTS products (
id integer primary key GENERATED ALWAYS AS IDENTITY,
sku varchar(50) unique not null,
name varchar(200) not null,
description varchar(1000),
category varchar(100) not null,
type type_status default 'public',
price decimal(10, 2) not null,
discount_price decimal(10, 2),
quantity int not null,
createdAt timestamp default NOW(),
updatedAt timestamp default NOW()
);
CREATE INDEX products_idx ON products(id) INCLUDE(sku, category, type);
CREATE INDEX products_sku_idx ON products(sku) INCLUDE(id, category, type);
CREATE INDEX products_category_idx ON products(category) INCLUDE(id, sku, type);

