import { MetadataRoute } from 'next';

// Base URL of your website
const BASE_URL = 'https://www.split.dev';

export default function sitemap(): MetadataRoute.Sitemap {
  // Define static routes
  const staticRoutes = [
    '/',
    '/dashboard',
    '/settings',
    '/docs',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '/' ? 'daily' as const : 'weekly' as const,
    priority: route === '/' ? 1.0 : 0.8,
  }));

  return staticRoutes;
} 