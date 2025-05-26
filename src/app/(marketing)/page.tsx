'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import Link from 'next/link'
import { Schema } from '@/components/Schema'
import CTASection from '@/components/sections/cta-section'
import { StepOneAudit, StepTwoMonitor, StepThreeImplement } from '@/components/sections/step-cards'

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
        
        @media (prefers-reduced-motion: reduce) {
          .dashboard-fall-in {
            animation: none;
            opacity: 1;
            transform: none;
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
        className="min-h-[70vh] md:min-h-[90vh] w-full relative flex items-start md:items-center justify-center pt-48 md:pt-64 lg:pt-80"
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

      {/* How It Works Header */}
      <section data-section="how-it-works" className="w-full py-16 md:py-32 bg-[#0c0c0c] relative overflow-hidden scroll-mt-20">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}></div>
        
        <div className="w-[92%] md:w-[80%] max-w-7xl mx-auto text-center relative">
          {/* Step Indicators */}
          <div className="flex justify-center items-center gap-2 sm:gap-4 mb-6 md:mb-12">
            <div className="w-6 sm:w-8 h-6 sm:h-8 bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-white text-xs sm:text-sm font-mono">1</div>
            <div className="w-8 sm:w-12 h-px bg-[#333333]"></div>
            <div className="w-6 sm:w-8 h-6 sm:h-8 bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-white text-xs sm:text-sm font-mono">2</div>
            <div className="w-8 sm:w-12 h-px bg-[#333333]"></div>
            <div className="w-6 sm:w-8 h-6 sm:h-8 bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-white text-xs sm:text-sm font-mono">3</div>
          </div>

          {/* Header Content */}
          <div className="mb-4 md:mb-8">
            <div className="text-xs text-gray-500 uppercase tracking-[0.2em] mb-3 md:mb-4">Process Overview</div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 md:mb-8 leading-tight">
              How It<span className="font-serif font-light italic"> Works</span>
            </h2>
          </div>
          
          <div className="max-w-4xl mx-auto mb-12 md:mb-16">
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 leading-relaxed font-light mb-4 md:mb-6">
              Three steps to dominate AI engine visibility and get your content cited by ChatGPT, Perplexity, and Google AI.
            </p>
            <div className="text-xs sm:text-sm text-gray-500 font-mono">
              AUDIT → MONITOR → IMPLEMENT
            </div>
          </div>

          {/* Three Steps in One Row */}
          <div className="grid md:grid-cols-3 gap-8 md:gap-12 text-left">
            
            {/* Step 1: Audit Your Visibility */}
            <div className="bg-[#0c0c0c] border border-[#1a1a1a] p-6 md:p-8 hover:border-[#333333] transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-8 h-8 bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-white font-bold text-sm">
                  1
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Step One</div>
                  <h3 className="text-lg md:text-xl font-bold text-white leading-tight">
                    Audit Your Visibility
                  </h3>
                </div>
              </div>
              
              <p className="text-gray-300 mb-6 text-sm md:text-base leading-relaxed font-light">
                We scan your site like an AI crawler would—flagging broken schema, missing citations, and content that LLMs ignore.
              </p>

              {/* Features List */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-1 h-1 bg-white mt-2 flex-shrink-0"></div>
                  <div>
                    <span className="text-gray-100 font-medium text-sm">LLMBot coverage report</span>
                    <div className="text-xs text-gray-500 mt-1">Comprehensive analysis of AI crawler accessibility</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1 h-1 bg-white mt-2 flex-shrink-0"></div>
                  <div>
                    <span className="text-gray-100 font-medium text-sm">Schema & llms.txt check</span>
                    <div className="text-xs text-gray-500 mt-1">Structured data validation and optimization</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1 h-1 bg-white mt-2 flex-shrink-0"></div>
                  <div>
                    <span className="text-gray-100 font-medium text-sm">Direct & indirect citation gaps</span>
                    <div className="text-xs text-gray-500 mt-1">Identify missed opportunities for AI citations</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Monitor Your Mentions */}
            <div className="bg-[#0c0c0c] border border-[#1a1a1a] p-6 md:p-8 hover:border-[#333333] transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-8 h-8 bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-white font-bold text-sm">
                  2
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Step Two</div>
                  <h3 className="text-lg md:text-xl font-bold text-white leading-tight">
                    Monitor Your Mentions
                  </h3>
                </div>
              </div>
              
              <p className="text-gray-300 mb-6 text-sm md:text-base leading-relaxed font-light">
                Track your brand's footprint across AI engines. Know exactly where you're showing up (or not) in ChatGPT, Perplexity, and Google AI.
              </p>

              {/* Features List */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-1 h-1 bg-white mt-2 flex-shrink-0"></div>
                  <div>
                    <span className="text-gray-100 font-medium text-sm">Real-time prompt-based visibility checks</span>
                    <div className="text-xs text-gray-500 mt-1">Monitor how AI engines respond to queries about your domain</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1 h-1 bg-white mt-2 flex-shrink-0"></div>
                  <div>
                    <span className="text-gray-100 font-medium text-sm">Daily re-rank tracking</span>
                    <div className="text-xs text-gray-500 mt-1">See how your visibility changes over time with trend analysis</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1 h-1 bg-white mt-2 flex-shrink-0"></div>
                  <div>
                    <span className="text-gray-100 font-medium text-sm">Competitive landscape mapping</span>
                    <div className="text-xs text-gray-500 mt-1">Compare your AI presence against industry competitors</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Generate Content That Fills Gaps */}
            <div className="bg-[#0c0c0c] border border-[#1a1a1a] p-6 md:p-8 hover:border-[#333333] transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-8 h-8 bg-[#1a1a1a] border border-[#333333] flex items-center justify-center text-white font-bold text-sm">
                  3
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Step Three</div>
                  <h3 className="text-lg md:text-xl font-bold text-white leading-tight">
                    AEO Engineer Goes to Work
                  </h3>
                </div>
              </div>
              
              <p className="text-gray-300 mb-6 text-sm md:text-base leading-relaxed font-light">
                Our engine identifies content gaps preventing LLM mentions, then generates optimized articles that fill those exact gaps. Queue, review, and publish directly to your CMS.
              </p>

              {/* Features List */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-1 h-1 bg-white mt-2 flex-shrink-0"></div>
                  <div>
                    <span className="text-gray-100 font-medium text-sm">Gap analysis & content queue</span>
                    <div className="text-xs text-gray-500 mt-1">Monitor missing topics that prevent top LLM citations</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1 h-1 bg-white mt-2 flex-shrink-0"></div>
                  <div>
                    <span className="text-gray-100 font-medium text-sm">AI-optimized content generation</span>
                    <div className="text-xs text-gray-500 mt-1">Select from engine-recommended content that fills citation gaps</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-1 h-1 bg-white mt-2 flex-shrink-0"></div>
                  <div>
                    <span className="text-gray-100 font-medium text-sm">Copy/paste or CMS integration</span>
                    <div className="text-xs text-gray-500 mt-1">Connect to your preferred CMS or copy optimized content directly</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Origami Case Study */}
      <section className="w-full py-16 md:py-28 bg-[#0c0c0c] relative border-t border-[#1a1a1a]">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}></div>
        
        <div className="w-[92%] md:w-[80%] max-w-7xl mx-auto relative z-10">
          
          {/* Case Study Card - Darker */}
          <div className="relative bg-[#0c0c0c] border border-[#1a1a1a] p-6 sm:p-8 md:p-12 overflow-hidden group hover:border-[#333333] transition-all duration-300 shadow-xl">
            
            {/* Case Study Label */}
            <div className="inline-flex items-center gap-2 bg-[#0c0c0c] border border-[#2a2a2a] px-3 py-1.5 mb-6 md:mb-8">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              <span className="text-xs text-gray-400 uppercase tracking-[0.15em] font-medium">
                Case Study
              </span>
            </div>

            {/* Main Headline */}
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
              from 0 mentions to ranked #1 in less than 20 days.
            </h2>

            {/* Description */}
            <p className="text-base sm:text-lg md:text-xl text-gray-300 leading-relaxed font-light mb-6 md:mb-8 max-w-3xl">
              Origami launched an autonomous agent that identified structural issues, filled key content gaps, and quickly earned visibility across{' '}
              <span className="text-white">ChatGPT, Perplexity, and Google AI</span>, ranking for the exact queries their customers were asking.
            </p>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link href="/customers" className="group inline-flex items-center gap-3 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#333333] hover:border-[#444444] px-4 sm:px-6 py-2.5 sm:py-3 transition-all duration-200 text-white text-sm sm:text-base">
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
      </section>

      {/* Divider Line */}
      <div className="w-full border-t border-[#1a1a1a] bg-[#0c0c0c]"></div>

      {/* CTA Section */}
      <CTASection />

    <Schema json={faqSchema} />
    </div>
  )
} 