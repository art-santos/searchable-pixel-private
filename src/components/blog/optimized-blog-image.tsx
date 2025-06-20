'use client'

import Image from 'next/image'
import { useState } from 'react'

interface OptimizedBlogImageProps {
  src: string
  alt: string
  priority?: boolean
  className?: string
  sizes?: string
  isCard?: boolean // For smaller card images vs hero images
}

export function OptimizedBlogImage({ 
  src, 
  alt, 
  priority = false, 
  className = '', 
  sizes,
  isCard = false 
}: OptimizedBlogImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  // Convert original PNG path to optimized WebP path
  const getOptimizedSrc = (originalSrc: string, size: string) => {
    if (!originalSrc.includes('/blog/article-cover-')) {
      return originalSrc // Return original if not a blog cover image
    }
    
    const fileName = originalSrc.split('/').pop()?.replace('.png', '') || ''
    return `/blog/optimized/${fileName}-${size}.webp`
  }
  
  // Determine the appropriate size based on context
  const getSizes = () => {
    if (sizes) return sizes
    
    if (isCard) {
      return "(min-width: 1024px) 384px, (min-width: 768px) 320px, 100vw"
    }
    
    return "(min-width: 1280px) 1200px, (min-width: 1024px) 960px, (min-width: 768px) 720px, 100vw"
  }
  
  // Choose the right optimized version based on context
  const getOptimizedSrcForContext = () => {
    if (isCard) {
      return getOptimizedSrc(src, 'md') // Use medium size for cards
    }
    return getOptimizedSrc(src, 'lg') // Use large size for hero images
  }
  
  return (
    <div className={`relative ${isCard ? 'h-48' : 'h-[400px]'} w-full ${className}`}>
      {/* Loading placeholder */}
      <div 
        className={`absolute inset-0 bg-gradient-to-b from-[#1f1f1f] to-[#0c0c0c] flex items-center justify-center transition-opacity duration-500 ${
          imageLoaded ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className={`border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin ${
            isCard ? 'w-8 h-8' : 'w-12 h-12'
          }`} />
          <span className={`text-gray-500 ${isCard ? 'text-xs' : 'text-sm'}`}>
            Loading image...
          </span>
        </div>
      </div>
      
      {/* Error state */}
      {imageError && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#1f1f1f] to-[#0c0c0c] flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 text-gray-500">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-xs text-gray-500">Image unavailable</span>
          </div>
        </div>
      )}
      
      <Image
        src={getOptimizedSrcForContext()}
        alt={alt}
        fill
        priority={priority}
        className={`object-cover transition-opacity duration-500 ${
          imageLoaded && !imageError ? 'opacity-100' : 'opacity-0'
        } ${isCard ? 'group-hover:scale-105 transition-transform duration-500' : ''}`}
        sizes={getSizes()}
        quality={priority ? 85 : 75}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          setImageError(true)
          setImageLoaded(true)
          
          // Fallback to original image
          const img = new window.Image()
          img.onload = () => {
            setImageError(false)
          }
          img.src = src
        }}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R7Dv5n9P//Z"
      />
    </div>
  )
} 