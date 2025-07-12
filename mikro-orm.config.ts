import { defineConfig } from '@mikro-orm/mysql';
import { Article } from './src/entities/Article';
import { Category } from './src/entities/Category';
import { Subcategory } from './src/entities/Subcategory';
import 'dotenv/config';

export default defineConfig({
  host: process.env.DB_HOST || 'localhost',
  port: +(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  dbName: process.env.DB_NAME || 'news_site',
  entities: [Article, Category, Subcategory],
  debug: true,
}); 