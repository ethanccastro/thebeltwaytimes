"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mysql_1 = require("@mikro-orm/mysql");
const Article_1 = require("./entities/Article");
const Category_1 = require("./entities/Category");
const Subcategory_1 = require("./entities/Subcategory");
const SocialUser_1 = require("./entities/SocialUser");
const SocialContent_1 = require("./entities/SocialContent");
require("dotenv/config");
exports.default = (0, mysql_1.defineConfig)({
    host: process.env.DB_HOST || 'localhost',
    port: +(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    dbName: process.env.DB_NAME || 'test',
    entities: [Article_1.Article, Category_1.Category, Subcategory_1.Subcategory, SocialUser_1.SocialUser, SocialContent_1.SocialContent],
    debug: true,
});
//# sourceMappingURL=mikro-orm.config.js.map