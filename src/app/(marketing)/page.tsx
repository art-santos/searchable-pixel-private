'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { LPTopBar } from '../../components/layout/lp-topbar'
import Image from 'next/image'
import { Schema } from '@/components/Schema'

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Split?",
      acceptedAnswer: { "@type": "Answer", text: "Split is an autonomous AEO engine that optimises content for AI visibility." }
    },
    {
      "@type": "Question",
      name: "How does Split help with LLM visibility?",
      acceptedAnswer: { "@type": "Answer", text: "Split audits your site and publishes optimised content that AI crawlers can index and cite." }
    }
  ]
};
const LOGOS = [
  { name: 'ChatGPT', logo: '/images/chatgpt.svg' },
  { name: 'Perplexity', logo: '/images/perplexity.svg' },
  { name: 'Gemini', logo: '/images/gemini.svg' },
  { name: 'Claude', logo: '/images/claude.svg' }
]

export default function LandingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showCheckmark, setShowCheckmark] = useState(false)
  const [currentLogo, setCurrentLogo] = useState(0)
  const [prevLogo, setPrevLogo] = useState<number | null>(null)
  const [email, setEmail] = useState('')

  // If user is logged in, redirect to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  useEffect(() => {
    const interval = setInterval(() => {
      setPrevLogo(currentLogo);
      setCurrentLogo((prev) => (prev + 1) % LOGOS.length)
    }, 1200)
    return () => clearInterval(interval)
  }, [currentLogo])

  const handleSubmit = () => {
    if (!email) return;
    
    // Start the animation sequence
    setIsSubmitted(true);
    setIsLoading(true);
    
    // Cache the email in localStorage
    localStorage.setItem('cachedEmail', email);
    
    // After spinner animation, show checkmark
    setTimeout(() => {
      setIsLoading(false);
      setShowCheckmark(true);
      
      // Redirect after checkmark shows
      setTimeout(() => {
        router.push('/login?mode=signup');
      }, 600);
    }, 1000); // Show spinner for 1 second
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0c0c]">
      <style jsx global>{`
        @keyframes dashboardFallIn {
          0% {
            opacity: 0;
            transform: perspective(1000px) rotateX(-15deg) translateY(-20px);
          }
          100% {
            opacity: 1;
            transform: perspective(1000px) rotateX(0deg) translateY(0);
          }
        }
        
        .dashboard-fall-in {
          animation: dashboardFallIn 700ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
          animation-delay: 0.8s;
          opacity: 0;
        }
        
        @keyframes logoScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .logo-carousel {
          animation: logoScroll 40s linear infinite;
          width: fit-content;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .dashboard-fall-in {
            animation: none;
            opacity: 1;
            transform: none;
          }
          .logo-carousel {
            animation: none;
          }
        }
      `}</style>
      <LPTopBar />
      
      {/* Hero Section with Gradient Transition */}
      <section 
        className="min-h-[70vh] md:min-h-[90vh] w-full relative flex items-start md:items-center justify-center pt-32 md:pt-48"
        style={{
          backgroundImage: 'url(/images/split-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0c0c0c]/50 via-[#0c0c0c]/80 to-[#0c0c0c]" />
        
        <div className="relative z-10 w-[92%] md:w-[80%] max-w-7xl mx-auto px-2 md:px-4">
          <div className="text-center">
            <h1 className="blur-in-up text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 md:mb-6 md:max-w-[90%] mx-auto">
              The first<span className="font-serif font-light italic tracking-tight"> autonomous </span>AEO engineer. 
            </h1>
            <p className="blur-in-up-delay-1 text-sm md:text-lg lg:text-xl text-gray-200 md:max-w-[85%] mx-auto mb-6 md:mb-8 px-2 md:px-0">
              An AI Agent that monitors your visibility, audits your site, and publishes optimized content that gets you cited by ChatGPT, Perplexity, and Google.
            </p>
            <div className="blur-in-up-delay-2 flex flex-col md:flex-row gap-4 justify-center items-center">
              <div className="relative w-[80%] md:w-[300px] group">
                <input
                  type="email"
                  placeholder="Enter your work email"
                  className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-[#0c0c0c]/80 border border-[#2f2f2f] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#3f3f3f] pr-12 transition-colors text-sm md:text-base"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
                <button 
                  onClick={handleSubmit}
                  className="absolute right-[5px] top-1/2 -translate-y-1/2 bg-[#222222] border border-[#333333] text-white w-[34px] h-[34px] md:w-[40px] md:h-[40px] flex items-center justify-center rounded-md hover:bg-[#282828]"
                  aria-label="Submit email"
                >
                  <span 
                    className={`arrow-icon ${isSubmitted ? 'arrow-exit' : ''}`} 
                    style={{
                      display: isSubmitted ? 'none' : 'flex', 
                      animationFillMode: 'forwards'
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </span>
                  
                  <span 
                    className={`spinner-icon ${isLoading ? 'spinner-enter' : ''} ${!isLoading && isSubmitted ? 'spinner-exit' : ''}`}
                    style={{ display: isSubmitted && !showCheckmark ? 'flex' : 'none' }}
                  >
                    <div className="spinner-dots">
                      <div className="spinner-dot"></div>
                      <div className="spinner-dot"></div>
                      <div className="spinner-dot"></div>
                    </div>
                  </span>
                  
                  <span 
                    className={`check-icon ${showCheckmark ? 'check-enter' : ''}`}
                    style={{ display: showCheckmark ? 'flex' : 'none' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </span>
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

            {/* Dashboard Preview */}
            <div className="relative mt-2 md:mt-8 pb-5">
              {/* Mobile version - no frame */}
              <div className="relative -mx-[calc(92vw/12)] md:hidden">
                <Image
                  src="/images/mobile-dash.svg"
                  alt="Split Dashboard"
                  width={1200}
                  height={900}
                  className="w-full h-auto dashboard-fall-in"
                />
              </div>
              {/* Desktop version - with frame */}
              <div className="hidden md:block w-full rounded-2xl border-[8px] border-[#2f2f2f]/30 overflow-hidden shadow-2xl dashboard-fall-in">
                <Image
                  src="/images/split-dash.svg"
                  alt="Split Dashboard"
                  width={1200}
                  height={800}
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logo Carousel */}
      <section className="w-full pt-16 pb-12 bg-[#0c0c0c] relative group cursor-pointer">
        {/* Hover overlay with blur and button - covers entire section */}
        <div className="absolute inset-0 bg-[#0c0c0c]/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center z-20">
          <button className="bg-[#1a1a1a] border-2 border-[#444444] text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-[#222222] hover:border-[#555555] transition-all duration-200 text-sm font-medium">
            View our customers
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
        
        <div className="w-[92%] md:w-[80%] max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <h2 className="text-center text-xs md:text-sm text-gray-600/80 mb-8 md:mb-12 font-medium tracking-tight uppercase">
            Teams using Split to increase their LLM visibility
          </h2>
          
          {/* Carousel container */}
          <div className="relative overflow-hidden">
            {/* Gradient overlays for blur effect */}
            <div className="absolute left-0 top-0 w-24 md:w-32 h-full bg-gradient-to-r from-[#0c0c0c] to-transparent z-10" />
            <div className="absolute right-0 top-0 w-24 md:w-32 h-full bg-gradient-to-l from-[#0c0c0c] to-transparent z-10" />
            
            {/* Scrolling container */}
            <div className="logo-carousel flex gap-12 md:gap-16">
              {[...Array(16)].map((_, index) => (
                <div key={index} className="flex-shrink-0">
                  <Image
                    src="/images/origami-white.svg"
                    alt="Partner Logo"
                    width={120}
                    height={30}
                    className="h-6 md:h-8 w-auto opacity-70 transition-opacity duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    <Schema json={faqSchema} />
    </div>
  )
} 