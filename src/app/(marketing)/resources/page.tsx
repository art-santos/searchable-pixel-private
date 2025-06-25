import { Metadata } from 'next'
import { getAllTags, getBlogPosts, getFeaturedPosts } from '@/lib/blog'
import ResourcesClientContent from './resources-client-content'

// This generates metadata for the page - good for SEO and LLM search attribution
export const metadata: Metadata = {
  title: 'Guides & Resources | LLM-Search Attribution Playbooks – Split.dev',
  description: 'Learn LLM-search attribution, AI crawler tracking, and contact mapping strategies for B2B growth.',
  openGraph: {
    title: 'Guides & Resources | LLM-Search Attribution Playbooks – Split.dev',
    description: 'Learn LLM-search attribution, AI crawler tracking, and contact mapping strategies for B2B growth.',
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

  // Schema for resources page
  const resourcesSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": "https://split.dev/resources#webpage",
        "url": "https://split.dev/resources",
        "name": "Guides & Resources | LLM-Search Attribution Playbooks",
        "description": "Learn LLM-search attribution, AI crawler tracking, and contact mapping strategies for B2B growth.",
        "isPartOf": {
          "@type": "WebSite",
          "url": "https://split.dev",
          "name": "Split"
        },
        "mainEntity": {
          "@type": "ItemList",
          "name": "AI and LLM Resources",
          "description": "Comprehensive guides on AI crawler tracking, answer engine optimization, and lead attribution.",
          "numberOfItems": posts.length,
          "itemListElement": posts.slice(0, 10).map((post, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "item": {
              "@type": "Article",
              "name": post.title,
              "description": post.description.substring(0, 200),
              "url": `https://split.dev/resources/${post.slug}`,
              "author": {
                "@type": "Person",
                "name": post.author?.name || "Split Team"
              },
              "datePublished": post.date,
              "keywords": post.tags?.join(", ") || "AEO, AI tracking"
            }
          }))
        }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://split.dev"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Resources",
            "item": "https://split.dev/resources"
          }
        ]
      }
    ]
  }

  return (
    <div className="-mt-20">
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(resourcesSchema)
        }}
      />
      
      <ResourcesClientContent
        posts={posts}
        featuredPosts={featuredPosts}
        popularTags={popularTags}
      />
    </div>
  )
} 