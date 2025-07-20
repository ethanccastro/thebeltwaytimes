-- Drop tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS article;
DROP TABLE IF EXISTS subcategory;
DROP TABLE IF EXISTS category;

-- Create category table
CREATE TABLE category (
    category_rowguid CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    category_slug VARCHAR(255) UNIQUE NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    category_description TEXT,
    category_color VARCHAR(50),
    category_createtime TIMESTAMP NOT NULL DEFAULT NOW(),
    category_updatetime TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create subcategory table
CREATE TABLE subcategory (
    subcategory_rowguid CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    subcategory_slug VARCHAR(255) UNIQUE NOT NULL,
    subcategory_name VARCHAR(255) NOT NULL,
    subcategory_description TEXT,
    subcategory_categoryrowguid CHAR(36) NOT NULL,
    subcategory_createtime TIMESTAMP NOT NULL DEFAULT NOW(),
    subcategory_updatetime TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (subcategory_categoryrowguid) REFERENCES category(category_rowguid) ON DELETE CASCADE
);

-- Create article table
CREATE TABLE article (
    article_rowguid CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    article_headline VARCHAR(500) NOT NULL,
    article_slug VARCHAR(500) UNIQUE NOT NULL,
    article_excerpt TEXT NOT NULL,
    article_content TEXT NOT NULL,
    article_author VARCHAR(255) NOT NULL,
    article_categoryrowguid CHAR(36) NOT NULL,
    article_subcategoryrowguid CHAR(36),
    article_publishedat TIMESTAMP NOT NULL,
    article_imageurl VARCHAR(4000),
    article_readtime INTEGER NOT NULL,
    article_tags JSON,
    article_featured BOOLEAN DEFAULT FALSE,
    article_isopinion BOOLEAN DEFAULT FALSE,
    article_createtime TIMESTAMP NOT NULL DEFAULT NOW(),
    article_updatetime TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (article_categoryrowguid) REFERENCES category(category_rowguid) ON DELETE CASCADE,
    FOREIGN KEY (article_subcategoryrowguid) REFERENCES subcategory(subcategory_rowguid) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX idx_article_category_rowguid ON article(article_categoryrowguid);
CREATE INDEX idx_article_subcategory_rowguid ON article(article_subcategoryrowguid);
CREATE INDEX idx_article_published_at ON article(article_publishedat DESC);
CREATE INDEX idx_article_featured ON article(article_featured);
CREATE INDEX idx_article_isopinion ON article(article_isopinion);
CREATE INDEX idx_article_slug ON article(article_slug);
CREATE INDEX idx_subcategory_category_rowguid ON subcategory(subcategory_categoryrowguid);
CREATE INDEX idx_category_slug ON category(category_slug);
CREATE INDEX idx_subcategory_slug ON subcategory(subcategory_slug);

-- Create a full-text search index on article content and headline
CREATE FULLTEXT INDEX idx_article_search ON article(article_headline, article_excerpt, article_content);

-- Insert sample categories
INSERT INTO category (category_slug, category_name, category_description, category_color) VALUES
('politics', 'Politics', 'Latest political news and analysis', '#dc3545'),
('business', 'Business', 'Business news and market updates', '#28a745'),
('technology', 'Technology', 'Tech industry news and innovations', '#007bff'),
('sports', 'Sports', 'Sports news and updates', '#ffc107'),
('entertainment', 'Entertainment', 'Entertainment and celebrity news', '#e83e8c'),
('health', 'Health', 'Health and medical news', '#20c997'),
('science', 'Science', 'Scientific discoveries and research', '#6f42c1'),
('world', 'World', 'International news and events', '#fd7e14');

-- Insert sample subcategories
INSERT INTO subcategory (subcategory_slug, subcategory_name, subcategory_description, subcategory_categoryrowguid) VALUES
-- Politics subcategories
('elections', 'Elections', 'Election news and updates', (SELECT category_rowguid FROM category WHERE category_slug = 'politics')),
('congress', 'Congress', 'Congressional news and legislation', (SELECT category_rowguid FROM category WHERE category_slug = 'politics')),
('white-house', 'White House', 'White House and presidential news', (SELECT category_rowguid FROM category WHERE category_slug = 'politics')),

-- Business subcategories
('markets', 'Markets', 'Stock market and financial news', (SELECT category_rowguid FROM category WHERE category_slug = 'business')),
('economy', 'Economy', 'Economic news and analysis', (SELECT category_rowguid FROM category WHERE category_slug = 'business')),
('startups', 'Startups', 'Startup and entrepreneurship news', (SELECT category_rowguid FROM category WHERE category_slug = 'business')),

-- Technology subcategories
('ai', 'Artificial Intelligence', 'AI and machine learning news', (SELECT category_rowguid FROM category WHERE category_slug = 'technology')),
('cybersecurity', 'Cybersecurity', 'Cybersecurity and privacy news', (SELECT category_rowguid FROM category WHERE category_slug = 'technology')),
('gadgets', 'Gadgets', 'New gadgets and consumer tech', (SELECT category_rowguid FROM category WHERE category_slug = 'technology')),

-- Sports subcategories
('football', 'Football', 'Football news and updates', (SELECT category_rowguid FROM category WHERE category_slug = 'sports')),
('basketball', 'Basketball', 'Basketball news and updates', (SELECT category_rowguid FROM category WHERE category_slug = 'sports')),
('baseball', 'Baseball', 'Baseball news and updates', (SELECT category_rowguid FROM category WHERE category_slug = 'sports')),

-- Entertainment subcategories
('movies', 'Movies', 'Movie news and reviews', (SELECT category_rowguid FROM category WHERE category_slug = 'entertainment')),
('tv', 'Television', 'TV show news and updates', (SELECT category_rowguid FROM category WHERE category_slug = 'entertainment')),
('music', 'Music', 'Music industry news', (SELECT category_rowguid FROM category WHERE category_slug = 'entertainment')),

-- Health subcategories
('medical', 'Medical', 'Medical research and health news', (SELECT category_rowguid FROM category WHERE category_slug = 'health')),
('fitness', 'Fitness', 'Fitness and wellness news', (SELECT category_rowguid FROM category WHERE category_slug = 'health')),
('nutrition', 'Nutrition', 'Nutrition and diet news', (SELECT category_rowguid FROM category WHERE category_slug = 'health')),

-- Science subcategories
('space', 'Space', 'Space exploration and astronomy', (SELECT category_rowguid FROM category WHERE category_slug = 'science')),
('climate', 'Climate', 'Climate science and environmental news', (SELECT category_rowguid FROM category WHERE category_slug = 'science')),
('research', 'Research', 'Scientific research and discoveries', (SELECT category_rowguid FROM category WHERE category_slug = 'science')),

-- World subcategories
('europe', 'Europe', 'European news and events', (SELECT category_rowguid FROM category WHERE category_slug = 'world')),
('asia', 'Asia', 'Asian news and events', (SELECT category_rowguid FROM category WHERE category_slug = 'world')),
('americas', 'Americas', 'News from the Americas', (SELECT category_rowguid FROM category WHERE category_slug = 'world'));

-- Insert sample articles
INSERT INTO article (article_headline, article_slug, article_excerpt, article_content, article_author, article_categoryrowguid, article_subcategoryrowguid, article_publishedat, article_imageurl, article_readtime, article_tags, article_featured, article_isopinion) VALUES
(
    'Major Tech Breakthrough in AI Development',
    'major-tech-breakthrough-ai-development',
    'Scientists announce revolutionary advances in artificial intelligence that could transform multiple industries.',
    'In a groundbreaking announcement today, researchers at leading technology institutions revealed a major breakthrough in artificial intelligence development...',
    'Dr. Sarah Chen',
    (SELECT category_rowguid FROM category WHERE category_slug = 'technology'),
    (SELECT subcategory_rowguid FROM subcategory WHERE subcategory_slug = 'ai'),
    NOW() - INTERVAL 2 HOUR,
    'https://example.com/images/ai-breakthrough.jpg',
    8,
    '["artificial intelligence", "technology", "innovation", "research"]',
    true,
    false
),
(
    'Stock Market Reaches New All-Time High',
    'stock-market-reaches-new-all-time-high',
    'The Dow Jones Industrial Average surged to unprecedented levels as investors respond to positive economic indicators.',
    'The stock market achieved a historic milestone today as the Dow Jones Industrial Average closed at a new all-time high of 38,654...',
    'Jennifer Martinez',
    (SELECT category_rowguid FROM category WHERE category_slug = 'business'),
    (SELECT subcategory_rowguid FROM subcategory WHERE subcategory_slug = 'markets'),
    NOW() - INTERVAL 4 HOUR,
    'https://example.com/images/stock-market.jpg',
    6,
    '["stock market", "economy", "finance", "investing"]',
    true,
    false
),
(
    'New Climate Study Reveals Accelerating Global Warming',
    'new-climate-study-reveals-accelerating-global-warming',
    'Comprehensive research shows global temperatures rising faster than previously predicted, with significant implications for future climate policy.',
    'A comprehensive new study published in Nature Climate Change reveals that global warming is accelerating at a rate faster than previously predicted by climate models...',
    'Dr. Emily Thompson',
    (SELECT category_rowguid FROM category WHERE category_slug = 'science'),
    (SELECT subcategory_rowguid FROM subcategory WHERE subcategory_slug = 'climate'),
    NOW() - INTERVAL 6 HOUR,
    'https://example.com/images/climate-study.jpg',
    10,
    '["climate change", "global warming", "environment", "science"]',
    false,
    false
),
(
    'Revolutionary Cancer Treatment Shows Promising Results',
    'revolutionary-cancer-treatment-shows-promising-results',
    'Clinical trials of a new immunotherapy treatment demonstrate remarkable success rates in treating previously untreatable cancers.',
    'A groundbreaking new cancer treatment has shown extraordinary results in clinical trials, offering hope to patients with previously untreatable forms of cancer...',
    'Dr. Robert Kim',
    (SELECT category_rowguid FROM category WHERE category_slug = 'health'),
    (SELECT subcategory_rowguid FROM subcategory WHERE subcategory_slug = 'medical'),
    NOW() - INTERVAL 8 HOUR,
    'https://example.com/images/cancer-treatment.jpg',
    12,
    '["cancer", "immunotherapy", "medical research", "health"]',
    true,
    false
),
(
    'SpaceX Successfully Launches Mars Mission',
    'spacex-successfully-launches-mars-mission',
    'Elon Musk''s SpaceX has successfully launched its first crewed mission to Mars, marking a historic milestone in space exploration.',
    'SpaceX has achieved a historic milestone in space exploration with the successful launch of its first crewed mission to Mars...',
    'Elon Musk',
    (SELECT category_rowguid FROM category WHERE category_slug = 'science'),
    (SELECT subcategory_rowguid FROM subcategory WHERE subcategory_slug = 'space'),
    NOW() - INTERVAL 12 HOUR,
    'https://example.com/images/mars-mission.jpg',
    9,
    '["space", "Mars", "SpaceX", "space exploration"]',
    true,
    false
),
(
    'The Future of Democracy in the Digital Age',
    'future-democracy-digital-age',
    'As technology continues to reshape our world, we must reconsider how democracy functions in an era of social media and artificial intelligence.',
    'The rapid advancement of technology has fundamentally altered the way we communicate, consume information, and participate in civic life...',
    'Dr. Michael Rodriguez',
    (SELECT category_rowguid FROM category WHERE category_slug = 'politics'),
    (SELECT subcategory_rowguid FROM subcategory WHERE subcategory_slug = 'elections'),
    NOW() - INTERVAL 24 HOUR,
    'https://example.com/images/democracy-digital.jpg',
    15,
    '["democracy", "technology", "politics", "social media"]',
    false,
    true
),
(
    'Why Traditional Media Must Adapt or Die',
    'traditional-media-adapt-or-die',
    'The journalism industry faces an existential crisis as digital platforms continue to dominate news consumption.',
    'The traditional media landscape is undergoing a transformation unlike anything we''ve seen since the invention of the printing press...',
    'Sarah Williams',
    (SELECT category_rowguid FROM category WHERE category_slug = 'business'),
    (SELECT subcategory_rowguid FROM subcategory WHERE subcategory_slug = 'startups'),
    NOW() - INTERVAL 36 HOUR,
    'https://example.com/images/media-crisis.jpg',
    12,
    '["media", "journalism", "digital transformation", "business"]',
    false,
    true
);

-- Create a view for featured articles
CREATE VIEW featured_articles AS
SELECT
    a.article_rowguid,
    a.article_headline,
    a.article_slug,
    a.article_excerpt,
    a.article_author,
    a.article_publishedat,
    a.article_imageurl,
    a.article_readtime,
    a.article_tags,
    c.category_name,
    c.category_slug,
    c.category_color,
    s.subcategory_name,
    s.subcategory_slug
FROM article a
JOIN category c ON a.article_categoryrowguid = c.category_rowguid
LEFT JOIN subcategory s ON a.article_subcategoryrowguid = s.subcategory_rowguid
WHERE a.article_featured = true
ORDER BY a.article_publishedat DESC;

-- Create a view for opinion articles
CREATE VIEW opinion_articles AS
SELECT
    a.article_rowguid,
    a.article_headline,
    a.article_slug,
    a.article_excerpt,
    a.article_author,
    a.article_publishedat,
    a.article_imageurl,
    a.article_readtime,
    a.article_tags,
    c.category_name,
    c.category_slug,
    c.category_color,
    s.subcategory_name,
    s.subcategory_slug
FROM article a
JOIN category c ON a.article_categoryrowguid = c.category_rowguid
LEFT JOIN subcategory s ON a.article_subcategoryrowguid = s.subcategory_rowguid
WHERE a.article_isopinion = true
ORDER BY a.article_publishedat DESC;

-- Grant necessary permissions (adjust as needed for your database setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_username;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_username;

COMMIT;