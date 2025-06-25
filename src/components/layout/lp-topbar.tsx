'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { useEffect, useState } from 'react'

export function LPTopBar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setIsScrolled(scrollTop > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToHowItWorks = () => {
    // Find the "How It Works" section and scroll to it
    const howItWorksSection = document.querySelector('[data-section="how-it-works"]')
    if (howItWorksSection) {
      howItWorksSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
    }
    setIsMobileMenuOpen(false) // Close menu after navigation
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      <div className={`fixed top-0 left-0 right-0 z-50 flex h-16 md:h-16 items-center justify-center transition-all duration-300 ${
        isScrolled || isMobileMenuOpen
          ? 'bg-white' 
          : 'bg-transparent'
      }`}>
      <style jsx global>{`
        .logo-rotate {
          transition: transform 0.5s ease-out;
          transform-style: preserve-3d;
          perspective: 1000px;
        }
        .logo-container:hover .logo-rotate {
          transform: rotateY(180deg);
        }
        .nav-link {
          position: relative;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          width: 100%;
          height: 1px;
          bottom: -2px;
          left: 0;
          background-color: #191919;
          transform: scaleX(0);
          transform-origin: right;
          transition: transform 0.3s ease-out;
        }
        .nav-link:hover::after {
          transform: scaleX(1);
          transform-origin: left;
        }
        .auth-button-ghost {
          transition: all 0.2s ease-out;
        }
        .auth-button-ghost:hover {
          transform: translateY(-1px);
        }
        .auth-button-primary {
          transition: all 0.3s ease-out;
          transform-style: preserve-3d;
          perspective: 1000px;
        }
        .auth-button-primary:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 5px 15px rgba(25, 25, 25, 0.2);
        }
      `}</style>

      <div className="w-[92%] md:w-[80%] max-w-7xl flex items-center mx-6 md:mx-auto">
        {/* Left: Logo */}
        <div className="flex-1">
          <Link href="/" className="logo-container flex items-center">
            <Image 
              src="/images/split-icon-black.svg" 
              alt="Split" 
              width={28} 
              height={28} 
              className="logo-rotate text-[#191919] md:w-8 md:h-8" 
            />
          </Link>
        </div>

        {/* Middle: Navigation - Centered */}
        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <button 
              onClick={scrollToHowItWorks}
              className="nav-link text-sm text-gray-600 hover:text-[#191919] transition-colors cursor-pointer"
          >
            Product
            </button>
          <Link 
            href="/customers" 
            className="nav-link text-sm text-gray-600 hover:text-[#191919] transition-colors"
          >
            Customers
          </Link>
          <Link 
            href="/resources" 
            className="nav-link text-sm text-gray-600 hover:text-[#191919] transition-colors"
          >
            Resources
          </Link>
        </nav>

          {/* Right: Mobile Menu + Auth Buttons */}
        <div className="flex-1 flex items-center justify-end gap-2 md:gap-4">
            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-[#191919] transition-colors"
              aria-label="Toggle mobile menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

          <Link href="/login">
            <Button 
              variant="ghost" 
              className="auth-button-ghost text-gray-600 hover:text-[#191919] hover:bg-gray-100 hidden md:inline-flex"
            >
              Sign in
            </Button>
          </Link>
          <Link href="/waitlist">
            <Button 
              className="auth-button-primary bg-[#191919] text-white border border-[#191919] hover:bg-[#333333] hover:border-[#333333] text-sm md:text-base px-3 py-1.5 md:px-4 md:py-2"
            >
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </div>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ease-out ${
        isMobileMenuOpen 
          ? 'opacity-100 pointer-events-auto' 
          : 'opacity-0 pointer-events-none'
      }`}>
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ease-out ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={closeMobileMenu}
        ></div>
        
        {/* Menu Panel */}
        <div className={`absolute top-16 left-0 right-0 bg-white border-b border-gray-200 transition-all duration-300 ease-out ${
          isMobileMenuOpen 
            ? 'transform translate-y-0 opacity-100' 
            : 'transform -translate-y-4 opacity-0'
        }`}>
          <nav className="px-6 py-4 space-y-4">
            {/* Staggered animation for menu items */}
            <button 
              onClick={scrollToHowItWorks}
              className={`block w-full text-left text-gray-600 hover:text-[#191919] transition-all duration-200 ease-out py-2 text-base hover:transform hover:translate-x-1 ${
                isMobileMenuOpen ? 'transform translate-y-0 opacity-100' : 'transform translate-y-2 opacity-0'
              }`}
              style={{ transitionDelay: isMobileMenuOpen ? '100ms' : '0ms' }}
            >
              Product
            </button>
            <Link 
              href="/customers" 
              onClick={closeMobileMenu}
              className={`block text-gray-600 hover:text-[#191919] transition-all duration-200 ease-out py-2 text-base hover:transform hover:translate-x-1 ${
                isMobileMenuOpen ? 'transform translate-y-0 opacity-100' : 'transform translate-y-2 opacity-0'
              }`}
              style={{ transitionDelay: isMobileMenuOpen ? '150ms' : '0ms' }}
            >
              Customers
            </Link>
            <Link 
              href="/resources" 
              onClick={closeMobileMenu}
              className={`block text-gray-600 hover:text-[#191919] transition-all duration-200 ease-out py-2 text-base hover:transform hover:translate-x-1 ${
                isMobileMenuOpen ? 'transform translate-y-0 opacity-100' : 'transform translate-y-2 opacity-0'
              }`}
              style={{ transitionDelay: isMobileMenuOpen ? '200ms' : '0ms' }}
            >
              Resources
            </Link>
            <Link 
              href="/case-studies/origami" 
              onClick={closeMobileMenu}
              className={`block text-gray-600 hover:text-[#191919] transition-all duration-200 ease-out py-2 text-base hover:transform hover:translate-x-1 ${
                isMobileMenuOpen ? 'transform translate-y-0 opacity-100' : 'transform translate-y-2 opacity-0'
              }`}
              style={{ transitionDelay: isMobileMenuOpen ? '250ms' : '0ms' }}
            >
              Case Studies
            </Link>
            
            {/* Mobile Auth Links */}
            <div className={`pt-4 border-t border-gray-200 space-y-3 transition-all duration-200 ease-out ${
              isMobileMenuOpen ? 'transform translate-y-0 opacity-100' : 'transform translate-y-2 opacity-0'
            }`}
            style={{ transitionDelay: isMobileMenuOpen ? '300ms' : '0ms' }}
            >
              <Link 
                href="/login" 
                onClick={closeMobileMenu}
                className="block text-gray-600 hover:text-[#191919] transition-all duration-200 ease-out py-2 text-base hover:transform hover:translate-x-1"
              >
                Sign in
              </Link>
              <Link 
                href="/waitlist" 
                onClick={closeMobileMenu}
                className="block bg-[#191919] hover:bg-[#333333] border border-[#191919] hover:border-[#333333] px-4 py-3 text-white text-center transition-all duration-200 ease-out hover:transform hover:scale-105"
              >
                Get Started
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </>
  )
} 