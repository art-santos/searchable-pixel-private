import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getBlogPostBySlug, getBlogPosts, getAllTags } from '@/lib/blog'
import { TagBadge } from '@/components/blog/tag-badge'
import { LPTopBar } from '@/components/layout/lp-topbar'
import { BlogImage } from '@/components/blog/blog-image'
import { ShareButton } from '@/components/blog/share-button'
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
  
  // Get all posts to find related topics
  const allPosts = await getBlogPosts()
  const allTags = getAllTags(allPosts)
  
  // Find related tags (tags from this post that appear in other posts)
  const relatedTags = allTags
    .filter(tag => post.tags.includes(tag.name) && tag.count > 1)
    .slice(0, 6)
  
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
            
            {/* Meta info - simplified */}
            <div className="mb-2 text-sm text-gray-400">
              <time dateTime={new Date(post.date).toISOString()}>
                {formattedDate}
              </time>
              <span className="mx-1">•</span>
              <span>{post.readingTime}</span>
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
        
        {/* Related Topics & Share */}
        <div className="mx-auto mb-8 w-[92%] max-w-3xl md:w-[80%]">
          <div className="border-t border-[#2f2f2f] pt-8">
            {/* Related Topics */}
            {relatedTags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Related Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {relatedTags.map(tag => (
                    <TagBadge key={tag.name} tag={tag.name} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Share Button */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Share this article</h3>
              <ShareButton 
                url={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://split.ai'}/resources/${post.slug}`}
                title={post.title}
              />
            </div>
          </div>
        </div>
        
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