import { EntityManager } from '@mikro-orm/core';
import { Article } from '../entities/Article';
import { Category } from '../entities/Category';
import { BaseService } from './baseService';

export class StaticService extends BaseService {
  constructor(em: EntityManager) {
    super(em);
  }

  /**
   * Fetches all articles published in the last 30 days for the homepage.
   * This is more efficient than making separate queries for each section.
   */
  async getHomepageArticles(): Promise<Article[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 90);

    const sql = `${this.baseArticleQuery}
                 WHERE a.article_publishedat >= ?
                 ORDER BY a.article_publishedat DESC;`;

    const results = await this.execute<any[]>(sql, [thirtyDaysAgo]);
    return this.mapArticleResults(results);
  }

  async getFeaturedArticles(limit: number = 5): Promise<Article[]> {
    const results = await this.execute<any[]>(`${this.baseArticleQuery} WHERE a.article_featured = TRUE ORDER BY a.article_publishedat DESC LIMIT ?;`, [limit]);
    return this.mapArticleResults(results);
  }

  async getOpinionArticles(limit: number = 5): Promise<Article[]> {
    const results = await this.execute<any[]>(`${this.baseArticleQuery} WHERE a.article_isopinion = TRUE ORDER BY a.article_publishedat DESC LIMIT ?;`, [limit]);
    return this.mapArticleResults(results);
  }

  async getMainArticles(limit: number = 10): Promise<Article[]> {
    const results = await this.execute<any[]>(`${this.baseArticleQuery} WHERE a.article_main = TRUE ORDER BY a.article_publishedat DESC LIMIT ?;`, [limit]);
    return this.mapArticleResults(results);
  }

  async getTrendingArticles(limit: number = 5): Promise<Article[]> {
    const results = await this.execute<any[]>(`${this.baseArticleQuery} WHERE a.article_trending = TRUE ORDER BY a.article_publishedat DESC LIMIT ?;`, [limit]);
    return this.mapArticleResults(results);
  }

  async getCategoryBlockArticles(): Promise<{ [categorySlug: string]: Article[] }> {
    const categories = await this.getAllCategories();
    const result: { [categorySlug: string]: Article[] } = {};
    for (const category of categories) {
      const sql = `${this.baseArticleQuery} WHERE a.article_categoryrowguid = ? AND a.article_categoryblock = TRUE ORDER BY a.article_publishedat DESC;`;
      const articles = await this.execute<any[]>(sql, [category.category_rowguid]);
      if (articles.length > 0) {
        result[category.category_slug] = this.mapArticleResults(articles);
      }
    }
    return result;
  }

  async searchArticles(query: string, limit: number = 20): Promise<Article[]> {
    const searchTerm = `%${query}%`;
    const params = [searchTerm, searchTerm, searchTerm, searchTerm, limit];
    const sql = `${this.baseArticleQuery} WHERE a.article_headline LIKE ? OR a.article_excerpt LIKE ? OR a.article_content LIKE ? OR a.article_tags LIKE ? ORDER BY a.article_publishedat DESC LIMIT ?;`;
    const results = await this.execute<any[]>(sql, params);
    return this.mapArticleResults(results);
  }

  async getAllCategories(): Promise<Category[]> {
    const sql = 'SELECT * FROM category ORDER BY category_name ASC;';
    return await this.execute(sql);
  }

  async getCategoriesWithSubcategories(): Promise<any[]> {
    const sql = `
      SELECT c.*, s.subcategory_rowguid as sub_id, s.subcategory_name, s.subcategory_slug
      FROM category c
      LEFT JOIN subcategory s ON c.category_rowguid = s.subcategory_categoryrowguid
      ORDER BY c.category_name ASC;
    `;
    return await this.execute(sql);
  }

  async getAllArticles(): Promise<Article[]> {
    const results = await this.execute<any[]>(`${this.baseArticleQuery} ORDER BY a.article_publishedat DESC;`);
    return this.mapArticleResults(results);
  }
}