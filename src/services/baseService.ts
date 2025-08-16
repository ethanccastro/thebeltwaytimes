import { EntityManager } from '@mikro-orm/core';
import { Article } from '../entities/Article';
import { Category } from '../entities/Category';
import { Subcategory } from '../entities/Subcategory';

export class BaseService {
  protected em: EntityManager;

  constructor(em: EntityManager) {
    this.em = em;
  }

  /**
   * Helper to execute raw SQL queries.
   */
  protected async execute<T = any[]>(sql: string, params: any[] = []): Promise<T> {
    return this.em.getConnection('write').execute(sql, params);
  }

  /**
   * Helper to map flat SQL results into a nested Article object.
   */
  protected mapArticleResults(rows: any[]): Article[] {
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

  protected get baseArticleQuery(): string {
    return `
      SELECT a.*, c.category_slug, c.category_name, s.subcategory_slug, s.subcategory_name
      FROM article a
      LEFT JOIN category c ON a.article_categoryrowguid = c.category_rowguid
      LEFT JOIN subcategory s ON a.article_subcategoryrowguid = s.subcategory_rowguid
    `;
  }
}