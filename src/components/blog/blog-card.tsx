'use client'

import Link from 'next/link'
import Image from 'next/image'
import { BlogPost } from '@/types/blog'
import { OptimizedBlogImage } from './optimized-blog-image'

interface BlogCardProps {
  post: BlogPost
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <Link 
      href={`/resources/${post.slug}`}
      className="group flex flex-col overflow-hidden border border-[#2f2f2f] bg-[#0c0c0c] transition-all duration-300 hover:border-[#3f3f3f] hover:shadow-lg"
    >
      <div className="relative h-48 w-full overflow-hidden">
        {post.coverImage ? (
          <OptimizedBlogImage
            src={post.coverImage}
            alt={post.title}
            isCard={true}
            className=""
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-[#1f1f1f] to-[#0c0c0c]">
            <span className="text-lg font-bold text-gray-500">Split</span>
          </div>
        )}
        {post.featured && (
          <div className="absolute top-2 right-2 bg-white px-2 py-1 text-xs font-medium text-[#0c0c0c] z-10 rounded">
            Featured
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5 border-t border-[#2f2f2f]">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <time>{new Date(post.date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })}</time>
          <span>•</span>
          <span>{post.readingTime}</span>
        </div>
        <h3 className="mt-2 mb-1 text-xl font-bold text-white line-clamp-2 group-hover:text-gray-200">
          {post.title}
        </h3>
        <p className="mb-4 text-sm text-gray-400 line-clamp-2">
          {post.description}
        </p>
        
        <div className="mt-auto flex items-center gap-2">
          {post.author.avatar ? (
            <div className="flex-none overflow-hidden rounded-full">
              <Image
                src={post.author.avatar}
                alt={post.author.name}
                width={24}
                height={24}
                className="rounded-full"
                loading="lazy"
              />
            </div>
          ) : (
            <div className="h-6 w-6 rounded-full bg-[#1f1f1f] flex items-center justify-center text-xs font-medium text-white">
              {post.author.name.charAt(0)}
            </div>
          )}
          <span className="text-xs text-gray-300">
            {post.author.name}
            {post.author.title && (
              <span className="text-gray-500"> · {post.author.title}</span>
            )}
          </span>
        </div>
      </div>
    </Link>
  )
} 