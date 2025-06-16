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
    <section className="relative py-16 md:py-20 bg-[#0c0c0c] overflow-hidden">
      <div className="relative z-10 mx-auto w-[92%] max-w-4xl md:w-[80%] text-center">
        {/* Enhanced Badge */}
        <div className="mb-8 md:mb-10 inline-flex items-center group">
          <div className="relative overflow-hidden rounded-full bg-gradient-to-r from-gray-900/80 via-black/60 to-gray-900/80 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-200 border border-gray-700/60 backdrop-blur-sm shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all duration-300">
            {/* Left to Right Shimmer Loop */}
            <div className="absolute inset-y-0 -left-full w-full bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shimmer-loop" />
            
            {/* Content */}
            <div className="relative flex items-center">
              <div className="mr-2 sm:mr-3 flex items-center group-hover:[transform:rotateY(180deg)] transition-transform duration-500">
                <Image 
                  src="/images/split-icon-white.svg" 
                  width={14} 
                  height={14} 
                  alt="Split Logo" 
                  className="w-3.5 sm:w-4 h-3.5 sm:h-4 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
                />
              </div>
              <span className="bg-gradient-to-r from-gray-100 to-white bg-clip-text text-transparent font-semibold flex items-center gap-1.5 sm:gap-2">
                <span className="hidden sm:inline">Join 100+ others in getting ranked on</span>
                <span className="sm:hidden">Join 100+ others on</span>
                <span className="logo-flip-container text-white">
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
        
        <h2 className="mb-4 sm:mb-6 text-2xl sm:text-3xl font-normal text-white md:text-4xl lg:text-5xl font-serif leading-tight tracking-tighter">
          Stop getting overlooked by AI engines
        </h2>
        <p className="mx-auto mb-6 sm:mb-8 max-w-2xl text-base sm:text-lg text-gray-300 md:text-xl leading-relaxed">
          While your competitors struggle with traditional SEO, you'll be capturing citations from ChatGPT, Claude, and Perplexity. Join the AEO revolution today.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <a
            href="/waitlist"
            className="w-full sm:w-auto inline-flex items-center justify-center bg-[#0c0c0c] px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white transition-all hover:bg-[#161616] hover:scale-105 rounded-lg shadow-lg border border-[#2f2f2f] hover:border-[#3f3f3f] group"
          >
            Get your site ranked
          </a>
          <span className="text-xs sm:text-sm text-gray-400">
            Free trial
          </span>
        </div>
      </div>
    </section>
  )
}