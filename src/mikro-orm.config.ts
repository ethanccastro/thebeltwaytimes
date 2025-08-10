import { defineConfig } from '@mikro-orm/mysql';
import { Article } from './entities/Article';
import { Category } from './entities/Category';
import { Subcategory } from './entities/Subcategory';
import { SocialUser } from './entities/SocialUser';
import { SocialContent } from './entities/SocialContent';
import 'dotenv/config';

export default defineConfig({
  host: process.env.DB_HOST || 'localhost',
  port: +(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  dbName: process.env.DB_NAME || 'test',
  entities: [Article, Category, Subcategory, SocialUser, SocialContent],
  debug: true,
}); 