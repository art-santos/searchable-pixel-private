import { Metadata } from 'next'
import Link from 'next/link'
import { BlogCard } from '@/components/blog/blog-card'
import { TagBadge } from '@/components/blog/tag-badge'
import { getAllTags, getBlogPosts } from '@/lib/blog'
import { LPTopBar } from '@/components/layout/lp-topbar'
import { notFound } from 'next/navigation'

// Generate metadata for each tag page
export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params
  const decodedTag = decodeURIComponent(tag)
  const formattedTag = decodedTag.charAt(0).toUpperCase() + decodedTag.slice(1)
  
  return {
    title: `${formattedTag} Resources | Split`,
    description: `Explore our resources and blog posts about ${formattedTag} and learn how Split can help optimize your content for AI engines.`,
    openGraph: {
      title: `${formattedTag} Resources | Split`,
      description: `Explore our resources and blog posts about ${formattedTag} and learn how Split can help optimize your content.`,
      url: `/resources/tag/${tag}`,
      type: 'website',
    },
  }
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params
  const tagSlug = decodeURIComponent(tag).toLowerCase()
  const allPosts = await getBlogPosts()
  const allTags = getAllTags(allPosts)
  
  // Find if the tag exists in our tag list
  const tagExists = allTags.some(t => t.name.toLowerCase() === tagSlug)
  
  if (!tagExists) {
    notFound()
  }
  
  // Filter posts by tag
  const posts = allPosts.filter(post => 
    post.tags.some(tag => tag.toLowerCase() === tagSlug)
  )
  
  // Format the tag name for display
  const formattedTag = tagSlug.charAt(0).toUpperCase() + tagSlug.slice(1)
  
  return (
    <div className="flex min-h-screen flex-col bg-[#0c0c0c]">
      <LPTopBar />
      
      {/* Hero Section */}
      <section className="relative mt-16 py-12 md:py-16">
        <div className="absolute inset-0 bg-gradient-to-b from-[#111] to-[#0c0c0c]" />
        
        <div className="relative z-10 mx-auto w-[92%] max-w-7xl md:w-[80%]">
          <div className="flex flex-col items-center text-center">
            <Link
              href="/resources"
              className="mb-4 text-sm text-gray-400 hover:text-white"
            >
              ← Back to all resources
            </Link>
            
            <div className="mb-4">
              <TagBadge tag={formattedTag} clickable={false} className="text-sm px-4 py-1" />
            </div>
            
            <h1 className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
              {formattedTag} Resources
            </h1>
            
            <p className="mx-auto mb-6 max-w-2xl text-base text-gray-300 md:text-lg">
              Articles, guides, and insights about {formattedTag.toLowerCase()}
            </p>
          </div>
        </div>
      </section>
      
      {/* Posts Section */}
      <section className="py-12">
        <div className="mx-auto w-[92%] max-w-7xl md:w-[80%]">
          {posts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map(post => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-400 mb-6">No posts found for this tag.</p>
              <Link
                href="/resources"
                className="inline-flex items-center justify-center bg-white px-6 py-2.5 font-medium text-[#0c0c0c] transition-colors hover:bg-gray-100 border border-white"
              >
                Browse All Resources
              </Link>
            </div>
          )}
        </div>
      </section>
      
      {/* Related Tags */}
      <section className="py-12 bg-[#0a0a0a]">
        <div className="mx-auto w-[92%] max-w-7xl md:w-[80%]">
          <h2 className="mb-6 text-xl font-bold text-white md:text-2xl">
            Related Topics
          </h2>
          
          <div className="flex flex-wrap gap-3">
            {allTags
              .filter(tag => tag.name.toLowerCase() !== tagSlug)
              .slice(0, 12)
              .map(tag => (
                <TagBadge 
                  key={tag.name} 
                  tag={tag.name} 
                  count={tag.count} 
                />
              ))}
          </div>
        </div>
      </section>
    </div>
  )
} 