'use client'

import { useState, useMemo, useEffect } from 'react'
import { BlogCard } from '@/components/blog/blog-card'
import { TagBadge } from '@/components/blog/tag-badge'
import CTASection from '@/components/sections/cta-section'
import type { BlogPost } from '@/types/blog'

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
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const filteredPosts = useMemo(() => {
    if (!selectedTag) {
      return posts
        .filter(post => !featuredPosts.find(fp => fp.slug === post.slug));
    }
    return posts
      .filter(post => !featuredPosts.find(fp => fp.slug === post.slug))
      .filter(post => post.tags.some((tag: string) => tag.toLowerCase() === selectedTag.toLowerCase()));
  }, [posts, featuredPosts, selectedTag])

  const handleTagClick = (tag: string | null) => {
    setSelectedTag(tag)
  }

  const displayTags = [{ name: 'All Topics', count: posts.length }, ...popularTags];

  return (
    <div className="-mt-20 bg-[#0c0c0c] text-white">
      <style jsx global>{`
        .fade-in {
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.6s ease-out;
        }
        
        .fade-in.visible {
          opacity: 1;
          transform: translateY(0);
        }
        
        .stagger-1 { transition-delay: 0.1s; }
        .stagger-2 { transition-delay: 0.2s; }
        .stagger-3 { transition-delay: 0.3s; }
        .stagger-4 { transition-delay: 0.4s; }
        
        .scale-in {
          opacity: 0;
          transform: scale(0.95);
          transition: all 0.5s ease-out;
        }
        
        .scale-in.visible {
          opacity: 1;
          transform: scale(1);
        }
        
        .slide-up {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.7s ease-out;
        }
        
        .slide-up.visible {
          opacity: 1;
          transform: translateY(0);
        }
        
        .tag-button {
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .tag-button:hover {
          transform: translateY(-2px);
        }
        
        .tag-button.active {
          transform: translateY(-1px);
        }
      `}</style>

      {/* Hero Section */}
      <section 
        className="min-h-[50vh] md:min-h-[60vh] w-full relative flex items-center justify-center pt-48 md:pt-52"
        style={{
          backgroundImage: 'url(/images/split-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c0c0c]/50 via-[#0c0c0c]/80 to-[#0c0c0c]" />
        
        <div className="relative z-10 w-[92%] md:w-[80%] max-w-7xl mx-auto px-2 md:px-4">
          <div className="text-center">
            <div className={`fade-in ${isLoaded ? 'visible' : ''}`}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6">
                LLM-Search Attribution<span className="font-serif font-light italic tracking-tight"> Playbooks</span>
              </h1>
            </div>
            <div className={`fade-in stagger-1 ${isLoaded ? 'visible' : ''}`}>
              <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto mb-8 md:mb-12">
                Master AI crawler tracking, contact mapping, and attribution strategies to turn AI citations into qualified pipeline
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="w-full py-12 md:py-16 bg-[#0c0c0c] relative">
          <div className="w-[92%] md:w-[80%] max-w-7xl mx-auto">
            <div className={`fade-in stagger-2 ${isLoaded ? 'visible' : ''}`}>
              <div className="text-center mb-12 md:mb-16">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
                  Featured Resources
                </h2>
                <div className="w-16 h-px bg-gray-600 mx-auto"></div>
              </div>
            </div>
            
            <div className={`scale-in stagger-3 ${isLoaded ? 'visible' : ''}`}>
              <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {featuredPosts.map((post, index) => (
                  <div 
                    key={post.slug}
                    className={`fade-in ${isLoaded ? 'visible' : ''}`}
                    style={{ transitionDelay: `${0.4 + index * 0.1}s` }}
                  >
                    <BlogCard post={post} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Resources Section */}
      <section className="w-full py-12 md:py-16 bg-[#0c0c0c] relative">
        <div className="w-[92%] md:w-[80%] max-w-7xl mx-auto">
          
          {/* Section Header */}
          <div className={`slide-up stagger-4 ${isLoaded ? 'visible' : ''}`}>
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
                {selectedTag ? selectedTag.charAt(0).toUpperCase() + selectedTag.slice(1) : 'All Resources'}
              </h2>
              <div className="w-16 h-px bg-gray-600 mx-auto mb-8"></div>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Expert insights on LLM-search attribution, crawler tracking, and contact identification strategies
              </p>
            </div>
          </div>

          {/* Topic Filter */}
          <div className={`fade-in ${isLoaded ? 'visible' : ''}`} style={{ transitionDelay: '0.5s' }}>
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-12 md:mb-16">
              {displayTags.map((tagObj, index) => (
                <button
                  key={tagObj.name}
                  onClick={() => handleTagClick(tagObj.name === 'All Topics' ? null : tagObj.name)}
                  className={`tag-button inline-flex items-center border px-4 py-2.5 text-sm font-medium transition-all duration-300
                    ${selectedTag === tagObj.name || (selectedTag === null && tagObj.name === 'All Topics')
                      ? 'bg-white text-[#0c0c0c] border-white active shadow-lg' 
                      : 'bg-[#0c0c0c] text-gray-300 border-[#333333] hover:border-[#444444] hover:bg-[#1a1a1a]'
                    }
                  `}
                  style={{ transitionDelay: `${0.6 + index * 0.05}s` }}
                >
                  {tagObj.name}
                  {tagObj.name !== 'All Topics' && tagObj.count !== undefined && (
                    <span className={`ml-2 text-xs ${selectedTag === tagObj.name ? 'text-[#666666]' : 'text-gray-500'}`}>
                      ({tagObj.count})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Filtered Posts Grid */}
          <div className={`scale-in ${isLoaded ? 'visible' : ''}`} style={{ transitionDelay: '0.7s' }}>
            {filteredPosts.length > 0 ? (
              <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPosts.map((post, index) => (
                  <div 
                    key={post.slug}
                    className={`fade-in ${isLoaded ? 'visible' : ''}`}
                    style={{ transitionDelay: `${0.8 + index * 0.1}s` }}
                  >
                    <BlogCard post={post} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 md:py-24">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-[#1a1a1a] border border-[#333333] rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {selectedTag ? `No resources found for "${selectedTag}"` : 'No resources available'}
                  </h3>
                  <p className="text-gray-400 mb-6">
                    {selectedTag 
                      ? 'Try selecting a different topic or view all resources.' 
                      : 'Check back soon for new content and insights!'
                    }
                  </p>
                  {selectedTag && (
                    <button
                      onClick={() => handleTagClick(null)}
                      className="inline-flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#333333] hover:border-[#444444] px-6 py-3 transition-all duration-200 text-white font-medium"
                    >
                      <span>View All Resources</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <div className={`fade-in ${isLoaded ? 'visible' : ''}`} style={{ transitionDelay: '0.9s' }}>
        <CTASection />
      </div>
    </div>
  )
} 