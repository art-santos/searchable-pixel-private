import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { BlogPost } from '@/types/blog';

const BLOG_DIRECTORY = path.join(process.cwd(), 'src/content/blog');

export async function getBlogPosts(): Promise<BlogPost[]> {
  // Check if directory exists
  if (!fs.existsSync(BLOG_DIRECTORY)) {
    return [];
  }

  const fileNames = fs.readdirSync(BLOG_DIRECTORY);
  const allPostsData = await Promise.all(
    fileNames
      .filter(fileName => fileName.endsWith('.mdx') || fileName.endsWith('.md'))
      .map(async fileName => {
        const slug = fileName.replace(/\.mdx?$/, '');
        const fullPath = path.join(BLOG_DIRECTORY, fileName);
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const { data, content } = matter(fileContents);

        // Convert markdown to HTML
        const processedContent = await remark()
          .use(html)
          .process(content);
        const contentHtml = processedContent.toString();

        return {
          slug,
          title: data.title,
          description: data.description || '',
          date: data.date,
          author: data.author || { name: 'Split Team' },
          content: contentHtml,
          tags: data.tags || [],
          readingTime: calculateReadingTime(content),
          featured: data.featured || false,
          coverImage: data.coverImage || '',
        } as BlogPost;
      })
  );

  // Sort posts by date in descending order
  return allPostsData.sort((a, b) => (new Date(b.date).getTime() - new Date(a.date).getTime()));
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const fullPath = path.join(BLOG_DIRECTORY, `${slug}.mdx`);
    let filePath = fullPath;
    
    // Check if MDX file exists, if not try MD
    if (!fs.existsSync(fullPath)) {
      const mdPath = path.join(BLOG_DIRECTORY, `${slug}.md`);
      if (!fs.existsSync(mdPath)) {
        return null;
      }
      filePath = mdPath;
    }
    
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContents);
    
    // Convert markdown to HTML
    const processedContent = await remark()
      .use(html)
      .process(content);
    const contentHtml = processedContent.toString();
    
    return {
      slug,
      title: data.title,
      description: data.description || '',
      date: data.date,
      author: data.author || { name: 'Split Team' },
      content: contentHtml,
      tags: data.tags || [],
      readingTime: calculateReadingTime(content),
      featured: data.featured || false,
      coverImage: data.coverImage || '',
    } as BlogPost;
  } catch (error) {
    console.error(`Error getting blog post by slug: ${slug}`, error);
    return null;
  }
}

export function calculateReadingTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

export function getFeaturedPosts(posts: BlogPost[], count = 3): BlogPost[] {
  // Get posts marked as featured
  const featuredPosts = posts.filter(post => post.featured);
  
  // Sort featured posts by date (most recent first)
  const sortedFeaturedPosts = [...featuredPosts].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });
  
  // Log for debugging
  console.log('Sorted featured posts:');
  sortedFeaturedPosts.forEach(post => {
    console.log(`${post.title} - ${post.date} - Featured: ${post.featured}`);
  });
  
  // Take only the most recent featured posts up to the count
  return sortedFeaturedPosts.slice(0, count);
}

export function getAllTags(posts: BlogPost[]): { name: string; count: number }[] {
  const tagMap = new Map<string, number>();
  
  posts.forEach(post => {
    post.tags.forEach(tag => {
      const currentCount = tagMap.get(tag) || 0;
      tagMap.set(tag, currentCount + 1);
    });
  });
  
  return Array.from(tagMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
} 