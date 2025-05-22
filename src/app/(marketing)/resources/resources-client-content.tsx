'use client'

import { useState, useMemo } from 'react'
import { BlogCard } from '@/components/blog/blog-card'
import { TagBadge } from '@/components/blog/tag-badge' // Assuming TagBadge can be used for buttons or similar
import type { BlogPost } from '@/types/blog'
import CTASection from '@/components/sections/cta-section'

interface ResourcesClientContentProps {
  posts: BlogPost[]
  featuredPosts: BlogPost[]
  popularTags: { name: string; count: number }[]
}

export default function ResourcesClientContent({
  posts,
  featuredPosts,
  popularTags,
}: ResourcesClientContentProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null) // null means 'All Topics'

  const filteredPosts = useMemo(() => {
    if (!selectedTag) {
      return posts // Show all non-featured posts if 'All Topics' or no tag is selected
        .filter(post => !featuredPosts.find(fp => fp.slug === post.slug));
    }
    return posts
      .filter(post => !featuredPosts.find(fp => fp.slug === post.slug))
      .filter(post => post.tags.some((tag: string) => tag.toLowerCase() === selectedTag.toLowerCase()));
  }, [posts, featuredPosts, selectedTag])

  const handleTagClick = (tag: string | null) => {
    setSelectedTag(tag)
  }

  // Ensure "All Topics" is an option, and popularTags are formatted for button display
  const displayTags = [{ name: 'All Topics', count: posts.length }, ...popularTags];

  return (
    <>
      {/* Hero Section */}
      <section className="relative pt-56 md:pt-64">
        <div className="absolute inset-0 bg-gradient-to-b from-[#111] to-[#0c0c0c]" />
        <div className="relative z-10 mx-auto w-[92%] max-w-7xl md:w-[80%]">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl lg:text-6xl">
              Get Ranked Where it Matters
            </h1>
            <p className="mx-auto mb-6 max-w-2xl text-lg text-gray-300 md:text-xl">
              Discover proven strategies to get your content cited by AI engines and dominate the new search landscape
            </p>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="py-16" aria-labelledby="featured-posts-heading">
          <div className="mx-auto w-[92%] max-w-7xl md:w-[80%]">
            <h2 id="featured-posts-heading" className="mb-6 text-2xl font-bold text-white md:text-3xl">
              Featured Resources
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredPosts.map(post => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Popular Topics Filter / Main Articles Section */}
      <section className="py-16" aria-labelledby="popular-topics-heading">
        <div className="mx-auto w-[92%] max-w-7xl md:w-[80%]">
          <h2 id="popular-topics-heading" className="mb-8 text-center text-2xl font-bold text-white md:text-3xl">
            {selectedTag ? selectedTag.charAt(0).toUpperCase() + selectedTag.slice(1) : 'All Resources'}
          </h2>
          <div className="mb-10 flex flex-wrap items-center justify-center gap-3">
            {displayTags.map(tagObj => (
              <button
                key={tagObj.name}
                onClick={() => handleTagClick(tagObj.name === 'All Topics' ? null : tagObj.name)}
                className={`inline-flex items-center border px-3 py-1.5 text-sm font-medium transition-colors
                  ${selectedTag === tagObj.name || (selectedTag === null && tagObj.name === 'All Topics')
                    ? 'bg-white text-[#0c0c0c] border-white' 
                    : 'bg-[#161616] text-gray-300 border-[#2f2f2f] hover:border-[#3f3f3f] hover:bg-[#1a1a1a]'
                  }
                `}
              >
                {tagObj.name}
                {tagObj.name !== 'All Topics' && tagObj.count !== undefined && (
                  <span className={`ml-1.5 ${selectedTag === tagObj.name ? 'text-[#0c0c0c]' : 'text-gray-500'}`}>
                    ({tagObj.count})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Filtered Posts (Main Articles) */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map(post => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
          {filteredPosts.length === 0 && selectedTag && (
            <p className="py-12 text-center text-gray-400">
              No resources found for "{selectedTag}". Try another topic or view all resources.
            </p>
          )}
          {posts.length === 0 && ( // Only show this if there are no posts at all
             <p className="py-12 text-center text-gray-400">
               No blog posts found. Check back soon for new content!
             </p>
           )}
        </div>
      </section>

      <CTASection />
    </>
  )
} 