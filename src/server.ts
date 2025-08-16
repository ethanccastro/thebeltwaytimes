import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import session from 'express-session';
import { MikroORM } from '@mikro-orm/core';
import config from './mikro-orm.config';
import { NewsController } from './controllers/newsController';
import { AdminController } from './controllers/adminController';
import { StaticController } from './controllers/staticController';
import { DatabaseService } from './services/databaseService';

import { setUpStaticRoutes } from './routes/staticRoutes';
import { setUpNewsRoutes } from './routes/newsRoutes';
import { setUpAdminRoutes } from './routes/adminRoutes';

const app = express();
const PORT = process.env['PORT'] || 3000;

// Serve static files BEFORE routes and error handlers
app.use(express.static(path.join(process.cwd(), 'public')));

let orm: MikroORM;

// Start the application
startServer(); 

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
        cookie: { secure: process.env.NODE_ENV === 'production' }, // More secure for production
      })
    );

    // Initialize database
    await initializeDatabase();
    
    // Initialize services
    initializeServices();
    
    // Setup view middleware
    setupViewMiddleware();
    
    // Setup routes
    setupRoutes();   
    
    // Error handling middleware (should be last)
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        console.error(err);
        res.status(500).render('error', {
            title: 'Server Error',
            message: 'Something went wrong on our end. Please try again later.',
            currentSection: 'error'
        });
    });
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 News site server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

async function initializeDatabase() {
  try {
    orm = await MikroORM.init(config);
    
    // Run migrations
    const migrator = orm.getMigrator();
    await migrator.up();
    
    return orm;
  } catch (error) {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  }
}

// Initialize database and services
let dbService: DatabaseService;
let newsController: NewsController;
let adminController: AdminController;
let staticController: StaticController;

function initializeServices() {
  const em = orm.em.fork();
  dbService = new DatabaseService(em);
  newsController = new NewsController(dbService);
  adminController = new AdminController(dbService);
  staticController = new StaticController(dbService);
}

// Middleware to add categories data to all views
function setupViewMiddleware() {
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    try {
      // **FIXED: Use getAllCategories for simple navigation lists**
      const categories = await dbService.getAllCategories();
      res.locals.categories = categories;
      
      // Pass the settings to the views
      res.locals.categoryImageVisibility = adminController['categoryImageVisibility'];
      next();
    } catch (error) {
      console.error("Error fetching data for views:", error);
      res.locals.categories = [];
      res.locals.categoryImageVisibility = {};
      next(); // IMPORTANT: Still call next() on error so the site doesn't hang
    }
  });
}

// Dynamic route setup function
function setupRoutes() {
  setUpStaticRoutes(app, staticController);
  setUpAdminRoutes(app, adminController) 
  // Set up after ALL static routes are handled
  setUpNewsRoutes(app, newsController);
}
