import { Request, Response, NextFunction } from 'express';

export class CSPMiddleware {
  /**
   * Sets Content Security Policy headers to allow necessary resources
   * while maintaining security
   */
  static setCSPHeaders(req: Request, res: Response, next: NextFunction) {
    const cspDirectives = [
      // Default source
      "default-src 'self'",
      
      // Script sources - allow self, Google Ads, and inline scripts
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://pagead2.googlesyndication.com https://www.googlesyndication.com https://www.google-analytics.com https://www.googletagmanager.com",
      
      // Style sources - allow self, Google Fonts, Font Awesome, and inline styles
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
      
      // Font sources - allow Google Fonts and Font Awesome
      "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
      
      // Image sources - allow self and common CDNs
      "img-src 'self' data: https: http:",
      
      // Connect sources - allow self and analytics
      "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com",
      
      // Frame sources - allow Google Ads
      "frame-src 'self' https://pagead2.googlesyndication.com https://www.googlesyndication.com",
      
      // Object sources - allow self
      "object-src 'self'",
      
      // Media sources - allow self
      "media-src 'self'",
      
      // Manifest sources - allow self
      "manifest-src 'self'",
      
      // Worker sources - allow self
      "worker-src 'self'",
      
      // Child sources - allow self
      "child-src 'self'",
      
      // Form actions - allow self
      "form-action 'self'",
      
      // Base URI - allow self
      "base-uri 'self'",
      
      // Upgrade insecure requests - disabled for development
      // "upgrade-insecure-requests"
    ];

    res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
    
    // Additional security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    next();
  }

  /**
   * Development-friendly CSP headers (less restrictive)
   */
  static setDevCSPHeaders(req: Request, res: Response, next: NextFunction) {
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: http:",
      "style-src 'self' 'unsafe-inline' https: http:",
      "font-src 'self' https: http:",
      "img-src 'self' data: https: http:",
      "connect-src 'self' https: http:",
      "frame-src 'self' https: http:",
      "object-src 'self'",
      "media-src 'self'",
      "manifest-src 'self'",
      "worker-src 'self'",
      "child-src 'self'",
      "form-action 'self'",
      "base-uri 'self'"
    ];

    res.setHeader('Content-Security-Policy', cspDirectives.join('; '));
    
    // Basic security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    next();
  }

  /**
   * Disable CSP headers (for debugging)
   */
  static disableCSP(req: Request, res: Response, next: NextFunction) {
    // Remove any existing CSP headers
    res.removeHeader('Content-Security-Policy');
    res.removeHeader('X-Content-Type-Options');
    res.removeHeader('X-Frame-Options');
    res.removeHeader('X-XSS-Protection');
    res.removeHeader('Referrer-Policy');
    
    next();
  }
}
