'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import Link from 'next/link'
import { Schema } from '@/components/Schema'
import CTASection from '@/components/sections/cta-section'
import HeroCTA from '@/components/sections/hero-cta'
import { StepOneAudit, StepTwoMonitor, StepThreeImplement } from '@/components/sections/step-cards'
import { Analytics } from "@vercel/analytics/next"

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does Split.dev attribute AI-driven search visits?",
      acceptedAnswer: { "@type": "Answer", text: "Split.dev inspects AI crawler visits and citations, then resolves them to real people inside your CRM within seconds." }
    },
    {
      "@type": "Question",
      name: "What is LLM-Search Attribution?",
      acceptedAnswer: { "@type": "Answer", text: "LLM-Search Attribution tracks AI crawler visits, maps citations to real contacts, and identifies companies visiting from AI platforms like ChatGPT and Perplexity." }
    }
  ]
};
export default function LandingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [redirecting, setRedirecting] = useState(false)

  // If user is logged in, redirect to dashboard
  useEffect(() => {
    console.log('LandingPage: Auth state:', { user: !!user, loading, redirecting })
    if (!loading && user && !redirecting) {
      console.log('LandingPage: Redirecting logged-in user to dashboard')
      setRedirecting(true)
      router.push('/dashboard')
    }
  }, [user, loading, router, redirecting])

  // Set up scroll animations
  useEffect(() => {
    if (typeof window === 'undefined' || redirecting) return;

    const handleScroll = () => {
      const elements = document.querySelectorAll('.fade-in-section');
      
      elements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight * 0.8;
        
        if (isVisible && !element.classList.contains('visible')) {
          element.classList.add('visible');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check on initial load
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [redirecting])

  // Show loading while auth is loading or while redirecting
  if (loading || redirecting) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-primary" />
        {redirecting && (
          <p className="ml-4 text-gray-400">Redirecting to dashboard...</p>
        )}
      </div>
    )
  }

  // If we get here, user is not logged in and should see the landing page
  console.log('LandingPage: Rendering landing page for non-authenticated user')

  // Fallback to prevent blank page
  if (user === null && !loading && !redirecting) {
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
        
        /* Scroll animations */
        .fade-in-section {
          opacity: 0;
          filter: blur(4px);
          transform: translateY(20px);
          transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .fade-in-section.visible {
          opacity: 1;
          filter: blur(0);
          transform: translateY(0);
        }
        
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
          .fade-in-section {
            opacity: 1 !important;
            filter: none !important;
            transform: none !important;
            transition: none !important;
          }
        }
      `}</style>
      

      
      {/* Hero Section */}
      <div className="min-h-[70vh] md:min-h-[90vh] w-full relative flex items-start md:items-center justify-center pt-48 md:pt-52 lg:pt-64 bg-white">
        <div className="relative z-10 w-[92%] md:w-[80%] max-w-7xl mx-auto px-2 md:px-4">
          <HeroCTA />

          {/* Dashboard Preview */}
          <div className="relative mt-2 md:mt-8 pb-5">
            {/* Mobile version - scaled up and translated */}
            <div className="relative md:hidden overflow-hidden">
              <Image
                src="/images/mobile-dash.svg"
                alt="Split Dashboard"
                width={1200}
                height={900}
                className="w-[180%] h-auto dashboard-fall-in transform translate-x-[15%] scale-125"
              />
            </div>
            {/* Desktop version - with frame */}
            <div className="hidden md:block w-full rounded-2xl border-[3px] border-[#e5e5e5]/15 overflow-hidden shadow-2xl dashboard-fall-in">
              <Image
                src="/images/Backdrop.svg"
                alt="Split Dashboard"
                width={1200}
                height={800}
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Header */}
      <section data-section="how-it-works" className="w-full py-16 md:py-32 bg-white relative overflow-hidden scroll-mt-20">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `linear-gradient(#191919 1px, transparent 1px), linear-gradient(90deg, #191919 1px, transparent 1px)`,
          backgroundSize: '32px 32px'
        }}></div>
        
        <div className="w-[92%] md:w-[80%] max-w-7xl mx-auto relative">
          {/* Header Content */}
          <div className="text-center mb-16 md:mb-24">
            <div className="text-xs text-gray-600 uppercase tracking-[0.2em] mb-3 md:mb-4">Process Overview</div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#191919] mb-4 md:mb-8 leading-tight">
              How It<span className="font-serif font-light italic"> Works</span>
            </h2>
            <div className="max-w-5xl mx-auto">
              <p className="text-lg sm:text-xl md:text-2xl text-gray-700 leading-relaxed font-light mb-4 md:mb-6">
                From audit to attribution—track what AI crawlers see, monitor who's visiting, and convert insights into pipeline.
              </p>
              <div className="text-xs sm:text-sm text-gray-600 font-mono">
                AUDIT → TRACK → CONVERT
              </div>
            </div>
          </div>

          {/* Section 1: Detect AI Traffic - Image Right */}
          <section id="detect-ai-traffic" className="mb-20 md:mb-32">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div className="order-2 lg:order-1 fade-in-section">
                <h3 className="text-2xl md:text-3xl font-medium text-[#191919] mb-4">
                  Detect AI Traffic
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed font-light mb-6">
                  See every time an AI assistant lands on your site. Our server logs spot ChatGPT, Perplexity, Gemini, etc., in real time.
                </p>
                <div className="space-y-3 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-[#191919] rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Real-time AI crawler detection across 25+ platforms</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-[#191919] rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Server-side logging captures all AI bot visits</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-[#191919] rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Zero false positives with smart pattern matching</span>
                  </div>
                </div>
                
                {/* CTA Button */}
                <Link 
                  href="/signup" 
                  className="inline-flex items-center gap-2 bg-[#191919] hover:bg-[#333333] text-white px-4 py-2.5 text-sm transition-all duration-200 hover:scale-105"
                >
                  Start detecting AI traffic
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
              <div className="order-1 lg:order-2 fade-in-section">
                <div className="bg-gray-50 p-8 rounded-sm shadow-sm hover:shadow transition-all duration-300">
                  <Image
                    src="/images/section1.svg"
                    alt="AI traffic detection dashboard"
                    width={516}
                    height={421}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Attribute AI-Driven Leads - Image Left */}
          <section id="attribute-leads" className="mb-20 md:mb-32">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div className="order-1 fade-in-section">
                <div className="bg-gray-50 p-8 rounded-sm shadow-sm hover:shadow transition-all duration-300">
                  <Image
                    src="/images/section2.svg"
                    alt="AI-driven lead attribution card"
                    width={516}
                    height={421}
                    className="w-full h-auto"
                  />
                </div>
              </div>
              <div className="order-2 fade-in-section">
                <h3 className="text-2xl md:text-3xl font-medium text-[#191919] mb-4">
                  Attribute AI-Driven Leads
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed font-light mb-6">
                  Turn AI visits into prospects. Each intent-rich session auto-creates a lead card with contact info and the exact query.
                </p>
                <div className="space-y-3 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-[#191919] rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Automatic lead generation from AI referral traffic</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-[#191919] rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Capture the exact search query that brought them</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-[#191919] rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Intent scoring based on engagement and query context</span>
                  </div>
                </div>
                
                {/* CTA Button */}
                <Link 
                  href="/signup" 
                  className="inline-flex items-center gap-2 bg-[#191919] hover:bg-[#333333] text-white px-4 py-2.5 text-sm transition-all duration-200 hover:scale-105"
                >
                  Start capturing leads
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </section>

          {/* Section 3: Enrich & Win - Image Right */}
          <section id="enrich-win">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              <div className="order-2 lg:order-1 fade-in-section">
                <h3 className="text-2xl md:text-3xl font-medium text-[#191919] mb-4">
                  Enrich & Win
                </h3>
                <p className="text-lg text-gray-700 leading-relaxed font-light mb-6">
                  Enrich any AI-sourced lead with social profiles, patent filings, job history, and more—context you can act on.
                </p>
                <div className="space-y-3 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-[#191919] rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Complete professional profiles with social media</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-[#191919] rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Company intelligence and recent news alerts</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-[#191919] rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-600">Patent filings, job history, and buying signals</span>
                  </div>
                </div>
                
                {/* CTA Button */}
                <Link 
                  href="/signup" 
                  className="inline-flex items-center gap-2 bg-[#191919] hover:bg-[#333333] text-white px-4 py-2.5 text-sm transition-all duration-200 hover:scale-105"
                >
                  Start enriching leads
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
              <div className="order-1 lg:order-2 fade-in-section">
                <div className="bg-gray-50 p-8 rounded-sm shadow-sm hover:shadow transition-all duration-300">
                  <Image
                    src="/images/section3.svg"
                    alt="Lead enrichment interface"
                    width={516}
                    height={421}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>

      {/* Origami Case Study */}
      <section className="w-full py-16 md:py-28 bg-white relative border-t border-[#e5e5e5]">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #191919 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}></div>
        
        <div className="w-[92%] md:w-[80%] max-w-7xl mx-auto relative z-10">
          
          {/* Case Study Card */}
          <div className="relative bg-white border border-[#e5e5e5] p-6 sm:p-8 md:p-12 overflow-hidden group hover:border-[#d1d1d1] transition-all duration-300 shadow-xl">
            
            {/* Case Study Label */}
            <div className="inline-flex items-center gap-2 bg-white border border-[#e5e5e5] px-3 py-1.5 mb-6 md:mb-8">
              <div className="w-1.5 h-1.5 bg-[#191919] rounded-full"></div>
              <span className="text-xs text-gray-600 uppercase tracking-[0.15em] font-medium">
                Case Study
              </span>
            </div>

            {/* Main Headline */}
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-[#191919] mb-6 md:mb-8 leading-tight max-w-4xl">
              We took{' '}
              <span className="inline-flex items-center">
                <Image
                  src="/images/origami-dark.svg"
                  alt="Origami"
                  width={120}
                  height={28}
                  className="h-5 sm:h-7 md:h-8 lg:h-9 w-auto mx-1 sm:mx-2 translate-y-1.5"
                />
              </span>{' '}
              from 0 mentions to ranked #1 in less than 20 days.
            </h2>

            {/* Description */}
            <p className="text-base sm:text-lg md:text-xl text-gray-700 leading-relaxed font-light mb-6 md:mb-8 max-w-3xl">
              Origami launched an autonomous agent that identified structural issues, filled key content gaps, and quickly earned visibility across{' '}
              <span className="text-[#191919]">ChatGPT, Perplexity, and Google AI</span>, ranking for the exact queries their customers were asking.
            </p>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link href="/customers" className="group inline-flex items-center gap-3 bg-[#191919] hover:bg-[#333333] border border-[#191919] hover:border-[#333333] px-4 sm:px-6 py-2.5 sm:py-3 transition-all duration-200 text-white text-sm sm:text-base">
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
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[#f9f9f9]/30 pointer-events-none"></div>
          </div>
          
        </div>
      </section>

      {/* Divider Line */}
      <div className="w-full border-t border-[#e5e5e5] bg-white"></div>

      {/* CTA Section */}
      <CTASection />

      <Schema json={faqSchema} />
      <Analytics />
      </div>
    )
  }

  // This should never happen, but just in case
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Welcome to Split</h1>
        <p className="text-gray-400 mb-4">Loading...</p>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-primary mx-auto" />
      </div>
    </div>
  )
} 