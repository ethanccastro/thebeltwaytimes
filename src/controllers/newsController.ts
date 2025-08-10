import { Request, Response } from 'express';
import { DatabaseService } from '../services/databaseService';

export class NewsController {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * Render the home page with featured articles
   */
  public getHome = async (_req: Request, res: Response): Promise<void> => {
    try {
      const featuredArticles = await this.dbService.getFeaturedArticles();
      let opinionArticles = await this.dbService.getOpinionArticles();
      const categories = await this.dbService.getAllCategories();
      // New: fetch main, trending, and category block articles by config
      const mainArticles = await this.dbService.getMainArticles();
      const trendingArticles = await this.dbService.getTrendingArticles();
      const categoryBlockArticles = await this.dbService.getCategoryBlockArticles();
      // Exclude featured articles from the opinion sidebar
      const featuredIdsSet = new Set(featuredArticles.map(a => a.article_rowguid));
      opinionArticles = opinionArticles.filter(a => !featuredIdsSet.has(a.article_rowguid));
      res.render('home', {
        title: 'The Beltway Times - Breaking News, Latest Headlines',
        featuredArticles,
        opinionArticles,
        categories,
        mainArticles,
        trendingArticles,
        categoryBlockArticles,
        currentSection: 'home'
      });
    } catch (error) {
      console.error('Error in getHome:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'An error occurred while loading the home page',
        currentSection: 'home'
      });
    }
  };

  /**
   * Render category pages (e.g., /business, /technology, /politics)
   */
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

  /**
   * Render search results
   */
  public search = async (req: Request, res: Response): Promise<void> => {
    try {
      const query = req.query['q'] as string || '';
      
      const results = await this.dbService.searchArticles(query);
      
      res.render('search', {
        title: query ? `Search Results for "${query}" - The Beltway Times` : 'Search Results - The Beltway Times',
        results,
        query,
        currentSection: 'search'
      });
    } catch (error) {
      console.error('Error in search:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'An error occurred while searching',
        currentSection: 'search'
      });
    }
  };

  /**
   * Render about page
   */
  public getAbout = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.render('about', {
        title: 'About Us - The Beltway Times',
        currentSection: 'about'
      });
    } catch (error) {
      console.error('Error in getAbout:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'An error occurred while loading the about page',
        currentSection: 'error'
      });
    }
  };

  public getPrivacy = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.render('privacy', {
        title: 'Privacy Policy - The Beltway Times',
        currentSection: 'privacy'
      });
    } catch (error) {
      console.error('Error in getPrivacy:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'An error occurred while loading the privacy policy page',
        currentSection: 'error'
      });
    }
  };

  public getDisclaimer = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.render('disclaimer', {
        title: 'Disclaimer - The Beltway Times',
        currentSection: 'disclaimer'
      });
    } catch (error) {
      console.error('Error in getDisclaimer:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'An error occurred while loading the disclaimer page',
        currentSection: 'error'
      });
    }
  };

  public getContact = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.render('contact', {
        title: 'Contact Us - The Beltway Times',
        currentSection: 'contact'
      });
    } catch (error) {
      console.error('Error in getContact:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'An error occurred while loading the contact page',
        currentSection: 'error'
      });
    }
  };

  public getSitemapXml = async (_req: Request, res: Response): Promise<void> => {
    try {
      const baseUrl = `${_req.protocol}://${_req.get('host')}`;
      const articles = await this.dbService.getAllArticles();
      const categories = await this.dbService.getCategoriesWithSubcategories();

      res.header('Content-Type', 'application/xml');
      res.header('Content-Encoding', 'UTF-8');
      
      let xml = '<?xml version="1.0" encoding="UTF-8"?>';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

      // Add static pages
      xml += `<url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`;
      xml += `<url><loc>${baseUrl}/about</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`;
      xml += `<url><loc>${baseUrl}/privacy</loc><changefreq>yearly</changefreq><priority>0.5</priority></url>`;
      xml += `<url><loc>${baseUrl}/disclaimer</loc><changefreq>yearly</changefreq><priority>0.5</priority></url>`;
      xml += `<url><loc>${baseUrl}/contact</loc><changefreq>yearly</changefreq><priority>0.4</priority></url>`;

      // Add category pages
      categories.forEach(category => {
        xml += `<url><loc>${baseUrl}/${category.category_slug}</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>`;
        // Add subcategory pages
        if (category.subcategories) {
            category.subcategories.getItems().forEach(sub => {
                 xml += `<url><loc>${baseUrl}/${category.category_slug}/${sub.subcategory_slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
            });
        }
      });

      // Add article pages
      articles.forEach(article => {
        const pubDate = new Date(article.article_publishedat);
        const urlDate = `${pubDate.getFullYear()}/${(pubDate.getMonth() + 1).toString().padStart(2, '0')}/${pubDate.getDate().toString().padStart(2, '0')}`;
        const articleUrl = `${baseUrl}/${article.article_categoryrowguid.category_slug}/${urlDate}/${article.article_slug}`;
        
        // Format date to YYYY-MM-DD for lastmod
        const lastMod = pubDate.toISOString().split('T')[0];

        xml += `<url><loc>${articleUrl}</loc><lastmod>${lastMod}</lastmod><changefreq>never</changefreq><priority>0.7</priority></url>`;
      });

      xml += '</urlset>';
      res.send(xml);

    } catch (error) {
      console.error('Error generating XML sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  };
} 