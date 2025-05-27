'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'

const LOGOS = [
  { name: 'ChatGPT', logo: '/images/chatgpt.svg' },
  { name: 'Perplexity', logo: '/images/perplexity.svg' },
  { name: 'Gemini', logo: '/images/gemini.svg' },
  { name: 'Claude', logo: '/images/claude.svg' }
]

export default function HeroCTA() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentLogo, setCurrentLogo] = useState(0)
  const [prevLogo, setPrevLogo] = useState<number | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setPrevLogo(currentLogo);
      setCurrentLogo((prev) => (prev + 1) % LOGOS.length)
    }, 1200)
    return () => clearInterval(interval)
  }, [currentLogo])

  const validateUrl = (url: string): boolean => {
    // Basic URL validation regex
    const urlRegex = /^(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    return urlRegex.test(url)
  }

  const handleSubmit = async () => {
    if (!url || isLoading) return

    // Clean and validate URL
    const cleanUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase()
    
    if (!validateUrl(cleanUrl)) {
      // Could add error state here
      return
    }

    setIsLoading(true)
    setIsSubmitted(true)

    // Store URL in sessionStorage
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('siteUrl', cleanUrl)
    }

    // Simulate loading animation
    setTimeout(() => {
      router.push('/start')
    }, 800)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <div className="text-center">
      <h1 className="blur-in-up text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 md:mb-6 md:max-w-[90%] mx-auto">
        Get your free<span className="font-serif font-light italic tracking-tight"> AI visibility </span>score
      </h1>
      <p className="blur-in-up-delay-1 text-sm md:text-lg lg:text-xl text-gray-200 md:max-w-[85%] mx-auto mb-6 md:mb-8 px-2 md:px-0">
        See how often your site gets cited by ChatGPT, Perplexity, and Google AI. Enter your URL to get started.
      </p>
      
      <div className="blur-in-up-delay-2 flex flex-col md:flex-row gap-4 justify-center items-center">
        <div className="relative w-[80%] md:w-[400px] group">
          <input
            type="url"
            placeholder="Enter your website URL"
            className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-[#0c0c0c]/80 border border-[#2f2f2f] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#3f3f3f] pr-12 transition-all duration-200 text-sm md:text-base"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button 
            onClick={handleSubmit}
            disabled={!url || isLoading}
            className="absolute right-[5px] top-1/2 -translate-y-1/2 bg-[#222222] border border-[#333333] text-white w-[34px] h-[34px] md:w-[40px] md:h-[40px] flex items-center justify-center rounded-md hover:bg-[#282828] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            aria-label="Get visibility score"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
      
      <div className="blur-in-up-delay-2 text-xs md:text-sm text-gray-400 mt-3 md:mt-4 mb-6 md:mb-24 flex items-center justify-center gap-1">
        Get mentioned by 
        <span className="text-white logo-flip-container">
          <span key={currentLogo} className="logo-flip">
            <img 
              src={LOGOS[currentLogo].logo} 
              alt={LOGOS[currentLogo].name}
            />
            <span>
              {LOGOS[currentLogo].name}
            </span>
          </span>
        </span>
      </div>
    </div>
  )
} 