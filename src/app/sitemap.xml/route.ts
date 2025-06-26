import { createClient } from '@/lib/supabase/server';
import { promises as fs } from 'fs';
import path from 'path';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://split.dev';

export const revalidate = 3600; // revalidate every hour

async function getBlogPosts() {
  const supabase = createClient();
  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('slug, updated_at')
    .eq('published', true)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching blog posts for sitemap:', error);
    return [];
  }

  return posts.map(({ slug, updated_at }) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: updated_at ? new Date(updated_at).toISOString() : new Date().toISOString(),
  }));
}

async function getStaticPages() {
  const marketingPagesDir = path.join(process.cwd(), 'src', 'app', '(marketing)');

  async function findPages(dir: string): Promise<string[]> {
    let pages: string[] = [];
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        pages = pages.concat(await findPages(fullPath));
      } else if (entry.isFile() && entry.name === 'page.tsx') {
        pages.push(fullPath);
      }
    }
    return pages;
  }

  const pagePaths = await findPages(marketingPagesDir);

  const staticRoutes = pagePaths.map((page) => {
    let route = page
      .replace(marketingPagesDir, '')
      .replace('/page.tsx', '');
      
    if (route === '') route = '/'; // Handle the root page
    if (route.endsWith('/') && route.length > 1) route = route.slice(0, -1);

    // A special case for the root marketing page which is just /
    if (route === '/index') {
        route = '/'
    }

    return {
      url: `${BASE_URL}${route}`,
      lastModified: new Date().toISOString(), // Static pages can have a recent date
    };
  });

  return staticRoutes;
}

function generateSitemapXml(urls: { url: string; lastModified: string }[]): string {
  const urlset = urls
    .map(({ url, lastModified }) => {
      return `
  <url>
    <loc>${url}</loc>
    <lastmod>${lastModified}</lastmod>
  </url>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urlset}
</urlset>`;
}

export async function GET() {
  try {
    const [blogPosts, staticPages] = await Promise.all([
      getBlogPosts(),
      getStaticPages(),
    ]);

    const allUrls = [...blogPosts, ...staticPages];
    const sitemapXml = generateSitemapXml(allUrls);

    return new Response(sitemapXml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    console.error('Failed to generate sitemap:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
} 