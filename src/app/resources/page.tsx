import { Metadata } from 'next'
import { getAllTags, getBlogPosts, getFeaturedPosts } from '@/lib/blog'
import { LPTopBar } from '@/components/layout/lp-topbar'
import ResourcesClientContent from './resources-client-content'

// This generates metadata for the page - good for SEO and AEO
export const metadata: Metadata = {
  title: 'Resources & Blog | Split',
  description: 'Explore our resources and blog posts about AI Engine Optimization (AEO), AI content strategy, and Next.js development best practices.',
  openGraph: {
    title: 'Resources & Blog | Split',
    description: 'Explore our resources and blog posts about AI Engine Optimization (AEO), AI content strategy, and Next.js development.',
    url: '/resources',
    type: 'website',
  },
}

export default async function ResourcesPage() {
  const posts = await getBlogPosts()
  
  // Simple approach: Take exactly 3 posts to feature (choose manually by slug)
  const featuredSlugs = [
    'building-domain-trust-for-ai',
    'quick-wins-for-aeo',
    'optimizing-nextjs-for-ai-crawlers'
  ]
  
  // Create featured posts array with only these 3 posts
  const featuredPosts = posts.filter(post => featuredSlugs.includes(post.slug))
  
  const tags = getAllTags(posts)
  const popularTags = tags.slice(0, 8)

  return (
    <div className="flex min-h-screen flex-col bg-[#0c0c0c] -mt-20">
      <LPTopBar />
      <ResourcesClientContent
        posts={posts}
        featuredPosts={featuredPosts}
        popularTags={popularTags}
      />
    </div>
  )
} 