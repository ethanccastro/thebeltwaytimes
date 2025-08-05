import { Request, Response } from 'express';
import { DatabaseService } from '../services/databaseService';
import { v4 as uuidv4 } from 'uuid';

export class AdminController {
  private dbService: DatabaseService;
  private allowedIPs: string[];
  private categoryImageVisibility: { [key: string]: boolean } = {};  

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
    // Add your local IP addresses here for security
    this.allowedIPs = ['127.0.0.1', '::1', 'localhost', '192.168.1.139', '162.207.201.37', '12.75.116.102'];
  }

  private isAuthorized(req: Request): boolean {
    const forwardedFor = req.headers['x-forwarded-for'];
    const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                    (typeof forwardedFor === 'string' ? forwardedFor : Array.isArray(forwardedFor) ? forwardedFor[0] : '');
    console.log('Client IP:', clientIP);
    console.log('Allowed IPs:', this.allowedIPs);
    return this.allowedIPs.includes(clientIP || '');
  }

  // Middleware to check authorization
  public authMiddleware = (req: Request, res: Response, next: () => void) => {
    console.log('🔐 Auth middleware called for:', req.method, req.path);
    console.log('🔐 Client IP:', req.ip);
    console.log('🔐 X-Forwarded-For:', req.headers['x-forwarded-for']);
    console.log('🔐 Remote Address:', req.connection.remoteAddress);
    
    if (!this.isAuthorized(req)) {
      console.log('❌ Access denied for IP:', req.ip);
      res.status(403).json({ error: 'Access denied. Admin access only.' });
      return;
    }
    console.log('✅ Access granted for IP:', req.ip);
    next();
  };

  // Admin dashboard
  public getDashboard = async (req: Request, res: Response) => {
    try {
      const stats = await this.dbService.getAdminStats();
      res.render('admin/dashboard', {
        title: 'Admin Dashboard',
        stats,
        currentSection: 'admin'
      });
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
      res.status(500).json({ error: 'Failed to load dashboard' });
    }
  };

  // ===== CATEGORY CRUD OPERATIONS =====
  public getCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      const categories = await this.dbService.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  };

  public getCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const category = await this.dbService.getCategoryById(id);
      if (!category) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }
      res.json(category);
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({ error: 'Failed to fetch category' });
    }
  };

  public createCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { category_slug, category_name, category_description, category_color } = req.body;
      
      if (!category_slug || !category_name) {
        res.status(400).json({ error: 'Slug and name are required' });
        return;
      }

      const categoryData = {
        category_rowguid: uuidv4(),
        category_slug,
        category_name,
        category_description,
        category_color
      };

      const category = await this.dbService.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).json({ error: 'Failed to create category' });
    }
  };

  public updateCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const category = await this.dbService.updateCategory(id, updateData);
      if (!category) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }
      res.json(category);
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ error: 'Failed to update category' });
    }
  };

  public deleteCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Check if category has articles
      const articlesUsingCategory = await this.dbService.getArticlesByCategoryId(id);
      if (articlesUsingCategory.length > 0) {
        res.status(400).json({ 
          error: 'Cannot delete category', 
          message: `This category is being used by ${articlesUsingCategory.length} article(s). Please remove or reassign these articles first.`,
          articlesCount: articlesUsingCategory.length
        });
        return;
      }
      
      // Check if category has subcategories
      const category = await this.dbService.getCategoryById(id);
      if (category && category.subcategories && category.subcategories.length > 0) {
        res.status(400).json({ 
          error: 'Cannot delete category', 
          message: `This category has ${category.subcategories.length} subcategory(ies). Please delete the subcategories first.`,
          subcategoriesCount: category.subcategories.length
        });
        return;
      }
      
      const success = await this.dbService.deleteCategory(id);
      if (!success) {
        res.status(404).json({ error: 'Category not found' });
        return;
      }
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ error: 'Failed to delete category' });
    }
  };

  // ===== SUBCATEGORY CRUD OPERATIONS =====
  public getSubcategories = async (req: Request, res: Response): Promise<void> => {
    try {
      const subcategories = await this.dbService.getAllSubcategories();
      res.json(subcategories);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      res.status(500).json({ error: 'Failed to fetch subcategories' });
    }
  };

  public getSubcategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const subcategory = await this.dbService.getSubcategoryById(id);
      if (!subcategory) {
        res.status(404).json({ error: 'Subcategory not found' });
        return;
      }
      res.json(subcategory);
    } catch (error) {
      console.error('Error fetching subcategory:', error);
      res.status(500).json({ error: 'Failed to fetch subcategory' });
    }
  };

  public createSubcategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { subcategory_slug, subcategory_name, subcategory_description, category_rowguid } = req.body;
      
      if (!subcategory_slug || !subcategory_name || !category_rowguid) {
        res.status(400).json({ error: 'Slug, name, and category are required' });
        return;
      }

      // Fetch the category object first
      const category = await this.dbService.getCategoryById(category_rowguid);
      if (!category) {
        res.status(400).json({ error: 'Category not found' });
        return;
      }

      const subcategoryData = {
        subcategory_rowguid: uuidv4(),
        subcategory_slug,
        subcategory_name,
        subcategory_description,
        category: category
      };

      const subcategory = await this.dbService.createSubcategory(subcategoryData);
      res.status(201).json(subcategory);
    } catch (error) {
      console.error('Error creating subcategory:', error);
      res.status(500).json({ error: 'Failed to create subcategory' });
    }
  };

  public updateSubcategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // If category_rowguid is provided, fetch the category object
      if (updateData.category_rowguid) {
        const category = await this.dbService.getCategoryById(updateData.category_rowguid);
        if (!category) {
          res.status(400).json({ error: 'Category not found' });
          return;
        }
        updateData.category = category;
        delete updateData.category_rowguid;
      }
      
      const subcategory = await this.dbService.updateSubcategory(id, updateData);
      if (!subcategory) {
        res.status(404).json({ error: 'Subcategory not found' });
        return;
      }
      res.json(subcategory);
    } catch (error) {
      console.error('Error updating subcategory:', error);
      res.status(500).json({ error: 'Failed to update subcategory' });
    }
  };

  public deleteSubcategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      
      // Check if subcategory has articles
      const articlesUsingSubcategory = await this.dbService.getArticlesBySubcategoryId(id);
      if (articlesUsingSubcategory.length > 0) {
        res.status(400).json({ 
          error: 'Cannot delete subcategory', 
          message: `This subcategory is being used by ${articlesUsingSubcategory.length} article(s). Please remove or reassign these articles first.`,
          articlesCount: articlesUsingSubcategory.length
        });
        return;
      }
      
      const success = await this.dbService.deleteSubcategory(id);
      if (!success) {
        res.status(404).json({ error: 'Subcategory not found' });
        return;
      }
      res.json({ message: 'Subcategory deleted successfully' });
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      res.status(500).json({ error: 'Failed to delete subcategory' });
    }
  };

  // ===== ARTICLE CRUD OPERATIONS =====
  public getArticles = async (req: Request, res: Response): Promise<void> => {
    try {
      const articles = await this.dbService.getAllArticles();
      res.json(articles);
    } catch (error) {
      console.error('Error fetching articles:', error);
      res.status(500).json({ error: 'Failed to fetch articles' });
    }
  };

  public getArticle = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const article = await this.dbService.getArticleById(id);
      if (!article) {
        res.status(404).json({ error: 'Article not found' });
        return;
      }
      res.json(article);
    } catch (error) {
      console.error('Error fetching article:', error);
      res.status(500).json({ error: 'Failed to fetch article' });
    }
  };

  public createArticle = async (req: Request, res: Response): Promise<void> => {
    try {
      console.log('📝 Creating article with data:', req.body);
      
      const {
        article_headline,
        article_slug,
        article_excerpt,
        article_content,
        article_author,
        article_categoryrowguid,
        article_subcategoryrowguid,
        article_publishedat,
        article_imageurl,
        article_readtime,
        article_tags,
        article_featured,
        article_isopinion,
        article_main,
        article_trending,
        article_categoryblock
      } = req.body;
      
      if (!article_headline || !article_slug || !article_content || !article_author || !article_categoryrowguid) {
        res.status(400).json({ error: 'Headline, slug, content, author, and category are required' });
        return;
      }

      // Enforce mutual exclusivity
      const exclusives = [article_featured, article_main, article_trending, article_categoryblock].filter(Boolean);
      if (exclusives.length > 1) {
        res.status(400).json({ error: 'Only one of Featured, Main, Trending, or Category Block can be selected.' });
        return;
      }

      const articleData = {
        article_rowguid: uuidv4(),
        article_headline,
        article_slug,
        article_excerpt,
        article_content,
        article_author,
        article_categoryrowguid,
        article_subcategoryrowguid: (article_subcategoryrowguid && article_subcategoryrowguid !== '') ? article_subcategoryrowguid : null,
        article_publishedat: article_publishedat ? new Date(article_publishedat) : new Date(),
        article_imageurl,
        article_readtime: article_readtime || 5,
        article_tags: Array.isArray(article_tags) ? article_tags : (article_tags ? article_tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0) : []),
        article_featured: article_featured || false,
        article_isopinion: article_isopinion || false,
        article_main: article_main || false,
        article_trending: article_trending || false,
        article_categoryblock: article_categoryblock || false
      };

      const article = await this.dbService.createArticle(articleData);
      res.status(201).json(article);
    } catch (error) {
      console.error('Error creating article:', error);
      res.status(500).json({ error: 'Failed to create article' });
    }
  };

  public updateArticle = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Handle date fields
      if (updateData.article_publishedat) {
        updateData.article_publishedat = new Date(updateData.article_publishedat);
      }
      if (updateData.article_tags && typeof updateData.article_tags === 'string') {
        updateData.article_tags = updateData.article_tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
      }
      
      // Handle empty subcategory field
      if (updateData.article_subcategoryrowguid === '') {
        updateData.article_subcategoryrowguid = null;
      }
      
      // Enforce mutual exclusivity for update
      const exclusives = [updateData.article_featured, updateData.article_main, updateData.article_trending, updateData.article_categoryblock].filter(Boolean);
      if (exclusives.length > 1) {
        res.status(400).json({ error: 'Only one of Featured, Main, Trending, or Category Block can be selected.' });
        return;
      }
      
      const article = await this.dbService.updateArticle(id, updateData);
      if (!article) {
        res.status(404).json({ error: 'Article not found' });
        return;
      }
      res.json(article);
    } catch (error) {
      console.error('Error updating article:', error);
      res.status(500).json({ error: 'Failed to update article' });
    }
  };

  public deleteArticle = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const success = await this.dbService.deleteArticle(id);
      if (!success) {
        res.status(404).json({ error: 'Article not found' });
        return;
      }
      res.json({ message: 'Article deleted successfully' });
    } catch (error) {
      console.error('Error deleting article:', error);
      res.status(500).json({ error: 'Failed to delete article' });
    }
  };

  public getCategoryImageVisibility = async (req: Request, res: Response): Promise<void> => {
    try {
      res.json(this.categoryImageVisibility);
    } catch (error) {
      console.error('Error fetching category image visibility:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  };

  public updateCategoryImageVisibility = async (req: Request, res: Response): Promise<void> => {
    try {
      const { categoryId, visible } = req.body;
      if (typeof categoryId !== 'string' || typeof visible !== 'boolean') {
        res.status(400).json({ error: 'Invalid request body' });
        return;
      }
      this.categoryImageVisibility[categoryId] = visible;
      console.log('🖼️ Category image visibility updated:', this.categoryImageVisibility);
      res.json({ success: true, message: 'Settings updated' });
    } catch (error) {
      console.error('Error updating category image visibility:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  };  
} 