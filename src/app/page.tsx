'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { LPTopBar } from '../components/layout/lp-topbar'
import Image from 'next/image'

const LOGOS = [
  { name: 'ChatGPT', logo: '/chatgpt.svg' },
  { name: 'Perplexity', logo: '/perplexity.svg' },
  { name: 'Gemini', logo: '/gemini.svg' },
  { name: 'Claude', logo: '/claude.svg' }
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
      <LPTopBar />
      
      {/* Hero Section with Gradient Transition */}
      <section 
        className="min-h-[70vh] md:min-h-[90vh] w-full relative flex items-start md:items-center justify-center pt-32 md:pt-48"
        style={{
          backgroundImage: 'url(/split-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/50 to-[#0c0c0c]" />
        
        <div className="relative z-10 w-[92%] md:w-[80%] max-w-7xl mx-auto px-2 md:px-4">
          <div className="text-center">
            <h1 className="blur-in-up text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 md:mb-6 md:max-w-[90%] mx-auto">
              The first autonomous AEO engineer.
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
            <div className="blur-in-up-delay-2 text-xs md:text-sm text-gray-400 mt-3 md:mt-4 mb-6 md:mb-24 flex items-center justify-center gap-2">
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
                  src="/mobile-dash.svg"
                  alt="Split Dashboard"
                  width={1200}
                  height={900}
                  className="w-full h-auto"
                />
              </div>
              {/* Desktop version - with frame */}
              <div className="hidden md:block w-full rounded-2xl border-[8px] border-[#2f2f2f]/30 overflow-hidden shadow-2xl">
                <Image
                  src="/split-dash.svg"
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
    </div>
  )
} 