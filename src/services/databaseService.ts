import { EntityManager } from '@mikro-orm/core';
import { Article } from '../entities/Article';
import { Category } from '../entities/Category';
import { Subcategory } from '../entities/Subcategory';
import { v4 as uuidv4 } from 'uuid';
import { SocialUser } from '../entities/SocialUser';
import { SocialContent } from '../entities/SocialContent';

export class DatabaseService {
  private em: EntityManager;

  constructor(em: EntityManager) {
    this.em = em;
  }

  /**
   * Helper to execute raw SQL queries.
   */
  private async execute<T = any[]>(sql: string, params: any[] = []): Promise<T> {
    return this.em.getConnection('write').execute(sql, params);
  }

  /**
   * Helper to map flat SQL results into a nested Article object.
   */
  private mapArticleResults(rows: any[]): Article[] {
    return rows.map(row => {
        const article: Article = { ...row };

        // **FIX**: Convert the date string from the DB into a true Date object.
        if (row.article_publishedat) {
            article.article_publishedat = new Date(row.article_publishedat);
        }

        // Map Category
        if (row.category_slug && row.article_categoryrowguid) {
            article.article_categoryrowguid = {
                category_rowguid: row.article_categoryrowguid,
                category_name: row.category_name,
                category_slug: row.category_slug,
            } as Category;
        }
        // Map Subcategory
        if (row.subcategory_slug && row.article_subcategoryrowguid) {
            article.article_subcategoryrowguid = {
                subcategory_rowguid: row.article_subcategoryrowguid,
                subcategory_name: row.subcategory_name,
                subcategory_slug: row.subcategory_slug,
            } as Subcategory;
        }
        return article;
    });
  }

  // Admin stats method
  async getAdminStats() {
    const [
      [{ totalArticles }],
      [{ totalCategories }],
      [{ totalSubcategories }],
      [{ totalSocialUsers }],
      [{ totalSocialContents }]
    ] = await Promise.all([
      this.execute<{ totalArticles: number }[]>('SELECT COUNT(*) as totalArticles FROM article;'),
      this.execute<{ totalCategories: number }[]>('SELECT COUNT(*) as totalCategories FROM category;'),
      this.execute<{ totalSubcategories: number }[]>('SELECT COUNT(*) as totalSubcategories FROM subcategory;'),
      this.execute<{ totalSocialUsers: number }[]>('SELECT COUNT(*) as totalSocialUsers FROM socialuser;'),
      this.execute<{ totalSocialContents: number }[]>('SELECT COUNT(*) as totalSocialContents FROM socialcontent;')
    ]);

    return { totalArticles, totalCategories, totalSubcategories, totalSocialUsers, totalSocialContents };
  }

  // Category methods
  async getAllCategories(): Promise<Category[]> {
    const sql = 'SELECT * FROM category ORDER BY category_name ASC;';
    return await this.execute(sql);
  }

  async getCategoriesWithSubcategories(): Promise<any[]> {
    const sql = `
      SELECT c.*, s.subcategory_rowguid as sub_id, s.subcategory_name, s.subcategory_slug
      FROM category c
      LEFT JOIN subcategory s ON c.category_rowguid = s.category_rowguid
      ORDER BY c.category_name ASC;
    `;
    return await this.execute(sql);
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const [category] = await this.execute<Category[]>('SELECT * FROM category WHERE category_slug = ? LIMIT 1;', [slug]);
    return category || null;
  }

  async getCategoryById(id: string): Promise<Category | null> {
    const [category] = await this.execute<Category[]>('SELECT * FROM category WHERE category_rowguid = ? LIMIT 1;', [id]);
    return category || null;
  }

  async createCategory(categoryData: any): Promise<any> {
    const columns = Object.keys(categoryData).join(', ');
    const placeholders = Object.keys(categoryData).map(() => '?').join(', ');
    const values = Object.values(categoryData);
    await this.execute(`INSERT INTO category (${columns}) VALUES (${placeholders});`, values);
    return categoryData;
  }

  async updateCategory(id: string, updateData: any): Promise<any | null> {
    if (Object.keys(updateData).length === 0) return this.getCategoryById(id);
    const setClauses = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData), id];
    const result = await this.execute<any>(`UPDATE category SET ${setClauses} WHERE category_rowguid = ?;`, values);
    return result.affectedRows > 0 ? this.getCategoryById(id) : null;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await this.execute<any>('DELETE FROM category WHERE category_rowguid = ?;', [id]);
    return result.affectedRows > 0;
  }

  // Subcategory methods
  async getAllSubcategories(): Promise<Subcategory[]> {
    const sql = `
        SELECT s.*, c.category_name 
        FROM subcategory s 
        LEFT JOIN category c ON s.subcategory_categoryrowguid = c.category_rowguid
        ORDER BY s.subcategory_name ASC;
    `;
    return await this.execute(sql);
  }

  async getSubcategoryBySlug(categorySlug: string, subcategorySlug: string): Promise<Subcategory | null> {
    const sql = `
      SELECT s.* FROM subcategory s
      INNER JOIN category c ON s.subcategory_categoryrowguid = c.category_rowguid
      WHERE c.category_slug = ? AND s.subcategory_slug = ? 
      LIMIT 1;
    `;
    const [subcategory] = await this.execute<Subcategory[]>(sql, [categorySlug, subcategorySlug]);
    return subcategory || null;
  }

  async getSubcategoryById(id: string): Promise<Subcategory | null> {
    const [subcategory] = await this.execute<Subcategory[]>('SELECT * FROM subcategory WHERE subcategory_rowguid = ? LIMIT 1;', [id]);
    return subcategory || null;
  }

  async createSubcategory(subcategoryData: any): Promise<any> {
    const columns = Object.keys(subcategoryData).join(', ');
    const placeholders = Object.keys(subcategoryData).map(() => '?').join(', ');
    await this.execute(`INSERT INTO subcategory (${columns}) VALUES (${placeholders});`, Object.values(subcategoryData));
    return subcategoryData;
  }

  async updateSubcategory(id: string, updateData: any): Promise<any | null> {
    if (Object.keys(updateData).length === 0) return this.getSubcategoryById(id);
    const setClauses = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData), id];
    const result = await this.execute<any>(`UPDATE subcategory SET ${setClauses} WHERE subcategory_rowguid = ?;`, values);
    return result.affectedRows > 0 ? this.getSubcategoryById(id) : null;
  }

  async deleteSubcategory(id: string): Promise<boolean> {
    const result = await this.execute<any>('DELETE FROM subcategory WHERE subcategory_rowguid = ?;', [id]);
    return result.affectedRows > 0;
  }

  // Article methods
  private get baseArticleQuery(): string {
    return `
      SELECT a.*, c.category_slug, c.category_name, s.subcategory_slug, s.subcategory_name
      FROM article a
      LEFT JOIN category c ON a.article_categoryrowguid = c.category_rowguid
      LEFT JOIN subcategory s ON a.article_subcategoryrowguid = s.subcategory_rowguid
    `;
  }

  async getAllArticles(): Promise<Article[]> {
    const results = await this.execute<any[]>(`${this.baseArticleQuery} ORDER BY a.article_publishedat DESC;`);
    return this.mapArticleResults(results);
  }

  async getArticleById(id: string): Promise<Article | null> {
    const [article] = await this.execute<any[]>(`${this.baseArticleQuery} WHERE a.article_rowguid = ? LIMIT 1;`, [id]);
    return article ? this.mapArticleResults([article])[0] : null;
  }

  async createArticle(articleData: any): Promise<Article> {
    if (!articleData.article_rowguid) {
        articleData.article_rowguid = uuidv4();
    }
    const columns = Object.keys(articleData).join(', ');
    const placeholders = '?'.repeat(Object.keys(articleData).length).split('').join(', ');
    await this.execute(`INSERT INTO article (${columns}) VALUES (${placeholders});`, Object.values(articleData));
    return articleData as Article;
  }

  async updateArticle(id: string, updateData: any): Promise<Article | null> {
    if (Object.keys(updateData).length === 0) return this.getArticleById(id);
    const setClauses = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData), id];
    const result = await this.execute<any>(`UPDATE article SET ${setClauses} WHERE article_rowguid = ?;`, values);
    return result.affectedRows > 0 ? this.getArticleById(id) : null;
  }

  async deleteArticle(id: string): Promise<boolean> {
    const result = await this.execute<any>('DELETE FROM article WHERE article_rowguid = ?;', [id]);
    return result.affectedRows > 0;
  }

  async getFeaturedArticles(limit: number = 5): Promise<Article[]> {
    const results = await this.execute<any[]>(`${this.baseArticleQuery} WHERE a.article_featured = TRUE ORDER BY a.article_publishedat DESC LIMIT ?;`, [limit]);
    return this.mapArticleResults(results);
  }

  async getOpinionArticles(limit: number = 5): Promise<Article[]> {
    const results = await this.execute<any[]>(`${this.baseArticleQuery} WHERE a.article_isopinion = TRUE ORDER BY a.article_publishedat DESC LIMIT ?;`, [limit]);
    return this.mapArticleResults(results);
  }

  async getArticlesByCategory(categorySlug: string, limit: number = 20): Promise<Article[]> {
    const results = await this.execute<any[]>(`${this.baseArticleQuery} WHERE c.category_slug = ? ORDER BY a.article_publishedat DESC LIMIT ?;`, [categorySlug, limit]);
    return this.mapArticleResults(results);
  }

  async getArticlesByCategoryId(categoryId: string): Promise<Article[]> {
    const results = await this.execute<any[]>(`${this.baseArticleQuery} WHERE a.article_categoryrowguid = ?;`, [categoryId]);
    return this.mapArticleResults(results);
  }

  async getArticlesBySubcategory(categorySlug: string, subcategorySlug: string, limit: number = 20): Promise<Article[]> {
    const results = await this.execute<any[]>(`${this.baseArticleQuery} WHERE c.category_slug = ? AND s.subcategory_slug = ? ORDER BY a.article_publishedat DESC LIMIT ?;`, [categorySlug, subcategorySlug, limit]);
    return this.mapArticleResults(results);
  }

  async getArticlesBySubcategoryId(subcategoryId: string): Promise<Article[]> {
    const results = await this.execute<any[]>(`${this.baseArticleQuery} WHERE a.article_subcategoryrowguid = ?;`, [subcategoryId]);
    return this.mapArticleResults(results);
  }

  async getArticleBySlug(slug: string): Promise<Article | null> {
    const [article] = await this.execute<any[]>(`${this.baseArticleQuery} WHERE a.article_slug = ? LIMIT 1;`, [slug]);
    return article ? this.mapArticleResults([article])[0] : null;
  }

  async getRelatedArticles(article: Article, limit: number = 5): Promise<Article[]> {
    const categoryGuid = (article.article_categoryrowguid as Category)?.category_rowguid;
    const subcategoryGuid = (article.article_subcategoryrowguid as Subcategory)?.subcategory_rowguid;
    if (!categoryGuid) return [];

    const conditions: string[] = ['a.article_categoryrowguid = ?'];
    const params: any[] = [categoryGuid];
    if (subcategoryGuid) {
      conditions.push('a.article_subcategoryrowguid = ?');
      params.push(subcategoryGuid);
    }
  
    const whereClause = conditions.join(' OR ');
    params.push(article.article_rowguid, limit);
  
    const sql = `${this.baseArticleQuery} WHERE (${whereClause}) AND a.article_rowguid <> ? ORDER BY a.article_publishedat DESC LIMIT ?;`;
    const results = await this.execute<any[]>(sql, params);
    return this.mapArticleResults(results);
  }

  async searchArticles(query: string, limit: number = 20): Promise<Article[]> {
    const searchTerm = `%${query}%`;
    const params = [searchTerm, searchTerm, searchTerm, searchTerm, limit];
    const sql = `${this.baseArticleQuery} WHERE a.article_headline LIKE ? OR a.article_excerpt LIKE ? OR a.article_content LIKE ? OR a.article_tags LIKE ? ORDER BY a.article_publishedat DESC LIMIT ?;`;
    const results = await this.execute<any[]>(sql, params);
    return this.mapArticleResults(results);
  }

  async getRecentArticlesByCategory(excludeArticleIds: string[] = [], articlesPerCategory: number = 3): Promise<{ [categorySlug: string]: Article[] }> {
    const categories = await this.getAllCategories();
    const result: { [categorySlug: string]: Article[] } = {};

    for (const category of categories) {
      let sql = `${this.baseArticleQuery} WHERE a.article_categoryrowguid = ? AND a.article_featured = FALSE`;
      const params: any[] = [category.category_rowguid];

      if (excludeArticleIds.length > 0) {
        const placeholders = excludeArticleIds.map(() => '?').join(', ');
        sql += ` AND a.article_rowguid NOT IN (${placeholders})`;
        params.push(...excludeArticleIds);
      }
      
      sql += ' ORDER BY a.article_publishedat DESC LIMIT ?;';
      params.push(articlesPerCategory);

      const articles = await this.execute<any[]>(sql, params);
      if (articles.length > 0) {
        result[category.category_slug] = this.mapArticleResults(articles);
      }
    }
    return result;
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

  // ===== Social Users =====
  async getAllSocialUsers(): Promise<SocialUser[]> {
    return await this.execute('SELECT * FROM socialuser ORDER BY socialuser_displayname ASC;');
  }

  async getSocialUserById(id: string): Promise<SocialUser | null> {
    const [user] = await this.execute<SocialUser[]>('SELECT * FROM socialuser WHERE socialuser_rowguid = ? LIMIT 1;', [id]);
    return user || null;
  }

  async createSocialUser(data: any): Promise<SocialUser> {
    const [existing] = await this.execute('SELECT 1 FROM socialuser WHERE socialuser_handle = ? LIMIT 1;', [data.socialuser_handle]);
    if (existing) {
      throw new Error(`A social user with the handle "${data.socialuser_handle}" already exists.`);
    }
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    await this.execute(`INSERT INTO socialuser (${columns}) VALUES (${placeholders});`, Object.values(data));
    return data as SocialUser;
  }

  async updateSocialUser(id: string, updateData: any): Promise<SocialUser | null> {
    if (Object.keys(updateData).length === 0) return this.getSocialUserById(id);
    const setClauses = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData), id];
    const result = await this.execute<any>(`UPDATE socialuser SET ${setClauses} WHERE socialuser_rowguid = ?;`, values);
    return result.affectedRows > 0 ? this.getSocialUserById(id) : null;
  }

  async deleteSocialUser(id: string): Promise<boolean> {
    const result = await this.execute<any>('DELETE FROM socialuser WHERE socialuser_rowguid = ?;', [id]);
    return result.affectedRows > 0;
  }

  // ===== Social Content =====
  async getAllSocialContents(): Promise<SocialContent[]> {
    const sql = `
      SELECT sc.*, su.socialuser_handle 
      FROM socialcontent sc
      LEFT JOIN socialuser su ON sc.socialcontent_socialuserrowguid = su.socialuser_rowguid
      ORDER BY sc.socialcontent_postedat DESC;
    `;
    return await this.execute(sql);
  }

  async getSocialContentById(id: string): Promise<SocialContent | null> {
    const [content] = await this.execute<SocialContent[]>('SELECT * FROM socialcontent WHERE socialcontent_rowguid = ? LIMIT 1;', [id]);
    return content || null;
  }

  async createSocialContent(data: any): Promise<SocialContent> {
    const content = { socialcontent_rowguid: uuidv4(), ...data };
    const columns = Object.keys(content).join(', ');
    const placeholders = Object.keys(content).map(() => '?').join(', ');
    await this.execute(`INSERT INTO socialcontent (${columns}) VALUES (${placeholders});`, Object.values(content));
    return content as SocialContent;
  }

  async updateSocialContent(id: string, updateData: any): Promise<SocialContent | null> {
    if (Object.keys(updateData).length === 0) return this.getSocialContentById(id);
    const setClauses = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData), id];
    const result = await this.execute<any>(`UPDATE socialcontent SET ${setClauses} WHERE socialcontent_rowguid = ?;`, values);
    return result.affectedRows > 0 ? this.getSocialContentById(id) : null;
  }

  async deleteSocialContent(id: string): Promise<boolean> {
    const result = await this.execute<any>('DELETE FROM socialcontent WHERE socialcontent_rowguid = ?;', [id]);
    return result.affectedRows > 0;
  }
}