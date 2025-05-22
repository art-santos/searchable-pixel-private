'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import { Schema } from '@/components/Schema'
import CTASection from '@/components/sections/cta-section'

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
    <div className="-mt-20">
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
        
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes staggerIn {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulseGlow {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.1);
          }
          50% {
            box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.05);
          }
        }
        
        .feature-content {
          animation: fadeInUp 600ms ease-out forwards;
          opacity: 0;
        }
        
        .feature-content.visible {
          opacity: 1;
        }
        
        .stagger-1 { animation-delay: 100ms; }
        .stagger-2 { animation-delay: 200ms; }
        .stagger-3 { animation-delay: 300ms; }
        
        .dashboard-mockup {
          transition: transform 200ms ease-out, box-shadow 200ms ease-out;
        }
        
        .dashboard-mockup:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        
        .metric-bar {
          background: linear-gradient(90deg, #333333 0%, #1a1a1a 100%);
          transition: background 200ms ease-out;
        }
        
        .metric-item:hover .metric-bar {
          background: linear-gradient(90deg, #444444 0%, #2a2a2a 100%);
        }
        
        .deploy-button {
          transition: all 150ms ease-out;
          position: relative;
          overflow: hidden;
        }
        
        .deploy-button:hover {
          transform: translateY(-1px);
          background: #333333;
          border-color: #555555;
        }
        
        .deploy-button:active {
          transform: translateY(0);
        }
        
        .step-number {
          transition: all 200ms ease-out;
          position: relative;
        }
        
        .step-number:hover {
          transform: scale(1.05);
          background: #2a2a2a;
          border-color: #444444;
        }
        
        .step-number::before {
          content: '';
          position: absolute;
          inset: -1px;
          background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
          opacity: 0;
          transition: opacity 200ms ease-out;
        }
        
        .step-number:hover::before {
          opacity: 1;
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
          .feature-content,
          .dashboard-mockup,
          .step-number,
          .deploy-button,
          .metric-item {
            animation: none;
            transition: none;
          }
          .dashboard-mockup:hover,
          .step-number:hover,
          .deploy-button:hover {
            transform: none;
          }
        }
      `}</style>
      
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

      {/* How It Works Header */}
      <section className="w-full py-20 md:py-32 bg-[#0c0c0c] relative overflow-hidden">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}></div>
        
        <div className="w-[92%] md:w-[80%] max-w-7xl mx-auto text-center relative">
          {/* Step Indicators */}
          <div className="flex justify-center items-center gap-4 mb-8 md:mb-12">
            <div className="w-8 h-8 bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-white text-sm font-mono">1</div>
            <div className="w-12 h-px bg-[#333333]"></div>
            <div className="w-8 h-8 bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-white text-sm font-mono">2</div>
            <div className="w-12 h-px bg-[#333333]"></div>
            <div className="w-8 h-8 bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-white text-sm font-mono">3</div>
          </div>

          {/* Header Content */}
          <div className="feature-content">
            <div className="mb-6 md:mb-8">
              <div className="text-xs text-gray-500 uppercase tracking-[0.2em] mb-4">Process Overview</div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 md:mb-8 leading-tight">
                How It<span className="font-serif font-light italic"> Works</span>
              </h2>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <p className="text-xl md:text-2xl text-gray-300 leading-relaxed font-light mb-6">
                Three steps to dominate AI engine visibility and get your content cited by ChatGPT, Perplexity, and Google AI.
              </p>
              <div className="text-sm text-gray-500 font-mono">
                AUDIT → MONITOR → IMPLEMENT
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-12 left-8 md:left-16 w-1 h-16 bg-[#333333] opacity-50"></div>
          <div className="absolute top-12 right-8 md:right-16 w-1 h-16 bg-[#333333] opacity-50"></div>
          <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-[#333333] opacity-50"></div>
        </div>
      </section>

      {/* Step 1: Audit Your Visibility */}
      <section className="w-full py-20 md:py-28 bg-[#0c0c0c] relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}></div>
        
        <div className="w-[92%] md:w-[80%] max-w-7xl mx-auto relative">
          <div className="grid md:grid-cols-2 gap-16 md:gap-20 items-center">
            {/* Content */}
            <div className="feature-content">
              <div className="flex items-center gap-6 mb-8">
                <div className="step-number w-14 h-14 bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-white font-bold text-xl">
                  1
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Step One</div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                    Audit Your Visibility
                  </h3>
                </div>
              </div>
              
              <p className="text-gray-300 mb-10 text-lg leading-relaxed font-light">
                We scan your site like an AI crawler would—flagging broken schema, missing citations, and content that LLMs ignore.
              </p>

              {/* Features List */}
              <div className="space-y-5">
                <div className="feature-content stagger-1 flex items-start gap-4 group">
                  <div className="w-1.5 h-1.5 bg-white mt-2.5 flex-shrink-0 transition-all duration-200 group-hover:bg-gray-300"></div>
                  <div>
                    <span className="text-gray-100 font-medium">LLMBot coverage report</span>
                    <div className="text-sm text-gray-500 mt-1">Comprehensive analysis of AI crawler accessibility</div>
                  </div>
                </div>
                <div className="feature-content stagger-2 flex items-start gap-4 group">
                  <div className="w-1.5 h-1.5 bg-white mt-2.5 flex-shrink-0 transition-all duration-200 group-hover:bg-gray-300"></div>
                  <div>
                    <span className="text-gray-100 font-medium">Schema & llms.txt check</span>
                    <div className="text-sm text-gray-500 mt-1">Structured data validation and optimization</div>
                  </div>
                </div>
                <div className="feature-content stagger-3 flex items-start gap-4 group">
                  <div className="w-1.5 h-1.5 bg-white mt-2.5 flex-shrink-0 transition-all duration-200 group-hover:bg-gray-300"></div>
                  <div>
                    <span className="text-gray-100 font-medium">Direct & indirect citation gaps</span>
                    <div className="text-sm text-gray-500 mt-1">Identify missed opportunities for AI citations</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Dashboard Mockup */}
            <div className="dashboard-mockup bg-[#1a1a1a] border border-[#2f2f2f] p-6 relative overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#333333]">
                <div>
                  <h4 className="text-white font-semibold text-base">Site Audit Results</h4>
                  <div className="text-xs text-gray-500 mt-1">Updated 2 minutes ago</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-400 font-mono">Live</span>
                </div>
              </div>
              
              {/* Metrics */}
              <div className="space-y-4">
                <div className="metric-item group p-4 bg-[#0c0c0c] border border-[#333333] transition-all duration-200 hover:border-[#444444]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300 text-sm font-medium">Schema Coverage</span>
                    <span className="text-white font-mono text-lg">23%</span>
                  </div>
                  <div className="w-full h-1 bg-[#333333] overflow-hidden">
                    <div className="metric-bar h-full w-[23%]"></div>
                  </div>
                </div>
                
                <div className="metric-item group p-4 bg-[#0c0c0c] border border-[#333333] transition-all duration-200 hover:border-[#444444]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300 text-sm font-medium">LLM Readability</span>
                    <span className="text-white font-mono text-lg">67%</span>
                  </div>
                  <div className="w-full h-1 bg-[#333333] overflow-hidden">
                    <div className="metric-bar h-full w-[67%]"></div>
                  </div>
                </div>
                
                <div className="metric-item group p-4 bg-[#0c0c0c] border border-[#333333] transition-all duration-200 hover:border-[#444444]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300 text-sm font-medium">Citation Potential</span>
                    <span className="text-white font-mono text-lg">41%</span>
                  </div>
                  <div className="w-full h-1 bg-[#333333] overflow-hidden">
                    <div className="metric-bar h-full w-[41%]"></div>
                  </div>
                </div>
              </div>
              
              {/* Critical Issues */}
              <div className="mt-6 pt-4 border-t border-[#333333]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 border border-[#666666] flex items-center justify-center">
                    <div className="w-1 h-1 bg-white"></div>
                  </div>
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Critical Issues</span>
                </div>
                <div className="text-sm text-gray-300 leading-relaxed">
                  Missing structured data, broken llms.txt configuration
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step 2: Monitor Your Mentions */}
      <section className="w-full py-20 md:py-28 bg-[#0c0c0c] relative border-t border-[#1a1a1a]">
        <div className="w-[92%] md:w-[80%] max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 md:gap-20 items-center">
            {/* Enhanced Dashboard Mockup */}
            <div className="dashboard-mockup bg-[#1a1a1a] border border-[#2f2f2f] p-6 md:order-1 relative overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#333333]">
                <div>
                  <h4 className="text-white font-semibold text-base">Mention Tracking</h4>
                  <div className="text-xs text-gray-500 mt-1">Last 24 hours</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-white animate-pulse"></div>
                  <span className="text-xs text-gray-400 font-mono">Scanning</span>
                </div>
              </div>
              
              {/* AI Platform Mentions */}
              <div className="space-y-4">
                <div className="metric-item group p-4 bg-[#0c0c0c] border border-[#333333] transition-all duration-200 hover:border-[#444444] relative">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-[#2a2a2a] border border-[#444444] flex items-center justify-center">
                        <div className="w-2 h-2 bg-white"></div>
                      </div>
                      <span className="text-gray-300 text-sm font-medium">ChatGPT</span>
                    </div>
                    <span className="text-white font-mono text-lg">7</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">Last mention: 2h ago</div>
                  <div className="w-full h-1 bg-[#333333] overflow-hidden">
                    <div className="metric-bar h-full w-[35%]"></div>
                  </div>
                </div>
                
                <div className="metric-item group p-4 bg-[#0c0c0c] border border-[#333333] transition-all duration-200 hover:border-[#444444]">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-[#2a2a2a] border border-[#444444] flex items-center justify-center">
                        <div className="w-2 h-2 bg-white"></div>
                      </div>
                      <span className="text-gray-300 text-sm font-medium">Perplexity</span>
                    </div>
                    <span className="text-white font-mono text-lg">3</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">Last mention: 5h ago</div>
                  <div className="w-full h-1 bg-[#333333] overflow-hidden">
                    <div className="metric-bar h-full w-[15%]"></div>
                  </div>
                </div>
                
                <div className="metric-item group p-4 bg-[#0c0c0c] border border-[#333333] transition-all duration-200 hover:border-[#444444]">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-[#2a2a2a] border border-[#444444] flex items-center justify-center">
                        <div className="w-2 h-2 bg-white"></div>
                      </div>
                      <span className="text-gray-300 text-sm font-medium">Google AI</span>
                    </div>
                    <span className="text-white font-mono text-lg">12</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">Last mention: 1h ago</div>
                  <div className="w-full h-1 bg-[#333333] overflow-hidden">
                    <div className="metric-bar h-full w-[60%]"></div>
                  </div>
                </div>
              </div>
              
              {/* Trending Queries */}
              <div className="mt-6 pt-4 border-t border-[#333333]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 border border-[#666666] flex items-center justify-center">
                    <div className="w-1 h-1 bg-white"></div>
                  </div>
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Trending Queries</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-gray-300 bg-[#333333] px-2 py-1 border border-[#444444]">"AI automation tools"</span>
                  <span className="text-xs text-gray-300 bg-[#333333] px-2 py-1 border border-[#444444]">"workflow optimization"</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="feature-content md:order-2">
              <div className="flex items-center gap-6 mb-8">
                <div className="step-number w-14 h-14 bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-white font-bold text-xl">
                  2
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Step Two</div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                    Monitor Your Mentions
                  </h3>
                </div>
              </div>
              
              <p className="text-gray-300 mb-10 text-lg leading-relaxed font-light">
                Track your brand's footprint across AI engines. Know exactly where you're showing up (or not) in ChatGPT, Perplexity, and Google AI.
              </p>

              {/* Features List */}
              <div className="space-y-5">
                <div className="feature-content stagger-1 flex items-start gap-4 group">
                  <div className="w-1.5 h-1.5 bg-white mt-2.5 flex-shrink-0 transition-all duration-200 group-hover:bg-gray-300"></div>
                  <div>
                    <span className="text-gray-100 font-medium">Real-time prompt-based visibility checks</span>
                    <div className="text-sm text-gray-500 mt-1">Monitor how AI engines respond to queries about your domain</div>
                  </div>
                </div>
                <div className="feature-content stagger-2 flex items-start gap-4 group">
                  <div className="w-1.5 h-1.5 bg-white mt-2.5 flex-shrink-0 transition-all duration-200 group-hover:bg-gray-300"></div>
                  <div>
                    <span className="text-gray-100 font-medium">Daily re-rank tracking</span>
                    <div className="text-sm text-gray-500 mt-1">See how your visibility changes over time with trend analysis</div>
                  </div>
                </div>
                <div className="feature-content stagger-3 flex items-start gap-4 group">
                  <div className="w-1.5 h-1.5 bg-white mt-2.5 flex-shrink-0 transition-all duration-200 group-hover:bg-gray-300"></div>
                  <div>
                    <span className="text-gray-100 font-medium">Competitive landscape mapping</span>
                    <div className="text-sm text-gray-500 mt-1">Compare your AI presence against industry competitors</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step 3: Implement What Matters */}
      <section className="w-full py-20 md:py-28 bg-[#0c0c0c] relative border-t border-[#1a1a1a]">
        <div className="w-[92%] md:w-[80%] max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 md:gap-20 items-center">
            {/* Content */}
            <div className="feature-content">
              <div className="flex items-center gap-6 mb-8">
                <div className="step-number w-14 h-14 bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-white font-bold text-xl">
                  3
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Step Three</div>
                  <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                    Implement What Matters
                  </h3>
                </div>
              </div>
              
              <p className="text-gray-300 mb-10 text-lg leading-relaxed font-light">
                Get actionable fixes—not fluff. We push schema, content tweaks, and link-building suggestions to help LLMs actually quote you.
              </p>

              {/* Features List */}
              <div className="space-y-5">
                <div className="feature-content stagger-1 flex items-start gap-4 group">
                  <div className="w-1.5 h-1.5 bg-white mt-2.5 flex-shrink-0 transition-all duration-200 group-hover:bg-gray-300"></div>
                  <div>
                    <span className="text-gray-100 font-medium">One-click schema fixes</span>
                    <div className="text-sm text-gray-500 mt-1">Automated deployment of structured data optimizations</div>
                  </div>
                </div>
                <div className="feature-content stagger-2 flex items-start gap-4 group">
                  <div className="w-1.5 h-1.5 bg-white mt-2.5 flex-shrink-0 transition-all duration-200 group-hover:bg-gray-300"></div>
                  <div>
                    <span className="text-gray-100 font-medium">Authority-building backlink ops</span>
                    <div className="text-sm text-gray-500 mt-1">Strategic link placement to boost AI engine trust signals</div>
                  </div>
                </div>
                <div className="feature-content stagger-3 flex items-start gap-4 group">
                  <div className="w-1.5 h-1.5 bg-white mt-2.5 flex-shrink-0 transition-all duration-200 group-hover:bg-gray-300"></div>
                  <div>
                    <span className="text-gray-100 font-medium">Content rewrites for LLM readability</span>
                    <div className="text-sm text-gray-500 mt-1">AI-optimized content that ranks higher in citations</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Dashboard Mockup */}
            <div className="dashboard-mockup bg-[#1a1a1a] border border-[#2f2f2f] p-6 relative overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#333333]">
                <div>
                  <h4 className="text-white font-semibold text-base">Implementation Queue</h4>
                  <div className="text-xs text-gray-500 mt-1">Ready to deploy</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#333333] border border-[#444444] flex items-center justify-center text-xs text-white font-mono">3</div>
                  <span className="text-xs text-gray-400">pending</span>
                </div>
              </div>
              
              {/* Implementation Items */}
              <div className="space-y-4">
                <div className="metric-item group p-4 bg-[#0c0c0c] border border-[#333333] transition-all duration-200 hover:border-[#444444]">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-gray-300 text-sm font-medium">Add FAQ Schema</span>
                      <div className="text-xs text-gray-500 mt-1">Structured data enhancement</div>
                    </div>
                    <button className="deploy-button text-xs text-white bg-[#2a2a2a] px-3 py-1.5 border border-[#444444]">
                      Deploy
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Impact:</span>
                    <span className="text-xs text-white font-mono">+23% citation chance</span>
                  </div>
                </div>
                
                <div className="metric-item group p-4 bg-[#0c0c0c] border border-[#333333] transition-all duration-200 hover:border-[#444444]">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-gray-300 text-sm font-medium">Update llms.txt</span>
                      <div className="text-xs text-gray-500 mt-1">AI crawler configuration</div>
                    </div>
                    <button className="deploy-button text-xs text-white bg-[#2a2a2a] px-3 py-1.5 border border-[#444444]">
                      Deploy
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Impact:</span>
                    <span className="text-xs text-white font-mono">+15% visibility</span>
                  </div>
                </div>
                
                <div className="metric-item group p-4 bg-[#0c0c0c] border border-[#333333] transition-all duration-200 hover:border-[#444444]">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-gray-300 text-sm font-medium">Content Rewrite</span>
                      <div className="text-xs text-gray-500 mt-1">LLM optimization pass</div>
                    </div>
                    <button className="deploy-button text-xs text-white bg-[#2a2a2a] px-3 py-1.5 border border-[#444444]">
                      Deploy
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Impact:</span>
                    <span className="text-xs text-white font-mono">+41% readability</span>
                  </div>
                </div>
              </div>
              
              {/* Overall Impact */}
              <div className="mt-6 pt-4 border-t border-[#333333]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 border border-[#666666] flex items-center justify-center">
                    <div className="w-1 h-1 bg-white"></div>
                  </div>
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Estimated Impact</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Overall visibility improvement</span>
                  <span className="text-lg text-white font-mono">+79%</span>
                </div>
                <div className="w-full h-1 bg-[#333333] mt-2 overflow-hidden">
                  <div className="metric-bar h-full w-[79%]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Origami Case Study */}
      <section className="w-full py-20 md:py-28 bg-[#0c0c0c] relative border-t border-[#1a1a1a] overflow-hidden">
        <div className="w-[92%] md:w-[80%] max-w-7xl mx-auto relative z-10">
          <div className="max-w-4xl">
            {/* Case Study Label */}
            <div className="text-xs text-gray-500 uppercase tracking-[0.2em] mb-6">
              Case Study
            </div>

            {/* Main Headline */}
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-8 leading-tight">
              We took{' '}
              <span className="inline-flex items-center">
                <Image
                  src="/images/origami-pink.svg"
                  alt="Origami"
                  width={120}
                  height={28}
                  className="h-6 md:h-7 lg:h-8 w-auto mx-2 translate-y-1.5"
                />
              </span>{' '}
              from 0 views to #1 ranked in less than 20 days.
            </h2>

            {/* Description */}
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed font-light mb-10 max-w-3xl">
              Origami launched an agent that identified structural issues, filled key content gaps, and quickly earned visibility across ChatGPT, Perplexity, and Google AI, ranking for the exact queries their customers were asking.
            </p>

            {/* CTA Button */}
            <button className="group inline-flex items-center gap-3 text-gray-300 hover:text-white transition-colors duration-200 text-base">
              <span className="border-b border-[#333333] group-hover:border-[#555555] transition-colors duration-200 pb-1">
                Read the case study
              </span>
              <svg 
                className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Decorative Lines - Clipped */}
        <div className="absolute top-0 right-0 w-[60%] md:w-[50%] h-full overflow-hidden">
          <div className="absolute -top-20 -right-32 md:-right-40 w-[150%] h-[120%]">
            <Image
              src="/images/origami-lines.svg"
              alt=""
              width={1989}
              height={1550}
              className="w-full h-full object-cover opacity-[0.08]"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <CTASection />

    <Schema json={faqSchema} />
    </div>
  )
} 