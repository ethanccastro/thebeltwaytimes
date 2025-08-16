import { Request, Response } from 'express';
import { DatabaseService } from '../services/databaseService';

export class NewsController {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  public getCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const categorySlug = req.params['category'];
      if (!categorySlug) {
        res.status(400).render('error', {
          title: 'Bad Request',
          message: 'Category parameter is required',
          currentSection: 'error'
        });
        return;
      }
      
      const articles = await this.dbService.getArticlesByCategory(categorySlug);
      const categoryInfo = await this.dbService.getCategoryBySlug(categorySlug);
      
      if (!categoryInfo) {
        res.status(404).render('error', {
          title: '404 - Not Found',
          message: 'The requested category does not exist',
          currentSection: 'error'
        });
        return;
      }

      res.render('category', {
        title: `${categoryInfo.category_name} - The Beltway Times`,
        articles,
        categoryInfo,
        currentSection: categorySlug
      });
    } catch (error) {
      console.error('Error in getCategory:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'An error occurred while loading the category page',
        currentSection: 'error'
      });
    }
  };

  /**
   * Render subcategory pages (e.g., /business/technology)
   */
  public getSubcategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const categorySlug = req.params['category'];
      const subcategorySlug = req.params['subcategory'];
      
      if (!categorySlug || !subcategorySlug) {
        res.status(400).render('error', {
          title: 'Bad Request',
          message: 'Category and subcategory parameters are required',
          currentSection: 'error'
        });
        return;
      }
      
      const articles = await this.dbService.getArticlesBySubcategory(categorySlug, subcategorySlug);
      const categoryInfo = await this.dbService.getCategoryBySlug(categorySlug);
      const subcategoryInfo = await this.dbService.getSubcategoryBySlug(categorySlug, subcategorySlug);
      
      if (!categoryInfo || !subcategoryInfo) {
        res.status(404).render('error', {
          title: '404 - Not Found',
          message: 'The requested page does not exist',
          currentSection: 'error'
        });
        return;
      }

      res.render('subcategory', {
        title: `${subcategoryInfo.subcategory_name} - ${categoryInfo.category_name} - The Beltway Times`,
        articles,
        categoryInfo,
        subcategoryInfo,
        currentSection: categorySlug
      });
    } catch (error) {
      console.error('Error in getSubcategory:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'An error occurred while loading the subcategory page',
        currentSection: 'error'
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
          currentSection: 'error'
        });
        return;
      }
      
      const article = await this.dbService.getArticleBySlug(slug);
      
      if (!article) {
        res.status(404).render('error', {
          title: '404 - Not Found',
          message: 'The requested article does not exist',
          currentSection: 'error'
        });
        return;
      }

      const relatedArticles = await this.dbService.getRelatedArticles(article);
      const categoryInfo = article.article_categoryrowguid;

      res.render('article', {
        title: `${article.article_headline} - ${categoryInfo?.category_name || 'News'} - The Beltway Times`,
        article,
        relatedArticles,
        categoryInfo,
        socialcontents: await this.dbService.getAllSocialContents(),
        currentSection: categoryInfo?.category_slug
      });
    } catch (error) {
      console.error('Error in getArticle:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'An error occurred while loading the article',
        currentSection: 'error'
      });
    }
  };
} 