import { Request, Response } from 'express';
import { RedirectService } from '../services/redirectService';

export class RedirectController {
  private redirectService: RedirectService;

  constructor(redirectService: RedirectService) {
    this.redirectService = redirectService;
  }

  public handleRedirect = async (
    req: Request,
    res: Response,
    next: Function
  ): Promise<void> => {
    try {
      const slug = req.params['slug'];
      if (!slug) {
        next();
        return;
      }
      const article = await this.redirectService.getArticleBySlugShort(`${slug}`);

      if (article) {
        const publishedAt = new Date(article.article_publishedat);
        const year = publishedAt.getFullYear();
        const month = String(publishedAt.getMonth() + 1).padStart(2, '0');
        const day = String(publishedAt.getDate()).padStart(2, '0');

        const fullUrl = `/${article.article_categoryrowguid.category_slug}/${year}/${month}/${day}/${article.article_slug}`;
        res.redirect(301, fullUrl);
      } else {
        next();
      }
    } catch (error) {
      console.error('Error in handleRedirect:', error);
      next(error);
    }
  };
}
