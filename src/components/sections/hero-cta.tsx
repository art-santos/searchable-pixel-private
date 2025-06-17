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
    <div className="text-center">
      <h1 className="blur-in-up text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 md:mb-6 md:max-w-[70%] mx-auto">
        Attribution Infrastructure for <span className="font-serif font-light italic tracking-tight"> LLM-Powered Search </span>
      </h1>
      <p className="blur-in-up-delay-1 text-sm md:text-lg lg:text-xl text-gray-200 md:max-w-[85%] mx-auto mb-6 md:mb-8 px-2 md:px-0">
        Built for AEO and GEO teams that want more than just visibility. See who's citing you, who's visiting, and where your content actually lands across ChatGPT, Perplexity, Google, and more.
      </p>
      
      <div className="blur-in-up-delay-2 flex flex-col md:flex-row gap-4 justify-center items-center">
        <form onSubmit={handleSubmit} className="relative w-[80%] md:w-[400px] group">
          <input
            type="email"
            placeholder="Enter your email to get started"
            className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-[#0c0c0c]/80 border border-[#2f2f2f] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#3f3f3f] pr-12 transition-all duration-200 text-sm md:text-base disabled:opacity-50"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
            required
          />
          <button 
            type="submit"
            disabled={!email || isSubmitting}
            className="absolute right-[5px] top-1/2 -translate-y-1/2 bg-[#222222] border border-[#333333] text-white w-[34px] h-[34px] md:w-[40px] md:h-[40px] flex items-center justify-center rounded-md hover:bg-[#282828] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
        <div className="blur-in-up-delay-2 text-sm text-green-400 mt-3 md:mt-4">
          ✓ You've been added to our newsletter! Check your email for updates.
        </div>
      )}
      {status === 'error' && (
        <div className="blur-in-up-delay-2 text-sm text-red-400 mt-3 md:mt-4">
          Failed to subscribe. Please check your email and try again.
        </div>
      )}
      
      <div className="blur-in-up-delay-2 text-xs md:text-sm text-gray-400 mt-3 md:mt-4 mb-6 md:mb-24 flex items-center justify-center gap-1">
        See who's finding you on 
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