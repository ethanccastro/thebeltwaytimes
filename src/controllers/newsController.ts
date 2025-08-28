import { Request, Response } from 'express';
import { NewsService } from '../services/newsService';

export class NewsController {
  private newsService: NewsService;

  constructor(newsService: NewsService) {
    this.newsService = newsService;
  }

  public getCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const categorySlug = req.params['category'];
      if (!categorySlug) {
        res.status(400).render('error', {
          title: 'Bad Request',
          message: 'Category parameter is required',
          currentSection: 'error',
        });
        return;
      }

      const articles =
        await this.newsService.getArticlesByCategory(categorySlug);
      const categoryInfo =
        await this.newsService.getCategoryBySlug(categorySlug);

      if (!categoryInfo) {
        res.status(404).render('error', {
          title: '404 - Not Found',
          message: 'The requested category does not exist',
          currentSection: 'error',
        });
        return;
      }

      res.render('category', {
        title: `${categoryInfo.category_name} - The Beltway Times`,
        articles,
        categoryInfo,
        currentSection: categorySlug,
      });
    } catch (error) {
      console.error('Error in getCategory:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'An error occurred while loading the category page',
        currentSection: 'error',
      });
    }
  };

  /**
   * Render subcategory pages (e.g., /business/technology)
   */
  public getSubcategory = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const categorySlug = req.params['category'];
      const subcategorySlug = req.params['subcategory'];

      if (!categorySlug || !subcategorySlug) {
        res.status(400).render('error', {
          title: 'Bad Request',
          message: 'Category and subcategory parameters are required',
          currentSection: 'error',
        });
        return;
      }

      const articles = await this.newsService.getArticlesBySubcategory(
        categorySlug,
        subcategorySlug
      );
      const categoryInfo =
        await this.newsService.getCategoryBySlug(categorySlug);
      const subcategoryInfo = await this.newsService.getSubcategoryBySlug(
        categorySlug,
        subcategorySlug
      );

      if (!categoryInfo || !subcategoryInfo) {
        res.status(404).render('error', {
          title: '404 - Not Found',
          message: 'The requested page does not exist',
          currentSection: 'error',
        });
        return;
      }

      res.render('subcategory', {
        title: `${subcategoryInfo.subcategory_name} - ${categoryInfo.category_name} - The Beltway Times`,
        articles,
        categoryInfo,
        subcategoryInfo,
        currentSection: categorySlug,
      });
    } catch (error) {
      console.error('Error in getSubcategory:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'An error occurred while loading the subcategory page',
        currentSection: 'error',
      });
    }
  };

  /**
   * Render individual article pages
   */
  public getArticle = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check if this is the new URL pattern: /:category_slug/:year/:month/:day/:article_slug
      const { category_slug, year, month, day, article_slug } = req.params;

      let slug: string;

      if (category_slug && year && month && day && article_slug) {
        // New URL pattern
        slug = article_slug;
      } else {
        // Old URL pattern: /article/:slug
        slug = req.params['slug'];
      }

      if (!slug) {
        res.status(400).render('error', {
          title: 'Bad Request',
          message: 'Article slug is required',
          currentSection: 'error',
        });
        return;
      }

      const article = await this.newsService.getArticleBySlug(slug);

      if (!article) {
        res.status(404).render('error', {
          title: '404 - Not Found',
          message: 'The requested article does not exist',
          currentSection: 'error',
        });
        return;
      }

      const relatedArticles =
        await this.newsService.getRelatedArticles(article);
      const categoryInfo = article.article_categoryrowguid;

      res.render('article', {
        title: `${article.article_headline} | The Beltway Times`,
        article,
        relatedArticles,
        categoryInfo,
        socialcontents: await this.newsService.getAllSocialContents(),
        currentSection: categoryInfo?.category_slug,
      });
    } catch (error) {
      console.error('Error in getArticle:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'An error occurred while loading the article',
        currentSection: 'error',
      });
    }
  };
}
