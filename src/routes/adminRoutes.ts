import { Application } from 'express';
import { AdminController } from '../controllers/adminController';

export function setUpAdminRoutes(app: Application, adminController: AdminController) {
    app.get('/admin', adminController.authMiddleware, adminController.getDashboard);

 
  app.get('/admin/api/categories', adminController.authMiddleware, adminController.getCategories);
  app.get('/admin/api/categories/:id', adminController.authMiddleware, adminController.getCategory);
  app.post('/admin/api/categories', adminController.authMiddleware, adminController.createCategory);
  app.put('/admin/api/categories/:id', adminController.authMiddleware, adminController.updateCategory);
  app.delete('/admin/api/categories/:id', adminController.authMiddleware, adminController.deleteCategory);
  
  app.get('/admin/api/settings/category-image', adminController.authMiddleware, adminController.getCategoryImageVisibility);
  app.post('/admin/api/settings/category-image', adminController.authMiddleware, adminController.updateCategoryImageVisibility);  


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
  
  app.get('/admin/api/socialusers', adminController.authMiddleware, adminController.getSocialUsers);
  app.get('/admin/api/socialusers/:id', adminController.authMiddleware, adminController.getSocialUser);
  app.post('/admin/api/socialusers', adminController.authMiddleware, adminController.createSocialUser);
  app.put('/admin/api/socialusers/:id', adminController.authMiddleware, adminController.updateSocialUser);
  app.delete('/admin/api/socialusers/:id', adminController.authMiddleware, adminController.deleteSocialUser);

  app.get('/admin/api/socialcontents', adminController.authMiddleware, adminController.getSocialContents);
  app.get('/admin/api/socialcontents/:id', adminController.authMiddleware, adminController.getSocialContent);
  app.post('/admin/api/socialcontents', adminController.authMiddleware, adminController.createSocialContent);
  app.put('/admin/api/socialcontents/:id', adminController.authMiddleware, adminController.updateSocialContent);
  app.delete('/admin/api/socialcontents/:id', adminController.authMiddleware, adminController.deleteSocialContent);
}