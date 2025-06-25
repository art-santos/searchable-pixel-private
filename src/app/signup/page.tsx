'use client'

import { useEffect } from 'react'
import { redirect } from 'next/navigation'
import { SignupForm } from '@/components/auth/signup-form'
import Image from 'next/image'
import Link from 'next/link'

export default function SignupPage() {
  useEffect(() => {
    // Only redirect to waitlist if it's enabled
    const waitlistEnabled = process.env.NEXT_PUBLIC_WAITLIST_ENABLED === 'true'
    if (waitlistEnabled) {
      redirect('/waitlist')
    }
  }, [])

  // If waitlist is disabled, show the signup form
  const waitlistEnabled = process.env.NEXT_PUBLIC_WAITLIST_ENABLED === 'true'
  
  if (waitlistEnabled) {
    // Show loading while redirecting
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-primary mx-auto" />
          <p className="mt-4 text-gray-400">Redirecting to waitlist...</p>
        </div>
      </div>
    )
  }

  // Render the actual signup form when waitlist is disabled
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* JSON-LD Schema for Signup Page */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebPage",
                "@id": "https://split.dev/signup#webpage",
                "url": "https://split.dev/signup",
                "name": "Sign Up for Split | Start AI Crawler Tracking",
                "description": "Create your Split account to start tracking AI crawler visits, monitoring AI citations, and converting AI traffic into qualified leads.",
                "isPartOf": {
                  "@type": "WebSite",
                  "url": "https://split.dev",
                  "name": "Split"
                },
                "significantLink": "https://split.dev/signup",
                "about": {
                  "@type": "SoftwareApplication",
                  "name": "Split",
                  "applicationCategory": "Business Intelligence Software",
                  "description": "AI-powered platform for tracking crawler visits and lead attribution"
                }
              },
              {
                "@type": "WebPageElement",
                "@id": "https://split.dev/signup#registration-form",
                "name": "Split Registration Form",
                "description": "Create your account to access AI crawler tracking and lead attribution features",
                "isPartOf": {
                  "@id": "https://split.dev/signup#webpage"
                }
              },
              {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": "https://split.dev"
                  },
                  {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Sign Up",
                    "item": "https://split.dev/signup"
                  }
                ]
              }
            ]
          })
        }}
      />
      
      <div className="flex flex-col gap-4 p-6 md:p-10 bg-[#0c0c0c] text-white">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <Image src="/images/split-icon-white.svg" width={36} height={36} alt="Split Logo" />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <SignupForm />
          </div>
        </div>
      </div>
      <div className="relative hidden lg:block bg-[#0c0c0c] overflow-hidden">
        <div className="absolute inset-0 pattern-grid opacity-10"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Image 
            src="/images/signup.png" 
            fill
            alt="Signup" 
            className="object-cover filter grayscale brightness-50"
            priority
          />
        </div>
        <div className="absolute bottom-8 left-0 right-0 text-center">
        </div>
      </div>

      <style jsx>{`
        .pattern-grid {
          background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 30px 30px;
        }
      `}</style>
    </div>
  )
} 