'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-[#0c0c0c] border-t border-[#1a1a1a] py-16 md:py-20">
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
          background-color: white;
          transition: width 0.3s ease-out;
        }
        .footer-link:hover::after {
          width: 100%;
        }
        .footer-link:hover {
          transform: translateX(2px);
          color: white;
        }
        .social-icon {
          transition: all 0.2s ease-out;
        }
        .social-icon:hover {
          transform: translateY(-2px) scale(1.1);
          filter: brightness(1.2);
        }
        .newsletter-input {
          transition: all 0.2s ease-out;
        }
        .newsletter-input:focus {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
        }
      `}</style>
      
      <div className="w-[92%] md:w-[80%] max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 md:gap-16">
          
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="footer-logo-container flex items-center mb-6">
              <Image 
                src="/images/split-icon-white.svg" 
                alt="Split" 
                width={32} 
                height={32} 
                className="footer-logo-rotate mr-3" 
              />
              <span className="text-xl font-bold text-white">Split</span>
            </Link>
            <p className="text-gray-400 mb-6 leading-relaxed max-w-md">
              The first autonomous AEO engineer. Get your content cited by ChatGPT, Perplexity, and Google AI.
            </p>
            
            {/* Newsletter Signup */}
            <div className="mb-8">
              <h4 className="text-white font-semibold mb-3">Stay Updated</h4>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="newsletter-input flex-1 px-3 py-2 bg-[#1a1a1a] border border-[#333333] text-white placeholder-gray-500 focus:outline-none focus:border-[#444444] text-sm"
                />
                <button className="bg-[#2a2a2a] hover:bg-[#333333] text-white px-4 py-2 border border-[#444444] hover:border-[#555555] transition-all duration-200 text-sm font-medium">
                  Subscribe
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Get AEO insights and product updates
              </p>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">Follow us:</span>
              <div className="flex gap-3">
                <a href="#" className="social-icon text-gray-400 hover:text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"/>
                  </svg>
                </a>
                <a href="#" className="social-icon text-gray-400 hover:text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="#" className="social-icon text-gray-400 hover:text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.112.221.082.342-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-semibold mb-6">Product</h4>
            <nav className="space-y-4">
              <Link href="/product" className="footer-link block text-gray-400 hover:text-white">
                Overview
              </Link>
              <Link href="/features" className="footer-link block text-gray-400 hover:text-white">
                Features
              </Link>
              <Link href="/integrations" className="footer-link block text-gray-400 hover:text-white">
                Integrations
              </Link>
              <Link href="/api" className="footer-link block text-gray-400 hover:text-white">
                API
              </Link>
              <Link href="/pricing" className="footer-link block text-gray-400 hover:text-white">
                Pricing
              </Link>
            </nav>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-6">Company</h4>
            <nav className="space-y-4">
              <Link href="/about" className="footer-link block text-gray-400 hover:text-white">
                About
              </Link>
              <Link href="/customers" className="footer-link block text-gray-400 hover:text-white">
                Customers
              </Link>
              <Link href="/careers" className="footer-link block text-gray-400 hover:text-white">
                Careers
              </Link>
              <Link href="/blog" className="footer-link block text-gray-400 hover:text-white">
                Blog
              </Link>
              <Link href="/contact" className="footer-link block text-gray-400 hover:text-white">
                Contact
              </Link>
            </nav>
          </div>

          {/* Resources & Legal */}
          <div>
            <h4 className="text-white font-semibold mb-6">Resources</h4>
            <nav className="space-y-4">
              <Link href="/resources" className="footer-link block text-gray-400 hover:text-white">
                Documentation
              </Link>
              <Link href="/guides" className="footer-link block text-gray-400 hover:text-white">
                Guides
              </Link>
              <Link href="/case-studies" className="footer-link block text-gray-400 hover:text-white">
                Case Studies
              </Link>
              <Link href="/support" className="footer-link block text-gray-400 hover:text-white">
                Support
              </Link>
              <Link href="/status" className="footer-link block text-gray-400 hover:text-white">
                Status
              </Link>
            </nav>

            <h4 className="text-white font-semibold mb-4 mt-8">Legal</h4>
            <nav className="space-y-3">
              <Link href="/privacy" className="footer-link block text-gray-400 hover:text-white text-sm">
                Privacy Policy
              </Link>
              <Link href="/terms" className="footer-link block text-gray-400 hover:text-white text-sm">
                Terms of Service
              </Link>
              <Link href="/security" className="footer-link block text-gray-400 hover:text-white text-sm">
                Security
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-12 mt-12 border-t border-[#1a1a1a]">
          <div className="flex items-center gap-6 mb-4 md:mb-0">
            <p className="text-gray-500 text-sm">
              © 2024 Split. All rights reserved.
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500">All systems operational</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link 
              href="/signup"
              className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white px-4 py-2 text-sm font-medium border border-[#333333] hover:border-[#444444] transition-all duration-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
} 