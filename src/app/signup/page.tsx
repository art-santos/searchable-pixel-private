'use client'

import { useEffect } from 'react'
import { redirect } from 'next/navigation'
import { SignupForm } from '@/components/auth/signup-form'
import Image from 'next/image'
import Link from 'next/link'

export default function SignupPage() {
  // WAITLIST DISABLED - Always show signup form

  // Render the actual signup form when waitlist is disabled
  return (
    <div className="flex min-h-svh items-center justify-center bg-[#0c0c0c] text-white">
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
      
      <div className="flex flex-col gap-4 p-6 md:p-10 w-full max-w-md">
        <div className="flex justify-center">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <Image src="/images/split-icon-white.svg" width={36} height={36} alt="Split Logo" />
          </Link>
        </div>
        <div className="w-full">
          <SignupForm />
        </div>
      </div>
      
    </div>
  )
} 