import { Application } from 'express';
import { NewsController } from '../controllers/newsController';
import { RedirectController } from '../controllers/redirectController';

export function setUpNewsRoutes(
  app: Application,
  newsController: NewsController,
  redirectController: RedirectController
) {
  app.get('/:slug([a-zA-Z0-9_-]+)', redirectController.handleRedirect);
  
  app.get(
    '/:category_slug/:year/:month/:day/:article_slug',
    newsController.getArticle
  );

  app.get('/:category/:subcategory', (req, res) => {
    newsController.getSubcategory(req, res);
  });

  app.get('/:category', (req, res) => {
    newsController.getCategory(req, res);
  });
}
