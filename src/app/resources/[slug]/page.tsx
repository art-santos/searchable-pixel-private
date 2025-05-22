import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getBlogPostBySlug, getBlogPosts } from '@/lib/blog'
import { TagBadge } from '@/components/blog/tag-badge'
import { LPTopBar } from '@/components/layout/lp-topbar'
import { BlogImage } from '@/components/blog/blog-image'
import { TableRenderer } from './table-renderer'

// Generate static paths for all blog posts
export async function generateStaticParams() {
  const posts = await getBlogPosts()
  return posts.map(post => ({
    slug: post.slug,
  }))
}

// Generate metadata for each blog post
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug)
  
  if (!post) {
    return {
      title: 'Post Not Found | Split',
      description: 'The requested blog post could not be found.',
    }
  }
  
  return {
    title: `${post.title} | Split Resources`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author.name],
      tags: post.tags,
    },
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPostBySlug(params.slug)
  
  if (!post) {
    notFound()
  }
  
  const formattedDate = new Date(post.date).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  
  return (
    <div className="flex min-h-screen flex-col">
      <LPTopBar />
      
      <main className="flex-1 pt-16">
        {/* Article header */}
        <header className="relative py-12 md:py-16">
          <div className="absolute inset-0 bg-gradient-to-b from-[#111] to-[#0c0c0c] -mt-20"></div>
          
          <div className="relative z-10 mx-auto w-[92%] max-w-3xl">
            {/* Title - moved above tags */}
            <h1 className="mb-6 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
              {post.title}
            </h1>
            
            {/* Tags - moved below title */}
            <div className="mb-6 flex flex-wrap gap-2">
              {post.tags.map(tag => (
                <TagBadge key={tag} tag={tag} />
              ))}
            </div>
            
            {/* Featured image */}
            {post.coverImage && (
              <BlogImage
                src={post.coverImage}
                alt={post.title}
                priority
                className="mb-6"
              />
            )}
            
            {/* Meta info - moved below image */}
            <div className="mb-2 flex justify-between items-center">
              {/* Author - left aligned */}
              <div className="flex items-center gap-2">
                {post.author.avatar ? (
                  <div className="overflow-hidden rounded-full">
                    <Image
                      src={post.author.avatar}
                      alt={post.author.name}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1f1f1f] text-sm font-medium text-white">
                    {post.author.name.charAt(0)}
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-300">{post.author.name}</span>
                  {post.author.title && (
                    <p className="text-xs text-gray-500">{post.author.title}</p>
                  )}
                </div>
              </div>
              
              {/* Date & Reading time - right aligned */}
              <div className="text-right text-sm text-gray-400">
                <time dateTime={new Date(post.date).toISOString()}>
                  {formattedDate}
                </time>
                <span className="mx-1">•</span>
                <span>{post.readingTime}</span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Article content */}
        <article className="mx-auto w-[92%] max-w-3xl pb-16 md:w-[80%]">
          {/* Structured data for AI crawlers */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'BlogPosting',
                'headline': post.title,
                'description': post.description,
                'datePublished': post.date,
                'dateModified': post.date,
                'author': {
                  '@type': 'Person',
                  'name': post.author.name,
                  'jobTitle': post.author.title || undefined,
                },
                'image': post.coverImage || undefined,
                'publisher': {
                  '@type': 'Organization',
                  'name': 'Split',
                  'logo': {
                    '@type': 'ImageObject',
                    'url': 'https://split.ai/logo.png'
                  }
                },
                'keywords': post.tags.join(', '),
                'mainEntityOfPage': {
                  '@type': 'WebPage',
                  '@id': `https://split.ai/resources/${post.slug}`
                }
              })
            }}
          />
          
          {/* Content with client-side table rendering */}
          <div className="prose prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-2xl prose-h3:text-xl prose-p:text-gray-300 prose-a:text-blue-400 prose-img:border prose-img:border-[#2f2f2f] prose-pre:border prose-pre:border-[#2f2f2f] prose-pre:bg-[#161616]">
            <TableRenderer htmlContent={post.content} />
          </div>
        </article>
        
        {/* Back to resources */}
        <div className="mx-auto mb-16 w-[92%] max-w-3xl md:w-[80%]">
          <Link
            href="/resources"
            className="inline-flex items-center text-sm text-gray-400 underline-offset-4 hover:text-white hover:underline"
          >
            ← Back to all resources
          </Link>
        </div>
      </main>
    </div>
  )
} 