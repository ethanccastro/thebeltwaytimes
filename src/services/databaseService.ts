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

  // Admin stats method
  async getAdminStats() {
    const [totalArticles, totalCategories, totalSubcategories, totalSocialUsers, totalSocialContents] = await Promise.all([
      this.em.count(Article),
      this.em.count(Category),
      this.em.count(Subcategory),
      this.em.count(SocialUser),
      this.em.count(SocialContent)
    ]);

    return {
      totalArticles,
      totalCategories,
      totalSubcategories,
      totalSocialUsers,
      totalSocialContents
    };
  }

  // Category methods
  async getAllCategories(): Promise<Category[]> {
    return await this.em.find(Category, {}, {
      populate: ['subcategories'],
      orderBy: { category_name: 'ASC' }
    });
  }

  async getCategoriesWithSubcategories(): Promise<Category[]> {
    const categories = await this.em.find(Category, {}, {
      populate: ['subcategories'],
      orderBy: { category_name: 'ASC' }
    });
    
    // Ensure subcategories are properly loaded
    for (const category of categories) {
      await category.subcategories.init();
    }
    
    return categories;
  }

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    return await this.em.findOne(Category, { category_slug: slug }, {
      populate: ['subcategories', 'articles']
    });
  }

  async getCategoryById(id: string): Promise<Category | null> {
    return await this.em.findOne(Category, { category_rowguid: id }, {
      populate: ['subcategories', 'articles']
    });
  }

  async createCategory(categoryData: any): Promise<Category> {
    const category = this.em.create(Category, categoryData);
    await this.em.persistAndFlush(category);
    return category;
  }

  async updateCategory(id: string, updateData: any): Promise<Category | null> {
    const category = await this.getCategoryById(id);
    if (!category) return null;
    
    this.em.assign(category, updateData);
    await this.em.flush();
    return category;
  }

  async deleteCategory(id: string): Promise<boolean> {
    const category = await this.getCategoryById(id);
    if (!category) return false;
    
    await this.em.removeAndFlush(category);
    return true;
  }

  // Subcategory methods
  async getAllSubcategories(): Promise<Subcategory[]> {
    return await this.em.find(Subcategory, {}, {
      populate: ['category'],
      orderBy: { subcategory_name: 'ASC' }
    });
  }

  async getSubcategoryBySlug(categorySlug: string, subcategorySlug: string): Promise<Subcategory | null> {
    const category = await this.getCategoryBySlug(categorySlug);
    if (!category) return null;
    return await this.em.findOne(Subcategory, {
      subcategory_slug: subcategorySlug,
      category: category
    }, {
      populate: ['category', 'articles']
    });
  }

  async getSubcategoryById(id: string): Promise<Subcategory | null> {
    return await this.em.findOne(Subcategory, { subcategory_rowguid: id }, {
      populate: ['category', 'articles']
    });
  }

  async createSubcategory(subcategoryData: any): Promise<Subcategory> {
    const subcategory = this.em.create(Subcategory, subcategoryData);
    await this.em.persistAndFlush(subcategory);
    return subcategory;
  }

  async updateSubcategory(id: string, updateData: any): Promise<Subcategory | null> {
    const subcategory = await this.getSubcategoryById(id);
    if (!subcategory) return null;
    
    this.em.assign(subcategory, updateData);
    await this.em.flush();
    return subcategory;
  }

  async deleteSubcategory(id: string): Promise<boolean> {
    const subcategory = await this.getSubcategoryById(id);
    if (!subcategory) return false;
    
    await this.em.removeAndFlush(subcategory);
    return true;
  }

  // Article methods
  async getAllArticles(): Promise<Article[]> {
    return await this.em.find(Article, {}, {
      populate: ['article_categoryrowguid', 'article_subcategoryrowguid'],
      orderBy: { article_publishedat: 'DESC' }
    });
  }

  async getArticleById(id: string): Promise<Article | null> {
    return await this.em.findOne(Article, { article_rowguid: id }, {
      populate: ['article_categoryrowguid', 'article_subcategoryrowguid']
    });
  }

  async createArticle(articleData: any): Promise<Article> {
    console.log('📝 DatabaseService creating article with data:', articleData);
    const article = this.em.create(Article, articleData);
    await this.em.persistAndFlush(article);
    console.log('📝 Article created successfully:', article);
    return article;
  }

  async updateArticle(id: string, updateData: any): Promise<Article | null> {
    const article = await this.getArticleById(id);
    if (!article) return null;
    
    this.em.assign(article, updateData);
    await this.em.flush();
    return article;
  }

  async deleteArticle(id: string): Promise<boolean> {
    const article = await this.getArticleById(id);
    if (!article) return false;
    
    await this.em.removeAndFlush(article);
    return true;
  }

  async getFeaturedArticles(limit: number = 5): Promise<Article[]> {
    return await this.em.find(Article, { article_featured: true }, {
      populate: ['article_categoryrowguid', 'article_subcategoryrowguid'],
      orderBy: { article_publishedat: 'DESC' },
      limit
    });
  }

  async getOpinionArticles(limit: number = 5): Promise<Article[]> {
    return await this.em.find(Article, { article_isopinion: true }, {
      populate: ['article_categoryrowguid', 'article_subcategoryrowguid'],
      orderBy: { article_publishedat: 'DESC' },
      limit
    });
  }
  async getArticlesByCategory(categorySlug: string, limit: number = 20): Promise<Article[]> {
    const category = await this.getCategoryBySlug(categorySlug);
    if (!category) return [];
    return await this.em.find(Article, { article_categoryrowguid: category }, {
      populate: ['article_categoryrowguid', 'article_subcategoryrowguid'],
      orderBy: { article_publishedat: 'DESC' },
      limit
    });
  }

  async getArticlesByCategoryId(categoryId: string): Promise<Article[]> {
    const category = await this.getCategoryById(categoryId);
    if (!category) return [];
    return await this.em.find(Article, { article_categoryrowguid: category }, {
      populate: ['article_categoryrowguid', 'article_subcategoryrowguid']
    });
  }

  async getArticlesBySubcategory(categorySlug: string, subcategorySlug: string, limit: number = 20): Promise<Article[]> {
    const category = await this.getCategoryBySlug(categorySlug);
    if (!category) return [];
    const subcategory = await this.getSubcategoryBySlug(categorySlug, subcategorySlug);
    if (!subcategory) return [];
    return await this.em.find(Article, {
      article_categoryrowguid: category,
      article_subcategoryrowguid: subcategory
    }, {
      populate: ['article_categoryrowguid', 'article_subcategoryrowguid'],
      orderBy: { article_publishedat: 'DESC' },
      limit
    });
  }

  async getArticlesBySubcategoryId(subcategoryId: string): Promise<Article[]> {
    const subcategory = await this.getSubcategoryById(subcategoryId);
    if (!subcategory) return [];
    return await this.em.find(Article, { article_subcategoryrowguid: subcategory }, {
      populate: ['article_categoryrowguid', 'article_subcategoryrowguid']
    });
  }

  async getArticleBySlug(slug: string): Promise<Article | null> {
    return await this.em.findOne(Article, { article_slug: slug }, {
      populate: ['article_categoryrowguid', 'article_subcategoryrowguid']
    });
  }

  async getRelatedArticles(article: Article, limit: number = 5): Promise<Article[]> {
    const conditions = [];
    if (article.article_categoryrowguid) {
      conditions.push({ article_categoryrowguid: article.article_categoryrowguid });
    }
    if (article.article_subcategoryrowguid) {
      conditions.push({ article_subcategoryrowguid: article.article_subcategoryrowguid });
    }
    if (conditions.length === 0) {
      return [];
    }
    return await this.em.find(Article, {
      $or: conditions,
      article_rowguid: { $ne: article.article_rowguid }
    }, {
      populate: ['article_categoryrowguid', 'article_subcategoryrowguid'],
      orderBy: { article_publishedat: 'DESC' },
      limit
    });
  }

  async searchArticles(query: string, limit: number = 20): Promise<Article[]> {
    return await this.em.find(Article, {
      $or: [
        { article_headline: { $like: `%${query}%` } },
        { article_excerpt: { $like: `%${query}%` } },
        { article_content: { $like: `%${query}%` } },
        { article_tags: { $like: `%${query}%` } }
      ]
    }, {
      populate: ['article_categoryrowguid', 'article_subcategoryrowguid'],
      orderBy: { article_publishedat: 'DESC' },
      limit
    });
  }

  /**
   * Get the most recent 3 articles per category, excluding featured articles and optionally excluding a list of article_rowguids.
   */
  async getRecentArticlesByCategory(excludeArticleIds: string[] = [], articlesPerCategory: number = 3): Promise<{ [categorySlug: string]: Article[] }> {
    const categories = await this.getAllCategories();
    const result: { [categorySlug: string]: Article[] } = {};
    for (const category of categories) {
      // Build filter
      const filter: any = {
        article_categoryrowguid: category,
        article_featured: false
      };
      if (excludeArticleIds.length > 0) {
        filter.article_rowguid = { $nin: excludeArticleIds };
      }
      const articles = await this.em.find(Article, filter, {
        populate: ['article_categoryrowguid', 'article_subcategoryrowguid'],
        orderBy: { article_publishedat: 'DESC' },
        limit: articlesPerCategory
      });
      if (articles.length > 0) {
        result[category.category_slug] = articles;
      }
    }
    return result;
  }

  async getMainArticles(limit: number = 10): Promise<Article[]> {
    return await this.em.find(Article, { article_main: true }, {
      populate: ['article_categoryrowguid', 'article_subcategoryrowguid'],
      orderBy: { article_publishedat: 'DESC' },
      limit
    });
  }

  async getTrendingArticles(limit: number = 5): Promise<Article[]> {
    return await this.em.find(Article, { article_trending: true }, {
      populate: ['article_categoryrowguid', 'article_subcategoryrowguid'],
      orderBy: { article_publishedat: 'DESC' },
      limit
    });
  }

  /**
   * Get articles for each category block where article_categoryblock is true, grouped by category_slug.
   */
  async getCategoryBlockArticles(): Promise<{ [categorySlug: string]: Article[] }> {
    const categories = await this.getAllCategories();
    const result: { [categorySlug: string]: Article[] } = {};
    for (const category of categories) {
      const articles = await this.em.find(Article, {
        article_categoryrowguid: category,
        article_categoryblock: true
      }, {
        populate: ['article_categoryrowguid', 'article_subcategoryrowguid'],
        orderBy: { article_publishedat: 'DESC' }
      });
      if (articles.length > 0) {
        result[category.category_slug] = articles;
      }
    }
    return result;
  }

  // ===== Social Users =====
  async getAllSocialUsers(): Promise<SocialUser[]> {
    return await this.em.find(SocialUser, {}, { orderBy: { socialuser_displayname: 'ASC' } });
  }

  async getSocialUserById(id: string): Promise<SocialUser | null> {
    return await this.em.findOne(SocialUser, { socialuser_rowguid: id }, { populate: ['posts'] });
  }

  async createSocialUser(data: any): Promise<SocialUser> {
    const socialUser = this.em.create(SocialUser, data);
    await this.em.persistAndFlush(socialUser);
    return socialUser;
  }

  async updateSocialUser(id: string, updateData: any): Promise<SocialUser | null> {
    const user = await this.getSocialUserById(id);
    if (!user) return null;
    this.em.assign(user, updateData);
    await this.em.flush();
    return user;
  }

  async deleteSocialUser(id: string): Promise<boolean> {
    const user = await this.getSocialUserById(id);
    if (!user) return false;
    await this.em.removeAndFlush(user);
    return true;
  }

  // ===== Social Content =====
  async getAllSocialContents(): Promise<SocialContent[]> {
    return await this.em.find(SocialContent, {}, {
      populate: ['socialuser'],
      orderBy: { socialcontent_postedat: 'DESC' }
    });
  }

  async getSocialContentById(id: string): Promise<SocialContent | null> {
    return await this.em.findOne(SocialContent, { socialcontent_rowguid: id }, { populate: ['socialuser'] });
  }

  async createSocialContent(data: any): Promise<SocialContent> {
    const content = this.em.create(SocialContent, {
      socialcontent_rowguid: uuidv4(),
      ...data,
    });
    await this.em.persistAndFlush(content);
    return content;
  }

  async updateSocialContent(id: string, updateData: any): Promise<SocialContent | null> {
    const content = await this.getSocialContentById(id);
    if (!content) return null;
    this.em.assign(content, updateData);
    await this.em.flush();
    return content;
  }

  async deleteSocialContent(id: string): Promise<boolean> {
    const content = await this.getSocialContentById(id);
    if (!content) return false;
    await this.em.removeAndFlush(content);
    return true;
  }
} 