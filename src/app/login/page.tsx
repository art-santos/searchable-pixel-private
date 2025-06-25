'use client'

import { LoginForm } from "@/components/auth/login-form"
import Image from "next/image"
import Link from "next/link"
import { Suspense } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* JSON-LD Schema for Login Page */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebPage",
                "@id": "https://split.dev/login#webpage",
                "url": "https://split.dev/login",
                "name": "Login to Split | AI Crawler Tracking Platform",
                "description": "Access your Split dashboard to monitor AI crawler visits, track lead attribution, and optimize your AI search visibility.",
                "isPartOf": {
                  "@type": "WebSite",
                  "url": "https://split.dev",
                  "name": "Split"
                },
                "significantLink": "https://split.dev/login",
                "about": {
                  "@type": "SoftwareApplication",
                  "name": "Split Dashboard",
                  "description": "AI-powered platform for tracking crawler visits and lead attribution"
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
                    "name": "Login",
                    "item": "https://split.dev/login"
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
            <Suspense fallback={<div className="text-white">Loading...</div>}>
              <LoginForm onLoginSuccess={() => {
                // Refresh the router to ensure auth state is updated
                router.refresh()
              }} />
            </Suspense>
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
