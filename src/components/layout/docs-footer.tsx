'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function DocsFooter() {
  return (
    <footer className="border-t border-[#1a1a1a] bg-[#0c0c0c] mt-20">
      <div className="max-w-4xl mx-auto px-8 py-12">
        
        {/* Main Content */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 mb-8">
          
          {/* Brand */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <Image 
                src="/images/split-icon-white.svg" 
                alt="Split" 
                width={24} 
                height={24} 
              />
              <span className="text-white font-semibold">Split</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              The first autonomous AEO engineer.
            </p>
          </div>

          {/* Navigation Links - Compact Grid */}
          <div className="flex gap-16">
            
            {/* Company */}
            <div>
              <h4 className="text-white font-medium mb-3 text-sm">Company</h4>
              <nav className="space-y-2">
                <Link 
                  href="/customers" 
                  className="block text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Customers
                </Link>
                <Link 
                  href="/case-studies/origami" 
                  className="block text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Case Studies
                </Link>
              </nav>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-white font-medium mb-3 text-sm">Resources</h4>
              <nav className="space-y-2">
                <Link 
                  href="https://docs.split.dev" 
                  className="block text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Documentation
                </Link>
                <Link 
                  href="/resources" 
                  className="block text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Blog & Guides
                </Link>
              </nav>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-medium mb-3 text-sm">Legal</h4>
              <nav className="space-y-2">
                <Link 
                  href="/privacy" 
                  className="block text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link 
                  href="/terms" 
                  className="block text-gray-400 hover:text-white text-sm transition-colors"
                >
                  Terms of Service
                </Link>
              </nav>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-6 border-t border-[#1a1a1a]">
          <p className="text-gray-500 text-sm mb-4 sm:mb-0">
            © 1000X, All rights reserved.
          </p>
          
          <div className="flex items-center gap-4">
            <a 
              href="https://x.com/imsamhogan" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a 
              href="https://www.linkedin.com/in/samuelhhogan/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
} 