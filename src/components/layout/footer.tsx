'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || isSubmitting) return
    
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

  return (
    <footer className="bg-white border-t border-gray-200 pt-12 md:pt-20 pb-6 md:pb-8">
      <style jsx global>{`
        .footer-logo-rotate {
          transition: transform 0.5s ease-out;
          transform-style: preserve-3d;
          perspective: 1000px;
        }
        .footer-logo-container:hover .footer-logo-rotate {
          transform: rotateY(180deg);
        }
        .footer-link {
          position: relative;
          transition: all 0.2s ease-out;
        }
        .footer-link::after {
          content: '';
          position: absolute;
          width: 0;
          height: 1px;
          bottom: -2px;
          left: 0;
          background-color: #191919;
          transition: width 0.3s ease-out;
        }
        .footer-link:hover::after {
          width: 100%;
        }
        .footer-link:hover {
          transform: translateX(2px);
          color: #191919;
        }
        .social-icon {
          transition: all 0.2s ease-out;
        }
        .social-icon:hover {
          transform: translateY(-2px) scale(1.1);
          filter: brightness(0.8);
        }
        .newsletter-input {
          transition: all 0.2s ease-out;
        }
        .newsletter-input:focus {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
      `}</style>
      
      <div className="w-[92%] md:w-[80%] max-w-7xl mx-auto">
        {/* Company Info - Full width on mobile */}
        <div className="mb-8 md:mb-12">
          <Link href="/" className="footer-logo-container flex items-center mb-4 md:mb-6">
            <Image 
              src="/images/split-icon-black.svg" 
              alt="Split" 
              width={28} 
              height={28} 
              className="footer-logo-rotate mr-3 w-7 sm:w-8 h-7 sm:h-8" 
            />
            <span className="text-lg sm:text-xl font-bold text-[#191919]">Split</span>
          </Link>
          <p className="text-gray-600 mb-4 md:mb-6 leading-relaxed max-w-md text-sm sm:text-base">
            Always-on LLM-Search Attribution layer.
          </p>
          
          {/* Newsletter Signup */}
          <div className="mb-6 md:mb-8">
            <h4 className="text-[#191919] font-semibold mb-2 md:mb-3 text-sm sm:text-base">Stay Updated</h4>
            <form onSubmit={handleSubscribe} className="max-w-sm">
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="newsletter-input flex-1 px-2.5 sm:px-3 py-2 sm:py-2 bg-white border border-gray-300 text-[#191919] placeholder-gray-500 focus:outline-none focus:border-gray-400 text-xs sm:text-sm disabled:opacity-50"
                  required
                />
                <button 
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="bg-[#191919] hover:bg-[#333333] text-white px-3 sm:px-4 py-2 sm:py-2 border border-[#191919] hover:border-[#333333] transition-all duration-200 text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Subscribing...' : 'Subscribe'}
                </button>
              </div>
              {status === 'success' && (
                <p className="text-xs text-green-600 mt-1.5 sm:mt-2">
                  ✓ You've been added to our newsletter!
                </p>
              )}
              {status === 'error' && (
                <p className="text-xs text-red-600 mt-1.5 sm:mt-2">
                  Failed to subscribe. Please try again.
                </p>
              )}
              {status === 'idle' && (
                <p className="text-xs text-gray-500 mt-1.5 sm:mt-2">
                  Get attribution insights and product updates
                </p>
              )}
            </form>
          </div>


        </div>

        {/* Navigation Links - 2 columns on mobile, responsive grid for larger screens */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 lg:gap-12">

          {/* Company */}
          <div>
            <h4 className="text-[#191919] font-semibold mb-3 md:mb-4 text-sm">Company</h4>
            <nav className="space-y-2 md:space-y-3">
              <Link href="/customers" className="footer-link block text-gray-600 hover:text-[#191919] text-xs sm:text-sm">
                Customers
              </Link>
              <Link href="/case-studies/origami" className="footer-link block text-gray-600 hover:text-[#191919] text-xs sm:text-sm">
                Case Studies
              </Link>
            </nav>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-[#191919] font-semibold mb-3 md:mb-4 text-sm">Resources</h4>
            <nav className="space-y-2 md:space-y-3">
              <span className="footer-link block text-gray-500 text-xs sm:text-sm cursor-not-allowed">
                Documentation (Coming Soon)
              </span>
              <Link href="/resources" className="footer-link block text-gray-600 hover:text-[#191919] text-xs sm:text-sm">
                Blog & Guides
              </Link>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-[#191919] font-semibold mb-3 md:mb-4 text-sm">Legal</h4>
            <nav className="space-y-2 md:space-y-3">
              <Link href="/privacy" className="footer-link block text-gray-600 hover:text-[#191919] text-xs sm:text-sm">
                Privacy Policy
              </Link>
              <Link href="/terms" className="footer-link block text-gray-600 hover:text-[#191919] text-xs sm:text-sm">
                Terms of Service
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 mt-6 border-t border-gray-200">
          <p className="text-gray-500 text-xs sm:text-sm mb-4 sm:mb-0">
            © 1000X, All rights reserved.
          </p>
          
          <div className="flex gap-2.5 sm:gap-3">
            <a href="https://x.com/imsamhogan" target="_blank" rel="noopener noreferrer" className="social-icon text-gray-600 hover:text-[#191919]">
              <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="https://www.linkedin.com/in/samuelhhogan/" target="_blank" rel="noopener noreferrer" className="social-icon text-gray-600 hover:text-[#191919]">
              <svg className="w-4 sm:w-5 h-4 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
} 