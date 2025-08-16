import { Application } from 'express';
import { NewsController } from '../controllers/newsController';

export function setUpNewsRoutes(app: Application, newsController: NewsController) {
  app.get('/:category_slug/:year/:month/:day/:article_slug', 
    newsController.getArticle); 

  app.get('/:category/:subcategory', (req, res) => {
    newsController.getSubcategory(req, res);
  });

  app.get('/:category', (req, res) => {
    newsController.getCategory(req, res);
  });
}