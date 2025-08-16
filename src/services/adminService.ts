import { EntityManager } from '@mikro-orm/core';
import { Article } from '../entities/Article';
import { Category } from '../entities/Category';
import { Subcategory } from '../entities/Subcategory';
import { v4 as uuidv4 } from 'uuid';
import { SocialUser } from '../entities/SocialUser';
import { SocialContent } from '../entities/SocialContent';
import { BaseService } from './baseService';

export class AdminService extends BaseService {
  constructor(em: EntityManager) {
    super(em);
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
        SELECT s.*, c.category_name, c.category_rowguid
        FROM subcategory s
        LEFT JOIN category c ON s.subcategory_categoryrowguid = c.category_rowguid
        ORDER BY s.subcategory_name ASC;
    `;
    return await this.execute(sql);
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
    if (Array.isArray(articleData.article_tags)) {
      articleData.article_tags = JSON.stringify(articleData.article_tags);
    }
    const columns = Object.keys(articleData).join(', ');
    const placeholders = Object.keys(articleData).map(() => '?').join(', ');
    await this.execute(`INSERT INTO article (${columns}) VALUES (${placeholders});`, Object.values(articleData));
    return articleData as Article;
  }

  async updateArticle(id: string, updateData: any): Promise<Article | null> {
    if (Object.keys(updateData).length === 0) return this.getArticleById(id);
    if (Array.isArray(updateData.article_tags)) {
      updateData.article_tags = JSON.stringify(updateData.article_tags);
    }
    const setClauses = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = [...Object.values(updateData), id];
    const result = await this.execute<any>(`UPDATE article SET ${setClauses} WHERE article_rowguid = ?;`, values);
    return result.affectedRows > 0 ? this.getArticleById(id) : null;
  }

  async deleteArticle(id: string): Promise<boolean> {
    const result = await this.execute<any>('DELETE FROM article WHERE article_rowguid = ?;', [id]);
    return result.affectedRows > 0;
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
      SELECT sc.*, su.socialuser_displayname, su.socialuser_handle, su.socialuser_profilepictureurl
      FROM socialcontent sc
      LEFT JOIN socialuser su ON sc.socialcontent_socialuserrowguid = su.socialuser_rowguid
      ORDER BY sc.socialcontent_postedat DESC;
    `;
    const results = await this.execute<any[]>(sql);
    return this.mapSocialContentResults(results);
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