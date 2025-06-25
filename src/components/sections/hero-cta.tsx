'use client'

import { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'

const LOGOS = [
  { name: 'ChatGPT', logo: '/images/chatgpt.svg' },
  { name: 'Perplexity', logo: '/images/perplexity.svg' },
  { name: 'Gemini', logo: '/images/gemini.svg' },
  { name: 'Claude', logo: '/images/claude.svg' }
]

export default function HeroCTA() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [currentLogo, setCurrentLogo] = useState(0)
  const [prevLogo, setPrevLogo] = useState<number | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setPrevLogo(currentLogo);
      setCurrentLogo((prev) => (prev + 1) % LOGOS.length)
    }, 1200)
    return () => clearInterval(interval)
  }, [currentLogo])

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    if (!email || isSubmitting) return

    if (!validateEmail(email)) {
      setStatus('error')
      return
    }

    setIsSubmitting(true)
    setStatus('idle')

    try {
      const formData = new FormData()
      formData.append('email', email)
      
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        body: formData,
      })
      
      const result = await response.json()
      
      if (result.success) {
        setStatus('success')
        setEmail('')
      } else {
        setStatus('error')
      }
    } catch (error) {
      console.error('Subscription error:', error)
      setStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <div className="text-left">
      <h1 className="blur-in-up text-5xl md:text-6xl lg:text-7xl font-medium text-[#191919] mb-3 md:mb-6 tracking-[-0.03em]" style={{ fontFamily: 'Instrument Serif, serif' }}>
      Turn AI conversations about your brand <span className="font-light italic tracking-tight"> into real leads</span>
      </h1>
                             <p className="blur-in-up-delay-1 tracking-tight text-sm md:text-lg lg:text-xl text-[#191919] mb-6 md:mb-8 px-0 text-left">
       Track every ChatGPT, Perplexity, or AI crawler visit, map it to real buyers, and prove which AI answers drive pipeline.
        </p>
      
      <div className="blur-in-up-delay-2 flex flex-col md:flex-row gap-4 justify-start items-start">
        <form onSubmit={handleSubmit} className="relative w-[80%] md:w-[400px] group">
          <input
            type="email"
            placeholder="Enter your company email"
            className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-white border border-[#e5e5e5] rounded-lg text-[#191919] placeholder-gray-500 focus:outline-none focus:border-[#191919] pr-12 transition-all duration-200 text-sm md:text-base disabled:opacity-50"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
            required
          />
          <button 
            type="submit"
            disabled={!email || isSubmitting}
            className="absolute right-[5px] top-1/2 -translate-y-1/2 bg-[#191919] border border-[#191919] text-white w-[34px] h-[34px] md:w-[40px] md:h-[40px] flex items-center justify-center rounded-md hover:bg-[#333333] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            aria-label="Get started"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
      
      {/* Status Messages */}
      {status === 'success' && (
        <div className="blur-in-up-delay-2 text-sm text-green-600 mt-3 md:mt-4">
          ✓ You've been added to our newsletter! Check your email for updates.
        </div>
      )}
      {status === 'error' && (
        <div className="blur-in-up-delay-2 text-sm text-red-600 mt-3 md:mt-4">
          Failed to subscribe. Please check your email and try again.
        </div>
      )}
      
              {/* AI Platforms Section */}
        <div className="blur-in-up-delay-2 mt-12 md:mt-8 mb-6 md:mb-24">
          <div className="text-ms font-mono md:text-base text-gray-600 mb-4">
            DISCOVER WHO FOUND YOU THROUGH
          </div>
          <div className="flex items-center justify-start gap-4 md:gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <img src="/images/chatgpt.svg" alt="ChatGPT" className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-gray-600 text-sm md:text-base">ChatGPT</span>
            </div>
            <div className="flex items-center gap-2">
              <img src="/images/perplexity.svg" alt="Perplexity" className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-gray-600 text-sm md:text-base">Perplexity</span>
            </div>
            <div className="flex items-center gap-2">
              <img src="/images/claude.svg" alt="Claude" className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-gray-600 text-sm md:text-base">Claude</span>
            </div>
            <div className="flex items-center gap-2">
              <img src="/images/gemini.svg" alt="Gemini" className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-gray-600 text-sm md:text-base">Gemini</span>
            </div>
            <span className="text-gray-600 text-sm md:text-base font-medium">& more</span>
          </div>
        </div>
    </div>
  )
} 