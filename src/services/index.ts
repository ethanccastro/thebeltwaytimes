import { EntityManager } from '@mikro-orm/core';
import { AdminService } from './adminService';
import { NewsService } from './newsService';
import { StaticService } from './staticService';

export function initializeServices(em: EntityManager) {
  const adminService = new AdminService(em);
  const newsService = new NewsService(em);
  const staticService = new StaticService(em);
  return { adminService, newsService, staticService };
}
