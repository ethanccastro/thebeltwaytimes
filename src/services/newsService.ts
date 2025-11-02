import { EntityManager } from '@mikro-orm/core';
import { Article } from '../entities/Article';
import { Category } from '../entities/Category';
import { Subcategory } from '../entities/Subcategory';
import { SocialContent } from '../entities/SocialContent';
import { BaseService } from './baseService';

export class NewsService extends BaseService {
  constructor(em: EntityManager) {
    super(em);
  }

  async getArticlesByCategory(categorySlug: string, limit: number = 20): Promise<Article[]> {
    const results = await this.execute<any[]>(`${this.baseArticleQuery} WHERE c.category_slug = ? ORDER BY a.article_publishedat DESC LIMIT ?;`, [categorySlug, limit]);
    return this.mapArticleResults(results);
  }

  async getArticlesBySubcategory(categorySlug: string, subcategorySlug: string, limit: number = 20): Promise<Article[]> {
    const results = await this.execute<any[]>(`${this.baseArticleQuery} WHERE c.category_slug = ? AND s.subcategory_slug = ? ORDER BY a.article_publishedat DESC LIMIT ?;`, [categorySlug, subcategorySlug, limit]);
    return this.mapArticleResults(results);
  }

  async getArticleBySlug(slug: string): Promise<Article | null> {
    const [article] = await this.execute<any[]>(`${this.baseArticleQuery} WHERE a.article_slug = ? LIMIT 1;`, [slug]);
    return article ? this.mapArticleResults([article])[0] : null;
  }

  async getArticleBySlugShort(slug: string): Promise<Article | null> {
    const [article] = await this.execute<any[]>(`${this.baseArticleQuery} WHERE a.article_slugshort = ? LIMIT 1;`, [slug]);
    return article ? this.mapArticleResults([article])[0] : null;
  }

  async getAdsenseCode() {
    const adsense: string = `<script async 
    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4083750040120466"
     crossorigin="anonymous"></script>
<ins class="adsbygoogle"
     style="display:block; text-align:center;"
     data-ad-layout="in-article"
     data-ad-format="fluid"
     data-ad-client="ca-pub-4083750040120466"
     data-ad-slot="7055859635"></ins>
<script>
     (adsbygoogle = window.adsbygoogle || []).push({});
</script>`
    return adsense;
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

  async getCategoryBySlug(slug: string): Promise<Category | null> {
    const [category] = await this.execute<Category[]>('SELECT * FROM category WHERE category_slug = ? LIMIT 1;', [slug]);
    return category || null;
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
}