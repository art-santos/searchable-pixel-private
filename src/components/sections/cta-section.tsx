'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

const LOGOS = [
  { name: 'ChatGPT', logo: '/images/chatgpt.svg' },
  { name: 'Perplexity', logo: '/images/perplexity.svg' },
  { name: 'Gemini', logo: '/images/gemini.svg' },
  { name: 'Claude', logo: '/images/claude.svg' }
]

export default function CTASection() {
  const [currentLogo, setCurrentLogo] = useState(0)
  const [prevLogo, setPrevLogo] = useState<number | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setPrevLogo(currentLogo);
      setCurrentLogo((prev) => (prev + 1) % LOGOS.length)
    }, 1200)
    return () => clearInterval(interval)
  }, [currentLogo])

  return (
    <section className="relative py-16 md:py-20 bg-white overflow-hidden">
      <div className="relative z-10 mx-auto w-[92%] max-w-4xl md:w-[80%] text-center">
        {/* Enhanced Badge */}
        <div className="mb-8 md:mb-10 inline-flex items-center group">
          <div className="relative overflow-hidden rounded-full bg-gradient-to-r from-gray-100/80 via-white/60 to-gray-100/80 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-700 border border-gray-300/60 backdrop-blur-sm shadow-[0_0_20px_rgba(0,0,0,0.1)] hover:shadow-[0_0_30px_rgba(0,0,0,0.15)] transition-all duration-300">
            {/* Left to Right Shimmer Loop */}
            <div className="absolute inset-y-0 -left-full w-full bg-gradient-to-r from-transparent via-gray-800/25 to-transparent animate-shimmer-loop" />
            
            {/* Content */}
            <div className="relative flex items-center">
              <div className="mr-2 sm:mr-3 flex items-center group-hover:[transform:rotateY(180deg)] transition-transform duration-500">
                <Image 
                  src="/images/split-icon-black.svg" 
                  width={14} 
                  height={14} 
                  alt="Split Logo" 
                  className="w-3.5 sm:w-4 h-3.5 sm:h-4 drop-shadow-[0_0_8px_rgba(0,0,0,0.3)]"
                />
              </div>
              <span className="bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent font-semibold flex items-center gap-1.5 sm:gap-2">
                <span className="hidden sm:inline">See which companies visit from</span>
                <span className="sm:hidden">Track visitors from</span>
                <span className="logo-flip-container text-[#191919]">
                  <span key={currentLogo} className="logo-flip">
                    <img 
                      src={LOGOS[currentLogo].logo} 
                      alt={LOGOS[currentLogo].name}
                      className="w-3 sm:w-3.5 h-3 sm:h-3.5"
                    />
                    <span>
                      {LOGOS[currentLogo].name}
                    </span>
                  </span>
                </span>
              </span>
            </div>
          </div>
        </div>
        
        <h2 className="mb-4 sm:mb-6 text-2xl sm:text-3xl font-normal text-[#191919] md:text-4xl lg:text-5xl font-serif leading-tight tracking-tighter">
          Discover who's visiting from AI search
        </h2>
        <p className="mx-auto mb-6 sm:mb-8 max-w-2xl text-base sm:text-lg text-gray-700 md:text-xl leading-relaxed">
          Track AI crawler activity, identify companies visiting from ChatGPT and Perplexity citations, and turn attribution insights into qualified pipeline.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <a
            href="/waitlist"
            className="w-full sm:w-auto inline-flex items-center justify-center bg-[#191919] px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white transition-all hover:bg-[#333333] hover:scale-105 rounded-lg shadow-lg border border-[#191919] hover:border-[#333333] group"
          >
            Start tracking
          </a>
        </div>
      </div>
    </section>
  )
}