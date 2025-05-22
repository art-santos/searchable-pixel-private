import type { Metadata } from "next";
import "@/fonts/cal-sans.css"; // Changed the import to use a local CSS file
import "./globals.css";
// import Announcements from "@/components/announcements"; // Removed import again
import { AuthProvider } from "@/contexts/AuthContext"; // Import the AuthProvider
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
// Removed inter import
// Remove Footer import - it's handled in the (main) layout

export const metadata: Metadata = {
  title: "Split | Agentic AEO for LLM Visibility",
  description: "Split helps you automate your LLM site visibility through intelligent content structuring, generation, and optimization tailored for AI understanding.",
  metadataBase: new URL('https://www.split.dev'),
  keywords: ['agentic SEO', 'AEO', 'LLM visibility', 'content generation', 'AI-friendly content', 'semantic structuring', 'automated optimization'],
  authors: [{ name: 'Split' }],
  creator: 'Split',
  publisher: 'Split',
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/favicon.svg', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
    other: {
      rel: 'mask-icon',
      url: '/favicon.svg',
      color: '#6366F1',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.split.dev',
    title: 'Split | Agentic AEO for LLM Visibility',
    description: 'Automate your content strategy for LLM visibility with Split\'s agentic approach. Build structured, semantically-rich content that AI can understand and surface.',
    siteName: 'Split',
    images: [{
      url: '/opengraph-image.png',
      width: 1200,
      height: 630,
      alt: 'Split - Agentic AEO Platform',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Split | Agentic AEO for LLM Visibility',
    description: 'Automate your content strategy for LLM visibility with Split\'s agentic approach. Build structured, semantically-rich content that AI can understand and surface.',
    images: ['/twitter-image.png'],
    creator: '@Split.dev',
    site: '@Split.dev',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: '#6366F1',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link 
          href="https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,400&display=swap" 
          rel="stylesheet"
        />
        <link 
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@0,400;0,600;1,400;1,600&display=swap" 
          rel="stylesheet"
        />
        {/* Add manifest link here if not using viewport export */}
        {/* <link rel="manifest" href="/manifest.json" /> */}
      </head>
      <body
        className={cn(
          "min-h-screen bg-[#0c0c0c] font-sans antialiased flex flex-col"
        )}
      >
        {/* <Announcements /> Removed component */}
        {/* Removed RB2BTracking and its Suspense wrapper */}
        {/* 
        <Suspense>
          <RB2BTracking />
        </Suspense> 
        */}
        {/* Wrap the main content with AuthProvider */}
        <AuthProvider>
          <TooltipProvider>
            {/* Removed LPTopbar - it's now handled in the (main) layout */}
            <main className="flex-grow">
              {children}
            </main>
            {/* Removed Footer - it's now handled in the (main) layout */}
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
