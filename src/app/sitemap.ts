import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server'; // Use server client for data fetching

// Base URL of your website
const BASE_URL = 'https://www.origamiagents.com'; // Replace with your actual domain

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();

  // 1. Fetch published blog posts
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('slug, updated_at') // Select slug and last modified date
    .eq('published', true);

  if (postsError) {
    console.error('Error fetching posts for sitemap:', postsError);
  }

  const blogUrls = posts?.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
  })) ?? [];

  // 2. Fetch published programmatic pages
  const { data: programmaticPages, error: pagesError } = await supabase
    .from('programmatic_pages')
    .select('slug, updated_at') // Select slug and last modified date
    .eq('status', 'published');

  if (pagesError) {
    console.error('Error fetching programmatic pages for sitemap:', pagesError);
  }

  const articleUrls = programmaticPages?.map((page) => ({
    url: `${BASE_URL}/article/${page.slug}`,
    lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
  })) ?? [];

  // 3. Define static routes
  const staticRoutes = [
    '/',
    '/company',
    '/manifesto',
    '/careers',
    '/blog', // Main blog listing page
    // Add other static pages like /privacy, /terms, etc.
    '/privacy',
    '/terms',
    // Add main product pages
    '/healthcare',
    '/recruiting',
    '/ecommerce',
    '/saas',
    '/fintech',
    '/real-estate',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(), // Use current date for static pages, or set manually
  }));

  // 4. Combine all URLs
  return [
    ...staticRoutes,
    ...blogUrls,
    ...articleUrls,
  ];
} 