import { Application } from 'express';
import { StaticController } from '../controllers/staticController';

// Search route
export function setUpStaticRoutes(app: Application, staticController: StaticController) {
    app.get('/', staticController.getHome);
    app.get('/search', staticController.search);  
    app.get('/about', staticController.getAbout);    
    app.get('/privacy', staticController.getPrivacy);
    app.get('/disclaimer', staticController.getDisclaimer);
    app.get('/contact', staticController.getContact);    
    app.get('/terms', staticController.getTerms); 
    app.get('/sitemap.xml', staticController.getSitemapXml);
    
}