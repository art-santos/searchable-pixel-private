'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from "@/components/ui/button"

export function LPTopBar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex h-16 md:h-16 items-center justify-center bg-transparent">
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
          background-color: white;
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
          box-shadow: 0 5px 15px rgba(47, 47, 47, 0.2);
        }
      `}</style>

      <div className="w-[92%] md:w-[80%] max-w-7xl flex items-center mx-6 md:mx-auto">
        {/* Left: Logo */}
        <div className="flex-1">
          <Link href="/" className="logo-container flex items-center">
            <Image 
              src="/images/split-icon.svg" 
              alt="Split" 
              width={28} 
              height={28} 
              className="logo-rotate text-white md:w-8 md:h-8" 
            />
          </Link>
        </div>

        {/* Middle: Navigation - Centered */}
        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          <Link 
            href="/product" 
            className="nav-link text-sm text-gray-300 hover:text-white transition-colors"
          >
            Product
          </Link>
          <Link 
            href="/customers" 
            className="nav-link text-sm text-gray-300 hover:text-white transition-colors"
          >
            Customers
          </Link>
          <Link 
            href="/resources" 
            className="nav-link text-sm text-gray-300 hover:text-white transition-colors"
          >
            Resources
          </Link>
        </nav>

        {/* Right: Auth Buttons */}
        <div className="flex-1 flex items-center justify-end gap-2 md:gap-4">
          <Link href="/login">
            <Button 
              variant="ghost" 
              className="auth-button-ghost text-gray-300 hover:text-white hover:bg-white/10 hidden md:inline-flex"
            >
              Sign in
            </Button>
          </Link>
          <Link href="/signup">
            <Button 
              className="auth-button-primary bg-[#0c0c0c]/80 text-white border border-[#2f2f2f] hover:bg-[#0c0c0c]/90 hover:border-[#3f3f3f] text-sm md:text-base px-3 py-1.5 md:px-4 md:py-2"
            >
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
} 