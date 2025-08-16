import { Request, Response } from 'express';
import { StaticService } from '../services/staticService';
import { Category } from '../entities/Category';
import { Article } from '../entities/Article';

export class StaticController {
  private staticService: StaticService;

  constructor(staticService: StaticService) {
    this.staticService = staticService;
  }

  /**
   * Render the home page with featured articles
   */
  public getHome = async (_req: Request, res: Response): Promise<void> => {
    try {
      const allArticles = await this.staticService.getHomepageArticles();

      const featuredArticles: Article[] = [];
      const opinionArticles: Article[] = [];
      const mainArticles: Article[] = [];
      const trendingArticles: Article[] = [];
      const categoryBlockArticles: { [key: string]: Article[] } = {};

      const processedIds = new Set<string>();

      // Prioritize featured articles
      for (const article of allArticles) {
        if (article.article_featured && featuredArticles.length < 5) {
          featuredArticles.push(article);
          processedIds.add(article.article_rowguid);
        }
      }

      // Process other categories, ensuring no duplicates
      for (const article of allArticles) {
        if (processedIds.has(article.article_rowguid)) {
          continue;
        }

        if (article.article_isopinion && opinionArticles.length < 5) {
          opinionArticles.push(article);
          processedIds.add(article.article_rowguid);
        } else if (article.article_main && mainArticles.length < 10) {
          mainArticles.push(article);
          processedIds.add(article.article_rowguid);
        } else if (article.article_trending && trendingArticles.length < 5) {
          trendingArticles.push(article);
          processedIds.add(article.article_rowguid);
        } else if (article.article_categoryblock) {
            const categorySlug = (article.article_categoryrowguid as Category)?.category_slug;
            if (categorySlug) {
                if (!categoryBlockArticles[categorySlug]) {
                    categoryBlockArticles[categorySlug] = [];
                }
                categoryBlockArticles[categorySlug].push(article);
                processedIds.add(article.article_rowguid);
            }
        }
      }

      res.render('home', {
        title: 'The Beltway Times - Breaking News, Latest Headlines',
        featuredArticles,
        opinionArticles,
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

  public search = async (req: Request, res: Response): Promise<void> => {
    try {
      const query = req.query['q'] as string || '';
      const results = await this.staticService.searchArticles(query);

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

  public getTerms = async (_req: Request, res: Response): Promise<void> => {
    try {
      res.render('terms', {
        title: 'Terms and Conditions - The Beltway Times',
        currentSection: 'terms'
      });
    } catch (error) {
      console.error('Error in getTerms:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'An error occurred while loading the terms and conditions page',
        currentSection: 'error'
      });
    }
  };

  public getSitemapXml = async (_req: Request, res: Response): Promise<void> => {
    try {
      const baseUrl = `${_req.protocol}://${_req.get('host')}`;
      const articles = await this.staticService.getAllArticles();
      const flatCategoryData = await this.staticService.getCategoriesWithSubcategories();

      // **FIXED**: Process the flat data into a structured map
      const categoryMap = new Map<string, any>();
      flatCategoryData.forEach(row => {
        if (!categoryMap.has(row.category_rowguid)) {
          categoryMap.set(row.category_rowguid, {
            category_slug: row.category_slug,
            subcategories: []
          });
        }
        if (row.sub_id) { // Check if a subcategory exists for this row
          categoryMap.get(row.category_rowguid).subcategories.push({
            subcategory_slug: row.Subcategory_slug
          });
        }
      });


      res.header('Content-Type', 'application/xml');
      res.header('Content-Encoding', 'UTF-8');

      let xml = '<?xml version="1.0" encoding="UTF-8"?>';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

      xml += `<url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`;
      xml += `<url><loc>${baseUrl}/about</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>`;
      xml += `<url><loc>${baseUrl}/privacy</loc><changefreq>yearly</changefreq><priority>0.5</priority></url>`;
      xml += `<url><loc>${baseUrl}/disclaimer</loc><changefreq>yearly</changefreq><priority>0.5</priority></url>`;
      xml += `<url><loc>${baseUrl}/contact</loc><changefreq>yearly</changefreq><priority>0.4</priority></url>`;

      // **FIXED**: Loop through the processed map instead of the raw data
      categoryMap.forEach(category => {
        xml += `<url><loc>${baseUrl}/${category.category_slug}</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>`;
        if (category.subcategories && category.subcategories.length > 0) {
            category.subcategories.forEach((sub: any) => {
                 xml += `<url><loc>${baseUrl}/${category.category_slug}/${sub.subcategory_slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
            });
        }
      });

      articles.forEach(article => {
        const pubDate = new Date(article.article_publishedat);
        const urlDate = `${pubDate.getFullYear()}/${(pubDate.getMonth() + 1).toString().padStart(2, '0')}/${pubDate.getDate().toString().padStart(2, '0')}`;
        // The category object is now correctly nested on the article
        const categorySlug = (article.article_categoryrowguid as Category)?.category_slug || 'uncategorized';
        const articleUrl = `${baseUrl}/${categorySlug}/${urlDate}/${article.article_slug}`;

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