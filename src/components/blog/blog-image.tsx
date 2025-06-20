'use client'

import Image from 'next/image'
import { useState } from 'react'

interface BlogImageProps {
  src: string
  alt: string
  priority?: boolean
  className?: string
}

export function BlogImage({ src, alt, priority = false, className = '' }: BlogImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  
  return (
    <div className={`relative h-[400px] w-full ${className}`}>
      {/* Loading placeholder */}
      <div 
        className={`absolute inset-0 bg-gradient-to-b from-[#1f1f1f] to-[#0c0c0c] flex items-center justify-center transition-opacity duration-500 ${
          imageLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Loading image...</span>
        </div>
      </div>
      
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        className={`object-cover transition-opacity duration-500 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        sizes="(min-width: 1280px) 1200px, (min-width: 1024px) 960px, (min-width: 768px) 720px, 100vw"
        quality={priority ? 85 : 75}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={() => setImageLoaded(true)}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R7Dv5n9P//Z"
      />
    </div>
  )
} 