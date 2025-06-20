'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import CTASection from '@/components/sections/cta-section'
import { OptimizedBackground } from '@/components/ui/optimized-background'

export default function CustomersPage() {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="-mt-20">
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
        
        .metric-card {
          opacity: 0;
          transform: translateY(15px) scale(0.98);
          transition: all 0.6s ease-out;
        }
        
        .metric-card.visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      `}</style>

      {/* Hero Section */}
      <OptimizedBackground
        src="/images/split-bg.png"
        className="min-h-[50vh] md:min-h-[60vh] w-full relative flex items-center justify-center pt-32 md:pt-40"
      >
        {/* Overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c0c0c]/50 via-[#0c0c0c]/80 to-[#0c0c0c]" />
        
        <div className="relative z-10 w-[92%] md:w-[80%] max-w-7xl mx-auto px-2 md:px-4">
          <div className="text-center">
            <div className={`fade-in ${isLoaded ? 'visible' : ''}`}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-6">
                Our<span className="font-serif font-light italic tracking-tight"> Customers</span>
              </h1>
            </div>
            <div className={`fade-in stagger-1 ${isLoaded ? 'visible' : ''}`}>
              <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto mb-8 md:mb-12">
                See how leading companies are using Split to dominate AI engine visibility and get cited by ChatGPT, Perplexity, and Google AI.
              </p>
            </div>
          </div>
        </div>
      </OptimizedBackground>

      {/* Customer Showcase Section - Moved closer to header */}
      <section className="w-full py-8 md:py-12 bg-[#0c0c0c] relative">
        <div className="w-[92%] md:w-[80%] max-w-7xl mx-auto">

          {/* Featured Case Study - Origami */}
          <div className={`scale-in stagger-2 ${isLoaded ? 'visible' : ''}`}>
            <div className="relative bg-[#0c0c0c] border border-[#1a1a1a] p-6 sm:p-8 md:p-12 overflow-hidden group hover:border-[#333333] transition-all duration-300 shadow-xl">
              
              {/* Case Study Label */}
              <div className={`slide-up stagger-3 ${isLoaded ? 'visible' : ''}`}>
                <div className="inline-flex items-center gap-2 bg-[#0c0c0c] border border-[#2a2a2a] px-3 py-1.5 mb-6 md:mb-8">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  <span className="text-xs text-gray-400 uppercase tracking-[0.15em] font-medium">
                    Case Study
                  </span>
                </div>
              </div>

              {/* Main Headline */}
              <div className={`slide-up stagger-4 ${isLoaded ? 'visible' : ''}`}>
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-white mb-6 md:mb-8 leading-tight max-w-4xl">
                  We took{' '}
                  <span className="inline-flex items-center">
                    <Image
                      src="/images/origami-pink.svg"
                      alt="Origami"
                      width={120}
                      height={28}
                      className="h-5 sm:h-7 md:h-8 lg:h-9 w-auto mx-1 sm:mx-2 translate-y-1.5"
                    />
                  </span>{' '}
                  from 0 mentions to ranked #1 in less than 60 days.
                </h2>
              </div>

              {/* Description */}
              <div className={`fade-in stagger-4 ${isLoaded ? 'visible' : ''}`}>
                <p className="text-base sm:text-lg md:text-xl text-gray-300 leading-relaxed font-light mb-6 md:mb-8 max-w-3xl">
                  Origami launched an autonomous agent that identified structural issues, filled key content gaps, and quickly earned visibility across{' '}
                  <span className="text-white">ChatGPT, Perplexity, and Google AI</span>, ranking for the exact queries their customers were asking.
                </p>
              </div>

              {/* CTA Button */}
              <div className={`scale-in stagger-4 ${isLoaded ? 'visible' : ''}`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Link href="/case-studies/origami" className="group inline-flex items-center gap-3 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#333333] hover:border-[#444444] px-4 sm:px-6 py-2.5 sm:py-3 transition-all duration-200 text-white text-sm sm:text-base">
                    <span>Read the full case study</span>
                    <svg 
                      className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Decorative Lines - Fixed positioning */}
              <div className="absolute top-0 right-0 w-[45%] md:w-[40%] h-full overflow-hidden opacity-50 group-hover:opacity-70 transition-opacity duration-300">
                <div className="absolute -top-6 -right-8 md:-right-18 w-[100%] h-[110%]">
                  <Image
                    src="/images/origami-lines.svg"
                    alt=""
                    width={1989}
                    height={1550}
                    className="w-full h-full object-cover opacity-40"
                  />
                </div>
              </div>

              {/* Subtle gradient overlay for depth */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[#0a0a0a]/30 pointer-events-none"></div>
            </div>
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