import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import rehypePrism from 'rehype-prism-plus';
import remarkFrontmatter from 'remark-frontmatter';
import matter from 'gray-matter';
import Image from 'next/image';

// Define props for the page
interface PageProps {
  params: {
    slug: string;
  };
}

// Define the metadata format
interface PostMetadata {
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  slug: string;
  [key: string]: any;
}

// Components to enhance the MDX content
const components = {
  // You can customize MDX components here
  h1: (props: any) => <h1 className="text-3xl font-bold mt-8 mb-4" {...props} />,
  h2: (props: any) => <h2 className="text-2xl font-bold mt-6 mb-3" {...props} />,
  h3: (props: any) => <h3 className="text-xl font-bold mt-5 mb-2" {...props} />,
  p: (props: any) => <p className="my-4" {...props} />,
  a: (props: any) => <a className="text-blue-600 hover:underline" {...props} />,
  ul: (props: any) => <ul className="list-disc ml-6 my-4" {...props} />,
  ol: (props: any) => <ol className="list-decimal ml-6 my-4" {...props} />,
  li: (props: any) => <li className="my-1" {...props} />,
  img: (props: any) => (
    <Image
      src={props.src}
      alt={props.alt || ''}
      width={800}
      height={500}
      className="rounded-lg mx-auto my-6"
    />
  ),
  blockquote: (props: any) => (
    <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4" {...props} />
  ),
  code: (props: any) => {
    // Check if it's an inline code or a code block
    if (typeof props.className === 'string') {
      // Code block
      return <code className="block p-4 my-4 bg-gray-800 text-white rounded overflow-x-auto" {...props} />;
    }
    // Inline code
    return <code className="bg-gray-100 rounded px-1 py-0.5" {...props} />;
  },
};

// Function to get post data
async function getPostBySlug(slug: string): Promise<{ content: string; metadata: PostMetadata }> {
  const contentDir = process.env.SPLIT_CONTENT_DIR || 'content/split';
  const fullPath = path.join(process.cwd(), contentDir, `${slug}.mdx`);
  
  try {
    const source = fs.readFileSync(fullPath, 'utf8');
    const { content, data } = matter(source);
    return {
      content,
      metadata: {
        ...(data as PostMetadata),
        slug,
      },
    };
  } catch (error) {
    console.error(`Error reading post for slug ${slug}:`, error);
    throw error;
  }
}

// Format date to readable format
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Generate metadata for the page
export async function generateMetadata({ params }: PageProps) {
  try {
    const { metadata } = await getPostBySlug(params.slug);
    return {
      title: metadata.title,
      description: metadata.description,
    };
  } catch (error) {
    return {
      title: 'Post Not Found',
      description: 'The requested post could not be found.',
    };
  }
}

// The Blog Post page component
export default async function BlogPostPage({ params }: PageProps) {
  try {
    const { content, metadata } = await getPostBySlug(params.slug);
    
    return (
      <article className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-4">{metadata.title}</h1>
          <p className="text-gray-600 mb-2">{formatDate(metadata.date)}</p>
          <p className="text-gray-600 mb-4">By {metadata.author}</p>
          
          {metadata.tags && metadata.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {metadata.tags.map((tag: string) => (
                <span 
                  key={tag} 
                  className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="prose prose-lg max-w-none">
          <MDXRemote 
            source={content} 
            components={components}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm, remarkFrontmatter],
                rehypePlugins: [rehypePrism],
              }
            }} 
          />
        </div>
      </article>
    );
  } catch (error) {
    console.error('Error loading post:', error);
    notFound();
  }
} 