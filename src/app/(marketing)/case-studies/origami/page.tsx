'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import CTASection from '@/components/sections/cta-section'

export default function OrigamiCaseStudy() {
  const [isVisible, setIsVisible] = useState({
    hero: false,
    challenge: false,
    strategy: false,
    results: false,
    impact: false
  })

  const [animatedValues, setAnimatedValues] = useState({
    traffic: 120,
    crawlerHits: 0
  })

  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const section = entry.target.getAttribute('data-section')
            if (section) {
              setIsVisible(prev => ({ ...prev, [section]: true }))
              
              if (section === 'results') {
                animateCounters()
              }
            }
          }
        })
      },
      { threshold: 0.2 }
    )

    const sections = document.querySelectorAll('[data-section]')
    sections.forEach(section => observerRef.current?.observe(section))

    return () => observerRef.current?.disconnect()
  }, [])

  const animateCounters = () => {
    // Traffic animation
    let trafficStart = 120
    const trafficEnd = 340
    const trafficDuration = 1500
    const trafficIncrement = (trafficEnd - trafficStart) / (trafficDuration / 16)
    
    const trafficTimer = setInterval(() => {
      trafficStart += trafficIncrement
      if (trafficStart >= trafficEnd) {
        trafficStart = trafficEnd
        clearInterval(trafficTimer)
      }
      setAnimatedValues(prev => ({ ...prev, traffic: Math.round(trafficStart) }))
    }, 16)

    // Crawler hits animation
    let crawlerStart = 0
    const crawlerEnd = 10000
    const crawlerIncrement = crawlerEnd / (1500 / 16)
    
    const crawlerTimer = setInterval(() => {
      crawlerStart += crawlerIncrement
      if (crawlerStart >= crawlerEnd) {
        crawlerStart = crawlerEnd
        clearInterval(crawlerTimer)
      }
      setAnimatedValues(prev => ({ ...prev, crawlerHits: Math.round(crawlerStart) }))
    }, 16)
  }

  return (
    <div className="-mt-20 bg-[#0c0c0c] text-white">
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
        
        .stat-card {
          background: linear-gradient(135deg, #1a1a1a 0%, #0c0c0c 100%);
          border: 1px solid #333333;
          transition: all 0.4s ease;
          position: relative;
          overflow: hidden;
        }
        
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, transparent, #666666, transparent);
          transition: left 0.6s ease;
        }
        
        .stat-card:hover::before {
          left: 100%;
        }
        
        .stat-card:hover {
          border-color: #555555;
          transform: translateY(-4px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }
        
        .metric-highlight {
          background: linear-gradient(135deg, #1a1a1a 0%, #0c0c0c 100%);
          border: 1px solid #333333;
          position: relative;
          overflow: hidden;
        }
        
        .metric-highlight::after {
          content: '';
          position: absolute;
          top: 0;
          right: 0;
          width: 1px;
          height: 100%;
          background: linear-gradient(180deg, transparent, #666666, transparent);
          opacity: 0.5;
        }
      `}</style>

      {/* Hero Section */}
      <section 
        data-section="hero"
        className="min-h-screen flex items-center justify-center pt-20 px-4 sm:px-6"
      >
        <div className="max-w-5xl mx-auto text-center">
          <div className={`fade-in ${isVisible.hero ? 'visible' : ''}`}>
            <div className="mb-12 sm:mb-16">
              <div className="text-xs sm:text-sm text-gray-500 uppercase tracking-wider mb-8 sm:mb-12">Case Study</div>
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-9xl font-light text-white mb-8 sm:mb-12 leading-none tracking-tight">
                Zero to #1
              </h1>
              <div className="w-24 sm:w-32 h-px bg-gradient-to-r from-transparent via-white to-transparent mx-auto mb-8 sm:mb-12"></div>
              <div className="flex items-center justify-center mb-8 sm:mb-12">
                <Image
                  src="/images/origami-pink.svg"
                  alt="Origami Agents"
                  width={215}
                  height={55}
                  className="h-8 sm:h-10 md:h-12 w-auto opacity-90"
                />
              </div>
              <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-light px-4 sm:px-0">
                The story of how Origami Agents achieved #1 ranking in Google AI Overview 
                and transformed their entire business trajectory in just 60 days
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-4xl mx-auto mt-12 sm:mt-20">
              <div className="stat-card p-4 sm:p-6 md:p-8 text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-light text-white mb-1 sm:mb-2">60</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Days</div>
              </div>
              <div className="stat-card p-4 sm:p-6 md:p-8 text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-light text-white mb-1 sm:mb-2">183%</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Growth</div>
              </div>
              <div className="stat-card p-4 sm:p-6 md:p-8 text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-light text-white mb-1 sm:mb-2">#1</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Ranking</div>
              </div>
              <div className="stat-card p-4 sm:p-6 md:p-8 text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-light text-white mb-1 sm:mb-2">10K+</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">AI Hits</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">

        {/* Challenge Section */}
        <section data-section="challenge" className="mb-16 sm:mb-20 md:mb-24">
          <div className={`fade-in ${isVisible.challenge ? 'visible' : ''}`}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white mb-8 sm:mb-10 md:mb-12 leading-tight">The Challenge</h2>
            
            <p className="text-lg sm:text-xl text-gray-300 leading-relaxed mb-12 sm:mb-14 md:mb-16">
              Origami Agents was competing in one of the hottest emerging categories: AI Agents. The space was 
              crowded with well-funded startups and tech giants all vying for market share. 
            </p>

            <p className="text-base sm:text-lg text-gray-400 leading-relaxed mb-12 sm:mb-14 md:mb-16">
              We decided that 
              "research agents" would be our strategic entry point. A specific niche where we could establish 
              authority before expanding into the broader agent ecosystem. 
            </p>

            <p className="text-base sm:text-lg text-gray-400 leading-relaxed mb-12 sm:mb-14 md:mb-16">
              The challenge? Even in this focused niche, we were up against OpenAI's "deep research" feature 
              and other established players with massive domain authority, years of content history, and 
              significant marketing budgets.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-14 md:mb-16">
              <div className="metric-highlight p-6 sm:p-8 md:p-10 text-center">
                <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white mb-4 sm:mb-6">6</div>
                <div className="text-base sm:text-lg text-gray-300 mb-2 sm:mb-3">Site Authority</div>
                <div className="text-sm text-gray-500 leading-relaxed">
                  Competing against established players with domain authorities in the 80s and 90s
                </div>
              </div>
              
              <div className="metric-highlight p-6 sm:p-8 md:p-10 text-center">
                <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white mb-4 sm:mb-6">100+</div>
                <div className="text-base sm:text-lg text-gray-300 mb-2 sm:mb-3">Keyword Position</div>
                <div className="text-sm text-gray-500 leading-relaxed">
                  All target keywords ranking beyond the first 10 pages of search results
                </div>
              </div>
              
              <div className="metric-highlight p-6 sm:p-8 md:p-10 text-center sm:col-span-2 md:col-span-1">
                <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white mb-4 sm:mb-6">120</div>
                <div className="text-base sm:text-lg text-gray-300 mb-2 sm:mb-3">Daily Visitors</div>
                <div className="text-sm text-gray-500 leading-relaxed">
                  Minimal organic discovery despite having a superior product offering
                </div>
              </div>
            </div>

            <div className="bg-[#1a1a1a] p-6 sm:p-8 md:p-12 mb-12 sm:mb-14 md:mb-16">
              <div className="border-l-4 border-gray-600 pl-4 sm:pl-6 md:pl-8">
                <p className="text-lg sm:text-xl md:text-2xl text-gray-200 leading-relaxed mb-4 sm:mb-6 font-light italic">
                  "We were invisible to AI engines. When users asked ChatGPT about research agents, 
                  we simply didn't exist in the conversation.
                </p>
                <div className="text-sm text-gray-500">— Finn Mallery, CEO of Origami Agents</div>
              </div>
            </div>

            <p className="text-base sm:text-lg text-gray-400 leading-relaxed">
              The problem wasn't just traditional SEO—it was Answer Engine Optimization (AEO). 
              While competitors focused on ranking for humans, we needed to optimize for AI engines 
              that were becoming the primary discovery mechanism for B2B software solutions.
            </p>
          </div>
        </section>

        {/* Strategy Section */}
        <section data-section="strategy" className="mb-16 sm:mb-20 md:mb-24">
          <div className={`fade-in ${isVisible.strategy ? 'visible' : ''}`}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white mb-8 sm:mb-10 md:mb-12 leading-tight">The Strategy</h2>
            
            <p className="text-lg sm:text-xl text-gray-300 leading-relaxed mb-12 sm:mb-14 md:mb-16">
              Our approach was fundamentally different from traditional SEO. Instead of optimizing for 
              search engines, we optimized for answer engines—the AI systems that power ChatGPT, 
              Claude, and Google's AI Overview.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 md:gap-16 mb-12 sm:mb-14 md:mb-16">
              <div>
                <h3 className="text-xl sm:text-2xl font-light text-white mb-6 sm:mb-8">Technical Foundation</h3>
                <div className="space-y-6 sm:space-y-8">
                  <div className="border-l-2 border-gray-700 pl-4 sm:pl-6 md:pl-8">
                    <div className="text-base sm:text-lg text-white mb-1 sm:mb-2">Server-Side Rendering</div>
                    <div className="text-sm sm:text-base text-gray-400 leading-relaxed">
                      Enhanced crawl accessibility specifically designed for AI engines, 
                      ensuring every piece of content was immediately discoverable and parseable.
                    </div>
                  </div>
                  <div className="border-l-2 border-gray-700 pl-4 sm:pl-6 md:pl-8">
                    <div className="text-base sm:text-lg text-white mb-1 sm:mb-2">Schema Markup</div>
                    <div className="text-sm sm:text-base text-gray-400 leading-relaxed">
                      Comprehensive structured data implementation that helps AI systems 
                      understand context, relationships, and content hierarchy.
                    </div>
                  </div>
                  <div className="border-l-2 border-gray-700 pl-4 sm:pl-6 md:pl-8">
                    <div className="text-base sm:text-lg text-white mb-1 sm:mb-2">Metadata Optimization</div>
                    <div className="text-sm sm:text-base text-gray-400 leading-relaxed">
                      AI-friendly content descriptions that serve as perfect training data 
                      for language models to understand and cite the content.
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-light text-white mb-6 sm:mb-8">Content Strategy</h3>
                <div className="space-y-6 sm:space-y-8">
                  <div className="border-l-2 border-gray-700 pl-4 sm:pl-6 md:pl-8">
                    <div className="text-base sm:text-lg text-white mb-1 sm:mb-2">Quote-Worthy Creation</div>
                    <div className="text-sm sm:text-base text-gray-400 leading-relaxed">
                      Every piece of content was crafted to be citation-worthy, with clear, 
                      authoritative statements that AI engines would want to reference.
                    </div>
                  </div>
                  <div className="border-l-2 border-gray-700 pl-4 sm:pl-6 md:pl-8">
                    <div className="text-base sm:text-lg text-white mb-1 sm:mb-2">Answer Engine Focus</div>
                    <div className="text-sm sm:text-base text-gray-400 leading-relaxed">
                      Reframed traditional SEO as AEO, optimizing for how AI systems 
                      understand, process, and cite information.
                    </div>
                  </div>
                  <div className="border-l-2 border-gray-700 pl-4 sm:pl-6 md:pl-8">
                    <div className="text-base sm:text-lg text-white mb-1 sm:mb-2">Competitive Positioning</div>
                    <div className="text-sm sm:text-base text-gray-400 leading-relaxed">
                      Strategic content positioning that directly addressed the gaps 
                      in OpenAI's coverage and other major competitors.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#1a1a1a] p-6 sm:p-8 md:p-12">
              <div className="text-center mb-8 sm:mb-10 md:mb-12">
                <h4 className="text-lg sm:text-xl text-gray-300 mb-3 sm:mb-4">Implementation Timeline</h4>
                <div className="w-16 sm:w-20 md:w-24 h-px bg-gray-600 mx-auto"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
                <div className="text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 border border-gray-600 rounded-full flex items-center justify-center text-xs sm:text-sm text-gray-400 mx-auto mb-4 sm:mb-6">1</div>
                  <div className="text-sm sm:text-base text-white mb-1 sm:mb-2">Week 1-2</div>
                  <div className="text-xs sm:text-sm text-gray-500">Technical audit and infrastructure setup</div>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 border border-gray-600 rounded-full flex items-center justify-center text-xs sm:text-sm text-gray-400 mx-auto mb-4 sm:mb-6">2</div>
                  <div className="text-sm sm:text-base text-white mb-1 sm:mb-2">Week 3-4</div>
                  <div className="text-xs sm:text-sm text-gray-500">Content optimization and AEO implementation</div>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 border border-gray-600 rounded-full flex items-center justify-center text-xs sm:text-sm text-gray-400 mx-auto mb-4 sm:mb-6">3</div>
                  <div className="text-sm sm:text-base text-white mb-1 sm:mb-2">Week 5-6</div>
                  <div className="text-xs sm:text-sm text-gray-500">AI engine targeting and citation optimization</div>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 border border-gray-600 rounded-full flex items-center justify-center text-xs sm:text-sm text-gray-400 mx-auto mb-4 sm:mb-6">4</div>
                  <div className="text-sm sm:text-base text-white mb-1 sm:mb-2">Week 7-8</div>
                  <div className="text-xs sm:text-sm text-gray-500">Performance monitoring and refinement</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section data-section="results" className="mb-16 sm:mb-20 md:mb-24">
          <div className={`fade-in ${isVisible.results ? 'visible' : ''}`}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white mb-8 sm:mb-10 md:mb-12 leading-tight">The Results</h2>
            
            <p className="text-lg sm:text-xl text-gray-300 leading-relaxed mb-12 sm:mb-14 md:mb-16">
              The transformation was nothing short of remarkable. Within 60 days, Origami Agents went 
              from AI invisibility to becoming an emerging go-to for research agent queries across 
              multiple AI platforms.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 md:gap-12 mb-16 sm:mb-18 md:mb-20">
              <div className="metric-highlight p-6 sm:p-8 md:p-12">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 sm:mb-8">
                  <div className="text-lg sm:text-xl md:text-2xl text-white mb-2 sm:mb-0">Daily Organic Traffic</div>
                  <div className="text-base sm:text-lg text-gray-400">+183%</div>
                </div>
                <div className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light text-white mb-6 sm:mb-8">{animatedValues.traffic}</div>
                <div className="w-full bg-[#333333] h-px mb-3 sm:mb-4">
                  <div 
                    className="h-px bg-white transition-all duration-2000 ease-out"
                    style={{ width: isVisible.results ? '100%' : '0%' }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs sm:text-sm text-gray-500">
                  <span>120 visitors before</span>
                  <span>340+ visitors after</span>
                </div>
                <p className="text-sm sm:text-base text-gray-400 mt-4 sm:mt-6 leading-relaxed">
                  Organic traffic nearly tripled as AI engines began consistently citing 
                  and recommending Origami Agents as the leading research agent solution.
                </p>
              </div>

              <div className="metric-highlight p-6 sm:p-8 md:p-12">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 sm:mb-8">
                  <div className="text-lg sm:text-xl md:text-2xl text-white mb-2 sm:mb-0">AI Crawler Hits</div>
                  <div className="text-base sm:text-lg text-gray-400">Monthly</div>
                </div>
                <div className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light text-white mb-6 sm:mb-8">10K+</div>
                <div className="w-full bg-[#333333] h-px mb-3 sm:mb-4">
                  <div 
                    className="h-px bg-white transition-all duration-2000 ease-out"
                    style={{ width: isVisible.results ? '95%' : '0%' }}
                  ></div>
                </div>
                <div className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
                  From zero to 10,000+ monthly AI engine visits
                </div>
                <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                  AI crawlers from ChatGPT, Claude, and other engines began regularly 
                  indexing and citing content, creating a sustainable discovery pipeline.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10 md:gap-12 mb-16 sm:mb-18 md:mb-20">
              <div className="text-center">
                <div className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light text-white mb-3 sm:mb-4">#1</div>
                <div className="text-lg sm:text-xl text-gray-300 mb-2 sm:mb-3">Google AI Overview</div>
                <div className="text-sm sm:text-base text-gray-500 leading-relaxed">
                  Achieved top ranking for "research agents" beating OpenAI and other major competitors
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light text-white mb-3 sm:mb-4">#3</div>
                <div className="text-lg sm:text-xl text-gray-300 mb-2 sm:mb-3">Organic Search</div>
                <div className="text-sm sm:text-base text-gray-500 leading-relaxed">
                  Dramatic improvement in traditional search rankings across all target keywords
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light text-white mb-3 sm:mb-4">30</div>
                <div className="text-lg sm:text-xl text-gray-300 mb-2 sm:mb-3">Top Rankings</div>
                <div className="text-sm sm:text-base text-gray-500 leading-relaxed">
                  Nearly all target keywords now ranking in top 30 positions
                </div>
              </div>
            </div>

            <div className="bg-[#1a1a1a] p-6 sm:p-8 md:p-12 mb-12 sm:mb-14 md:mb-16">
              <div className="text-center mb-6 sm:mb-8">
                <h4 className="text-lg sm:text-xl md:text-2xl text-white mb-3 sm:mb-4">ChatGPT Impact</h4>
                <div className="text-base sm:text-lg text-gray-400">#4 biggest referral source</div>
              </div>
              <p className="text-center text-sm sm:text-base md:text-lg text-gray-300 leading-relaxed max-w-3xl mx-auto">
                ChatGPT became the 4th largest traffic source, generating direct sales pipeline 
                from users discovering Origami through AI recommendations. Multiple demo bookings 
                now come directly from ChatGPT referrals.
              </p>
            </div>

            <p className="text-base sm:text-lg text-gray-400 leading-relaxed">
              But the numbers only tell part of the story. The real transformation was in market 
              positioning—Origami Agents had become the authoritative voice in research agents, 
              consistently cited by AI engines as the leading solution in the space.
            </p>
          </div>
        </section>

        {/* Impact Section */}
        <section data-section="impact" className="mb-16 sm:mb-20 md:mb-24">
          <div className={`fade-in ${isVisible.impact ? 'visible' : ''}`}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white mb-8 sm:mb-10 md:mb-12 leading-tight">The Impact</h2>
            
            <p className="text-lg sm:text-xl text-gray-300 leading-relaxed mb-12 sm:mb-14 md:mb-16">
              The success went far beyond improved rankings. Origami Agents had fundamentally 
              transformed their market position and established themselves as the definitive 
              authority in AI-powered research tools.
            </p>

            <div className="bg-[#1a1a1a] p-6 sm:p-8 md:p-16 mb-16 sm:mb-18 md:mb-20">
              <div className="border-l-4 border-gray-600 pl-6 sm:pl-8 md:pl-12">
                <p className="text-xl sm:text-2xl md:text-3xl text-white leading-relaxed mb-6 sm:mb-8 font-light italic">
                  "I have no idea how you did it. It's crazy to think we are now ranking #1 in some categories and being one of the top results for research 
                  agents compared to some of the largest companies in the world."
                </p>
                <div className="text-sm sm:text-base text-gray-500">— Finn Mallery, CEO of Origami Agents</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 md:gap-16 mb-16 sm:mb-18 md:mb-20">
              <div className="text-center">
                <div className="text-xl sm:text-2xl text-white mb-3 sm:mb-4">Market Leadership</div>
                <div className="text-sm sm:text-base text-gray-400 leading-relaxed">
                  Established as the #1 AI-recommended solution, consistently cited across 
                  multiple AI platforms as the leading research agent tool.
                </div>
              </div>

              <div className="text-center">
                <div className="text-xl sm:text-2xl text-white mb-3 sm:mb-4">Revenue Growth</div>
                <div className="text-sm sm:text-base text-gray-400 leading-relaxed">
                  Direct sales pipeline from AI-driven discovery, with measurable revenue 
                  attribution to ChatGPT and other AI engine referrals.
                </div>
              </div>

              <div className="text-center">
                <div className="text-xl sm:text-2xl text-white mb-3 sm:mb-4">Future-Proof Positioning</div>
                <div className="text-sm sm:text-base text-gray-400 leading-relaxed">
                  Positioned perfectly for the AI-first search landscape, with sustainable 
                  competitive advantages in answer engine optimization.
                </div>
              </div>
            </div>

            <p className="text-base sm:text-lg text-gray-400 leading-relaxed mb-12 sm:mb-14 md:mb-16">
              The transformation of Origami Agents represents more than a successful SEO campaign—it's 
              a blueprint for how companies can thrive in an AI-first discovery landscape. By focusing 
              on answer engine optimization rather than traditional search optimization, they didn't 
              just improve their rankings; they fundamentally changed how their market discovers and 
              evaluates research agent solutions.
            </p>

            <CTASection />
          </div>
        </section>
      </div>
    </div>
  )
} 