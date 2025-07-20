# Admin Interface Documentation

## Overview
This admin interface provides full CRUD (Create, Read, Update, Delete) operations for all database tables in your news website. It's secured by IP address restrictions to ensure only you can access it from your local machine.

## Security
- **IP Restriction**: The admin interface is only accessible from specific IP addresses:
  - `127.0.0.1` (localhost)
  - `::1` (IPv6 localhost)
  - `localhost`
  - `192.168.1.139` (your local network IP)

- **No Authentication Required**: Since it's IP-restricted, no username/password is needed

## Access
Navigate to: `http://localhost:3000/admin`

## Features

### Dashboard
- Overview statistics showing total articles, categories, and subcategories
- Quick action buttons to create new items
- Real-time data updates

### Articles Management
- **View**: See all articles with headline, author, category, publish date, and featured status
- **Create**: Add new articles with full content, metadata, and categorization
- **Edit**: Modify existing articles
- **Delete**: Remove articles with confirmation

**Article Fields:**
- Headline (required)
- Slug (required, URL-friendly)
- Excerpt
- Content (required)
- Author (required)
- Category (required)
- Subcategory (optional)
- Published Date
- Image URL
- Read Time (minutes)
- Tags (JSON array)
- Featured (checkbox)
- Opinion (checkbox)

### Categories Management
- **View**: See all categories with name, slug, description, and subcategory count
- **Create**: Add new categories
- **Edit**: Modify existing categories
- **Delete**: Remove categories (will fail if articles/subcategories exist)

**Category Fields:**
- Name (required)
- Slug (required, URL-friendly)
- Description
- Color (hex code)

### Subcategories Management
- **View**: See all subcategories with name, slug, parent category, and description
- **Create**: Add new subcategories (must select parent category)
- **Edit**: Modify existing subcategories
- **Delete**: Remove subcategories (will fail if articles exist)

**Subcategory Fields:**
- Name (required)
- Slug (required, URL-friendly)
- Category (required, parent category)
- Description

## API Endpoints

All admin operations are available via REST API endpoints:

### Categories
- `GET /admin/api/categories` - List all categories
- `GET /admin/api/categories/:id` - Get specific category
- `POST /admin/api/categories` - Create new category
- `PUT /admin/api/categories/:id` - Update category
- `DELETE /admin/api/categories/:id` - Delete category

### Subcategories
- `GET /admin/api/subcategories` - List all subcategories
- `GET /admin/api/subcategories/:id` - Get specific subcategory
- `POST /admin/api/subcategories` - Create new subcategory
- `PUT /admin/api/subcategories/:id` - Update subcategory
- `DELETE /admin/api/subcategories/:id` - Delete subcategory

### Articles
- `GET /admin/api/articles` - List all articles
- `GET /admin/api/articles/:id` - Get specific article
- `POST /admin/api/articles` - Create new article
- `PUT /admin/api/articles/:id` - Update article
- `DELETE /admin/api/articles/:id` - Delete article

## Usage Instructions

1. **Start the server**: `npm run dev`
2. **Access admin**: Go to `http://localhost:3000/admin`
3. **Navigate**: Use the top navigation to switch between sections
4. **Create items**: Click the "New" buttons or use quick actions
5. **Edit items**: Click the edit (pencil) icon in any table row
6. **Delete items**: Click the delete (trash) icon and confirm

## Technical Details

### Frontend
- **Framework**: Vanilla JavaScript with modern ES6+ features
- **Styling**: Custom CSS with responsive design
- **Icons**: Font Awesome 6.0
- **Modals**: Custom modal system for forms and confirmations

### Backend
- **Framework**: Express.js with TypeScript
- **Database**: MikroORM with MySQL
- **Security**: IP-based access control
- **Validation**: Server-side validation for all inputs

### File Structure
```
src/
├── controllers/
│   └── adminController.ts    # Admin CRUD operations
├── services/
│   └── databaseService.ts    # Database operations
└── index.ts                  # Main server file

public/
├── views/admin/
│   └── dashboard.ejs         # Admin dashboard template
├── css/
│   └── admin.css            # Admin styling
└── js/
    └── admin.js             # Admin JavaScript functionality
```

## Troubleshooting

### Access Denied Error
If you get "Access denied" errors:
1. Check that you're accessing from the correct IP address
2. Verify the server is running on localhost:3000
3. Check the console logs for IP detection information

### Database Errors
If you encounter database errors:
1. Ensure your MySQL database is running
2. Check that all migrations have been applied
3. Verify database connection settings in `mikro-orm.config.ts`

### Form Issues
If forms aren't working:
1. Check browser console for JavaScript errors
2. Verify that all required fields are filled
3. Ensure proper JSON format for tags field

## Customization

### Adding New IP Addresses
To allow access from additional IP addresses, edit `src/controllers/adminController.ts`:
```typescript
this.allowedIPs = ['127.0.0.1', '::1', 'localhost', '192.168.1.139', 'sdsd'];
```

### Modifying Form Fields
To add or modify form fields, edit the `generateFormHTML()` function in `public/js/admin.js`.

### Styling Changes
Modify `public/css/admin.css` to customize the appearance of the admin interface.

## Security Notes

- This admin interface is designed for local development and single-user access
- For production use, consider implementing proper authentication and authorization
- The IP restriction provides basic security but should not be the only security measure in production
- All database operations are logged to the console for debugging purposes 