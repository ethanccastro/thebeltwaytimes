import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import session from 'express-session';
import { MikroORM } from '@mikro-orm/core';
import config from './mikro-orm.config';
import { NewsController } from './controllers/newsController';
import { AdminController } from './controllers/adminController';
import { DatabaseService } from './services/databaseService';

const app = express();
const PORT = process.env['PORT'] || 3000;

// Serve static files BEFORE routes and error handlers
app.use(express.static(path.join(process.cwd(), 'public')));

// Initialize MikroORM
let orm: MikroORM;

async function initializeDatabase() {
  try {
    orm = await MikroORM.init(config);
    
    // Run migrations
    const migrator = orm.getMigrator();
    await migrator.up();
    
    return orm;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

// Initialize database and services
let dbService: DatabaseService;
let newsController: NewsController;
let adminController: AdminController;

async function initializeServices() {
  const em = orm.em.fork();
  dbService = new DatabaseService(em);
  newsController = new NewsController(dbService);
  adminController = new AdminController(dbService);
}

// Middleware to add categories data to all views
async function setupViewMiddleware() {
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await dbService.getCategoriesWithSubcategories();
      res.locals.categories = categories;
      next();
    } catch (error) {
      console.error('Error loading categories for view:', error);
      res.locals.categories = [];
      next();
    }
  });
}

// Dynamic route setup function
async function setupRoutes() {
  const categories = await dbService.getAllCategories();
  
  // /test route for debugging
  app.get('/test', (req, res) => {
    res.send('Test route hit');
  });
  
  // Home route
  app.get('/', (req, res) => {
    newsController.getHome(req,res);
  });

  app.get('/sitemap.xml', newsController.getSitemapXml);
  
  // Admin routes (protected by IP)
  app.get('/admin', adminController.authMiddleware, adminController.getDashboard);
  
  // Admin API routes
  app.get('/admin/api/categories', adminController.authMiddleware, adminController.getCategories);
  app.get('/admin/api/categories/:id', adminController.authMiddleware, adminController.getCategory);
  app.post('/admin/api/categories', adminController.authMiddleware, adminController.createCategory);
  app.put('/admin/api/categories/:id', adminController.authMiddleware, adminController.updateCategory);
  app.delete('/admin/api/categories/:id', adminController.authMiddleware, adminController.deleteCategory);
  
  app.get('/admin/api/subcategories', adminController.authMiddleware, adminController.getSubcategories);
  app.get('/admin/api/subcategories/:id', adminController.authMiddleware, adminController.getSubcategory);
  app.post('/admin/api/subcategories', adminController.authMiddleware, adminController.createSubcategory);
  app.put('/admin/api/subcategories/:id', adminController.authMiddleware, adminController.updateSubcategory);
  app.delete('/admin/api/subcategories/:id', adminController.authMiddleware, adminController.deleteSubcategory);
  
  app.get('/admin/api/articles', adminController.authMiddleware, adminController.getArticles);
  app.get('/admin/api/articles/:id', adminController.authMiddleware, adminController.getArticle);
  app.post('/admin/api/articles', adminController.authMiddleware, adminController.createArticle);
  app.put('/admin/api/articles/:id', adminController.authMiddleware, adminController.updateArticle);
  app.delete('/admin/api/articles/:id', adminController.authMiddleware, adminController.deleteArticle);
  
  // Debug route to test API
  app.get('/admin/api/test', adminController.authMiddleware, (req, res) => {
    res.json({ message: 'API is working' });
  });
  
  // Debug route to log all admin API requests
  app.use('/admin/api/*', (req, res, next) => {
    console.log('🔍 Admin API Request:', req.method, req.path, req.body);
    next();
  });
  
  // Article routes (matches template URL pattern)
  app.get('/:category_slug/:year/:month/:day/:article_slug', newsController.getArticle);
  
  // Category routes
  for (const category of categories) {
    app.get(`/${category.category_slug}`, (req, res) => {
      (req.params as any)['category'] = category.category_slug;
      newsController.getCategory(req, res);
    });
    
    // Subcategory routes
    for (const subcategory of category.subcategories) {
      app.get(`/${category.category_slug}/${subcategory.subcategory_slug}`, (req, res) => {
        (req.params as any)['category'] = category.category_slug;
        (req.params as any)['subcategory'] = subcategory.subcategory_slug;
        newsController.getSubcategory(req, res);
      });
    }
  }
  
  // Article routes (simplified to use slug only)
  app.get('/article/:slug', newsController.getArticle);
  
  // Search route
  app.get('/search', newsController.search);
  
  // About page
  app.get('/about', newsController.getAbout);
}

// 404 handler
// app.use((req: Request, res: Response) => {
//   res.status(404).render('error', {
//     title: 'Page Not Found',
//     message: 'The page you are looking for does not exist.',
//     currentSection: 'error'
//   });
// });

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).render('error', {
    title: 'Server Error',
    message: 'Something went wrong on our end. Please try again later.',
    currentSection: 'error'
  });
});

// Main initialization function
async function startServer() {
  try {
    // Set EJS as the view engine
    app.set('view engine', 'ejs');
    app.set('views', path.join(process.cwd(), 'public/views'));
    app.set('trust proxy', true);

    // Body parser - MUST be before routes
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Session middleware
    app.use(
      session({
        secret: 'your-secret-key',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false }, // Set to true if using HTTPS
      })
    );

    // Initialize database
    await initializeDatabase();
    
    // Initialize services
    await initializeServices();
    
    // Setup view middleware
    await setupViewMiddleware();
    
    // Setup routes
    await setupRoutes();   
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 News site server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the application
startServer(); 