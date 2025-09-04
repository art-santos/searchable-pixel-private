'use client'

import { LoginForm } from "@/components/auth/login-form"
import Image from "next/image"
import Link from "next/link"
import { Suspense } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  return (
     <div className="flex items-center justify-center min-h-svh bg-[#0c0c0c] text-white">
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
      
      <div className="w-full max-w-xs">
        <div className="flex justify-center mb-4">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <Image src="/images/split-icon-white.svg" width={36} height={36} alt="Split Logo" />
          </Link>
        </div>
        <Suspense fallback={<div className="text-white">Loading...</div>}>
          <LoginForm onLoginSuccess={() => {
            // Refresh the router to ensure auth state is updated
            router.refresh()
          }} />
        </Suspense>
      </div>
    </div>
  )
}
