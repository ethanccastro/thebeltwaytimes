import { Request, Response } from 'express';
import { AdminService } from '../services/adminService';
import { v4 as uuidv4 } from 'uuid';

export class AdminController {
  private adminService: AdminService;
  private allowedIPs: string[];
  private categoryImageVisibility: { [key: string]: boolean } = {};

  constructor(adminService: AdminService) {
    this.adminService = adminService;
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
      const stats = await this.adminService.getAdminStats();
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
      const categories = await this.adminService.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  };

  public getCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const category = await this.adminService.getCategoryById(id);
      if (!category) {
        res.status(404).json({ error: '404 - Not Found' });
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

      // Prevent collisions with reserved/static routes
      const reservedSlugs = new Set([
        'admin', 'article', 'search', 'about', 'privacy', 'disclaimer', 'contact', 'sitemap.xml',
        'test', 'terms'
      ]);
      if (reservedSlugs.has(String(category_slug).toLowerCase())) {
        res.status(400).json({ error: `Slug "${category_slug}" is reserved. Please choose a different slug.` });
        return;
      }

      const now = new Date();
      const categoryData = {
        category_rowguid: uuidv4(),
        category_slug,
        category_name,
        category_description,
        category_color,
        category_createtime: now,
        category_updatetime: now
      };

      const category = await this.adminService.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating category:', error);
      const err = error as Error;
      res.status(500).json({ error: 'Failed to create category', message: err.message });
    }
  };

  public updateCategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { category_slug, category_name, category_description, category_color } = req.body;
      const updateData = {
        category_slug,
        category_name,
        category_description,
        category_color,
        category_updatetime: new Date()
      };

      const category = await this.adminService.updateCategory(id, updateData);
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

      const success = await this.adminService.deleteCategory(id);
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
      const subcategories = await this.adminService.getAllSubcategories();
      res.json(subcategories);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      res.status(500).json({ error: 'Failed to fetch subcategories' });
    }
  };

  public getSubcategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const subcategory = await this.adminService.getSubcategoryById(id);
      if (!subcategory) {
        res.status(404).json({ error: '404 - Not Found' });
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

      const now = new Date();
      const subcategoryData = {
        subcategory_rowguid: uuidv4(),
        subcategory_slug,
        subcategory_name,
        subcategory_description,
        subcategory_categoryrowguid: category_rowguid,
        subcategory_createtime: now,
        subcategory_updatetime: now
      };

      const subcategory = await this.adminService.createSubcategory(subcategoryData);
      res.status(201).json(subcategory);
    } catch (error) {
      console.error('Error creating subcategory:', error);
      res.status(500).json({ error: 'Failed to create subcategory' });
    }
  };

  public updateSubcategory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { subcategory_slug, subcategory_name, subcategory_description, category_rowguid } = req.body;
      const updateData: any = {
        subcategory_slug,
        subcategory_name,
        subcategory_description,
        subcategory_updatetime: new Date()
      };

      if (category_rowguid) {
        updateData.subcategory_categoryrowguid = category_rowguid;
      }

      const subcategory = await this.adminService.updateSubcategory(id, updateData);
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

      const success = await this.adminService.deleteSubcategory(id);
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
      const articles = await this.adminService.getAllArticles();
      res.json(articles);
    } catch (error) {
      console.error('Error fetching articles:', error);
      res.status(500).json({ error: 'Failed to fetch articles' });
    }
  };

  public getArticle = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const article = await this.adminService.getArticleById(id);
      if (!article) {
        res.status(404).json({ error: '404 - Not Found' });
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

      const now = new Date();
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
        article_categoryblock: article_categoryblock || false,
        article_createtime: now,
        article_updatetime: now
      };

      const article = await this.adminService.createArticle(articleData);
      res.status(201).json(article);
    } catch (error) {
      console.error('Error creating article:', error);
      res.status(500).json({ error: 'Failed to create article' });
    }
  };

  public updateArticle = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
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

      const updateData: any = {
        article_headline,
        article_slug,
        article_excerpt,
        article_content,
        article_author,
        article_categoryrowguid,
        article_publishedat,
        article_imageurl,
        article_readtime,
        article_featured,
        article_isopinion,
        article_main,
        article_trending,
        article_categoryblock,
        article_updatetime: new Date()
      };

      // Handle date fields
      if (updateData.article_publishedat) {
        updateData.article_publishedat = new Date(updateData.article_publishedat);
      }
      if (article_tags && typeof article_tags === 'string') {
        updateData.article_tags = article_tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
      } else if (Array.isArray(article_tags)) {
        updateData.article_tags = article_tags;
      }

      // Handle empty subcategory field
      if (article_subcategoryrowguid === '') {
        updateData.article_subcategoryrowguid = null;
      } else {
        updateData.article_subcategoryrowguid = article_subcategoryrowguid;
      }

      // Enforce mutual exclusivity for update
      const exclusives = [updateData.article_featured, updateData.article_main, updateData.article_trending, updateData.article_categoryblock].filter(Boolean);
      if (exclusives.length > 1) {
        res.status(400).json({ error: 'Only one of Featured, Main, Trending, or Category Block can be selected.' });
        return;
      }

      const article = await this.adminService.updateArticle(id, updateData);
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
      const success = await this.adminService.deleteArticle(id);
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

  // ===== SOCIAL USER CRUD =====
  public getSocialUsers = async (_req: Request, res: Response): Promise<void> => {
    try {
      const users = await this.adminService.getAllSocialUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching social users:', error);
      res.status(500).json({ error: 'Failed to fetch social users' });
    }
  };

  public getSocialUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.adminService.getSocialUserById(id);
      if (!user) {
        res.status(404).json({ error: '404 - Not Found' });
        return;
      }
      res.json(user);
    } catch (error) {
      console.error('Error fetching social user:', error);
      res.status(500).json({ error: 'Failed to fetch social user' });
    }
  };

  public createSocialUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { socialuser_displayname, socialuser_handle, socialuser_profilepictureurl } = req.body;
      if (!socialuser_displayname || !socialuser_handle) {
        res.status(400).json({ error: 'Display name and handle are required' });
        return;
      }
      const user = await this.adminService.createSocialUser({
        socialuser_rowguid: uuidv4(),
        socialuser_displayname,
        socialuser_handle,
        socialuser_profilepictureurl,
      });
      res.status(201).json(user);
    } catch (error) {
      console.error('Error creating social user:', error);
      const err = error as Error;
      res.status(500).json({ error: 'Failed to create social user', message: err.message });
    }
  };

  public updateSocialUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { socialuser_displayname, socialuser_handle, socialuser_profilepictureurl } = req.body;
      const updateData = {
        socialuser_displayname,
        socialuser_handle,
        socialuser_profilepictureurl
      };
      const user = await this.adminService.updateSocialUser(id, updateData);
      if (!user) {
        res.status(404).json({ error: '404 - Not Found' });
        return;
      }
      res.json(user);
    } catch (error) {
      console.error('Error updating social user:', error);
      res.status(500).json({ error: 'Failed to update social user' });
    }
  };

  public deleteSocialUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const success = await this.adminService.deleteSocialUser(id);
      if (!success) {
        res.status(404).json({ error: '404 - Not Found' });
        return;
      }
      res.json({ message: 'Social user deleted successfully' });
    } catch (error) {
      console.error('Error deleting social user:', error);
      res.status(500).json({ error: 'Failed to delete social user' });
    }
  };

  // ===== SOCIAL CONTENT CRUD =====
  public getSocialContents = async (_req: Request, res: Response): Promise<void> => {
    try {
      const contents = await this.adminService.getAllSocialContents();
      res.json(contents);
    } catch (error) {
      console.error('Error fetching social contents:', error);
      res.status(500).json({ error: 'Failed to fetch social contents' });
    }
  };

  public getSocialContent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const content = await this.adminService.getSocialContentById(id);
      if (!content) {
        res.status(404).json({ error: '404 - Not Found' });
        return;
      }
      res.json(content);
    } catch (error) {
      console.error('Error fetching social content:', error);
      res.status(500).json({ error: 'Failed to fetch social content' });
    }
  };

  public createSocialContent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { socialcontent_text, socialcontent_source, socialuser_rowguid } = req.body;
      if (!socialcontent_text || !socialuser_rowguid) {
        res.status(400).json({ error: 'Text and social user are required' });
        return;
      }
      const content = await this.adminService.createSocialContent({
        socialcontent_text,
        socialcontent_source,
        socialcontent_socialuserrowguid: socialuser_rowguid,
        socialcontent_postedat: new Date(),
      });
      res.status(201).json(content);
    } catch (error) {
      console.error('Error creating social content:', error);
      const err = error as Error;
      res.status(500).json({ error: 'Failed to create social content', message: err.message });
    }
  };

  public updateSocialContent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { socialuser_rowguid, socialcontent_text, socialcontent_source } = req.body;
      const updateData: any = {
        socialcontent_text,
        socialcontent_source,
      };

      if (socialuser_rowguid) {
        updateData.socialcontent_socialuserrowguid = socialuser_rowguid;
      }
      const content = await this.adminService.updateSocialContent(id, updateData);
      if (!content) {
        res.status(404).json({ error: '404 - Not Found' });
        return;
      }
      res.json(content);
    } catch (error) {
      console.error('Error updating social content:', error);
      res.status(500).json({ error: 'Failed to update social content' });
    }
  };

  public deleteSocialContent = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const success = await this.adminService.deleteSocialContent(id);
      if (!success) {
        res.status(404).json({ error: '404 - Not Found' });
        return;
      }
      res.json({ message: 'Social content deleted successfully' });
    } catch (error) {
      console.error('Error deleting social content:', error);
      res.status(500).json({ error: 'Failed to delete social content' });
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