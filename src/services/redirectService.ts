import { EntityManager } from '@mikro-orm/core';
import { Article } from '../entities/Article';
import { BaseService } from './baseService';

export class RedirectService extends BaseService {
  constructor(em: EntityManager) {
    super(em);
  }

  async getArticleBySlugShort(slug: string): Promise<Article | null> {
    const [article] = await this.execute<any[]>(
      `${this.baseArticleQuery} WHERE a.article_slugshort = ? LIMIT 1;`,
      [slug]
    );
    return article ? this.mapArticleResults([article])[0] : null;
  }
}
