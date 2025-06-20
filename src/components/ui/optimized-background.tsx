'use client'

import { useEffect, useState } from 'react'

interface OptimizedBackgroundProps {
  src: string // Original image path
  className?: string
  children?: React.ReactNode
  fallbackColor?: string
}

export function OptimizedBackground({ 
  src, 
  className = '', 
  children, 
  fallbackColor = '#0c0c0c'
}: OptimizedBackgroundProps) {
  const [backgroundImage, setBackgroundImage] = useState<string>('')
  const [isLoaded, setIsLoaded] = useState(false)

  // Convert original path to optimized WebP path based on screen size
  const getOptimizedSrc = (originalSrc: string) => {
    if (!originalSrc.includes('/images/split-bg.png')) {
      return originalSrc // Return original if not the background image
    }

    // Determine appropriate size based on viewport
    const getResponsiveSize = () => {
      if (typeof window === 'undefined') return 'desktop'
      
      const width = window.innerWidth
      if (width < 768) return 'mobile'
      if (width < 1024) return 'tablet'  
      if (width < 1440) return 'desktop'
      if (width < 1920) return 'large'
      return 'xl'
    }

    const size = getResponsiveSize()
    return `/images/optimized/split-bg-${size}.webp`
  }

  useEffect(() => {
    const optimizedSrc = getOptimizedSrc(src)
    
    // Preload the optimized image
    const img = new Image()
    
    img.onload = () => {
      setBackgroundImage(`url(${optimizedSrc})`)
      setIsLoaded(true)
    }
    
    img.onerror = () => {
      // Fallback to original image if optimized version fails
      console.warn('Optimized background image failed to load, falling back to original')
      const fallbackImg = new Image()
      
      fallbackImg.onload = () => {
        setBackgroundImage(`url(${src})`)
        setIsLoaded(true)
      }
      
      fallbackImg.onerror = () => {
        console.error('Both optimized and original background images failed to load')
        setIsLoaded(true) // Still set to loaded to show content
      }
      
      fallbackImg.src = src
    }
    
    img.src = optimizedSrc

    // Handle resize to potentially load a different size
    const handleResize = () => {
      const newOptimizedSrc = getOptimizedSrc(src)
      if (newOptimizedSrc !== optimizedSrc) {
        const resizeImg = new Image()
        resizeImg.onload = () => {
          setBackgroundImage(`url(${newOptimizedSrc})`)
        }
        resizeImg.src = newOptimizedSrc
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [src])

  return (
    <div
      className={`relative transition-opacity duration-700 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      style={{
        backgroundColor: fallbackColor,
        backgroundImage: backgroundImage,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Loading state - subtle fade in */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="w-full h-full animate-pulse"
            style={{ backgroundColor: fallbackColor }}
          />
        </div>
      )}
      
      {children}
    </div>
  )
} 