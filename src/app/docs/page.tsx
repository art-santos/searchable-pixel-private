'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Copy, 
  CheckCircle2, 
  ExternalLink, 
  Terminal, 
  FileText, 
  Code2, 
  Package, 
  Zap, 
  Shield, 
  BookOpen,
  ArrowRight,
  ChevronRight,
  Github,
  Star,
  Download,
  Users,
  Activity,
  Settings,
  Target
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import DocsFooter from '@/components/layout/docs-footer'
import { DocsSearchBar } from '@/components/docs-search-bar'

type PackageManager = 'npm' | 'pnpm' | 'yarn'

const packageManagers = {
  npm: { name: 'npm', command: 'npm install' },
  pnpm: { name: 'pnpm', command: 'pnpm add' },
  yarn: { name: 'yarn', command: 'yarn add' }
}

const sections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Quick setup guide for Split Analytics',
    icon: Zap,
    articles: [
      { title: 'Installation', href: '#installation', description: 'Install the Split Analytics package' },
      { title: 'Configuration', href: '#configuration', description: 'Set up your API key and basic config' },
      { title: 'WordPress Plugin', href: '#wordpress-plugin', description: 'WordPress plugin installation guide' },
      { title: 'Tracking Pixel', href: '#tracking-pixel', description: 'Universal HTML pixel for Framer, Webflow & more' },
      { title: 'Platform Guides', href: '#configuration', description: 'Next.js, Node.js, WordPress, and Tracking Pixel setup' }
    ]
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    description: 'Complete API documentation',
    icon: BookOpen,
    articles: [
      { title: 'trackCrawlerVisit()', href: '#js-api', description: 'Main tracking function' },
      
      { title: 'Utility Functions', href: '#js-api-utils', description: 'Helper functions like ping()' }
    ]
  },
  {
    id: 'crawlers-troubleshooting',
    title: 'Crawlers & Help',
    description: 'Supported crawlers and troubleshooting',
    icon: Activity,
    articles: [
      { title: 'Supported Crawlers', href: '#supported-crawlers', description: '25+ AI crawlers detected' },
      { title: 'Troubleshooting', href: '#troubleshooting', description: 'Common issues and solutions' }
    ]
  }
]

export default function DocsPage() {
  const [selectedPackageManager, setSelectedPackageManager] = useState<PackageManager>('npm')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<'nextjs' | 'nodejs' | 'wordpress' | 'tracking-pixel'>('nextjs')

  const handleSearchNavigate = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(text)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const downloadWordPressPlugin = () => {
    try {
      // Create a temporary anchor element
      const link = document.createElement('a')
      link.href = '/wp-plugin/split-analytics.zip'
      link.download = 'split-analytics.zip'
      link.style.display = 'none'
      
      // Add to DOM, click, and remove
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Show success feedback
      console.log('✅ WordPress plugin download started')
      
      // Optional: Show user feedback (you can add a toast notification here)
      if (typeof window !== 'undefined') {
        // Simple alert for now - you can replace with a proper toast notification
        setTimeout(() => {
          console.log('📦 Split Analytics WordPress plugin should be downloading...')
        }, 100)
      }
    } catch (error) {
      console.error('❌ Failed to download WordPress plugin:', error)
      // Fallback: open in new tab
      try {
        window.open('/wp-plugin/split-analytics.zip', '_blank')
        console.log('🔄 Opened download in new tab as fallback')
      } catch (fallbackError) {
        console.error('❌ Fallback download also failed:', fallbackError)
        alert('Download failed. Please try again or contact support.')
      }
    }
  }

  const getInstallCommand = () => {
    return `${packageManagers[selectedPackageManager].command} @split.dev/analytics`
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0c0c0c] scroll-smooth">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200/60 dark:border-[#1a1a1a] bg-white/80 dark:bg-[#0c0c0c]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/images/split-icon-black.svg"
                alt="Split Logo"
                width={32}
                height={32}
                className="h-8 w-8 dark:hidden"
              />
              <Image
                src="/images/split-icon-white.svg"
                alt="Split Logo"
                width={32}
                height={32}
                className="h-8 w-8 hidden dark:block"
              />
              <div>
                <span className="text-xl font-semibold text-gray-900 dark:text-white">Split</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">Docs</span>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                href="/dashboard" 
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link 
                href="/dashboard" 
                className="inline-flex"
              >
                <Button size="sm" className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100">
                  Get Started
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 p-6 border-r border-gray-200/60 dark:border-[#1a1a1a] min-h-screen">
          <div className="sticky top-24">
            <div className="mb-6">
              <div className="border border-gray-200 dark:border-[#1a1a1a] rounded-lg bg-white dark:bg-[#111] px-2 py-1.5">
                <DocsSearchBar onNavigate={handleSearchNavigate} />
              </div>
            </div>

            <nav className="space-y-6">
              {sections.map((section) => (
                <div key={section.id}>
                  <div className="w-full flex items-center gap-2 text-left text-sm font-medium text-gray-900 dark:text-white mb-2">
                    <section.icon className="w-4 h-4" />
                    {section.title}
                  </div>
                  <ul className="space-y-1 ml-6">
                    {section.articles.map((article) => (
                      <li key={article.href}>
                        <a
                          href={article.href}
                          className="block text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors py-1"
                        >
                          {article.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          {/* Hero Section */}
          <div className="mb-12">
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Split Analytics Documentation
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl">
                Simple AI crawler tracking for any website. Zero dependencies, lightweight, reliable.
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mb-8">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Download className="w-4 h-4" />
                <span>500+ downloads</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Star className="w-4 h-4" />
                <span>MIT License</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Users className="w-4 h-4" />
                <span>50+ websites</span>
              </div>
            </div>

            {/* Quick Start */}
            <div className="bg-gray-50/50 dark:bg-[#111]/50 rounded-xl border border-gray-200/60 dark:border-[#1a1a1a] p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Start</h2>
              
              {/* Package Manager Selection */}
              <div className="mb-4">
                <div className="flex gap-2 mb-3">
                  {(Object.entries(packageManagers) as [PackageManager, typeof packageManagers[PackageManager]][]).map(([key, pm]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedPackageManager(key)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${
                        selectedPackageManager === key
                          ? 'bg-gray-900 dark:bg-white text-white dark:text-black border-gray-900 dark:border-white'
                          : 'bg-white dark:bg-[#111] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                      }`}
                    >
                      {pm.name}
                    </button>
                  ))}
                </div>

                {/* Install Command */}
                <div className="bg-gray-900 dark:bg-black rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 border-b border-gray-700">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Terminal className="w-4 h-4" />
                      <span className="text-sm font-mono">Terminal</span>
                    </div>
                    <Button
                      onClick={() => copyToClipboard(getInstallCommand())}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                    >
                      {copiedCode === getInstallCommand() ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <pre className="px-4 py-3 text-sm text-gray-100 overflow-x-auto">
                    <code>{getInstallCommand()}</code>
                  </pre>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a href="#installation" className="inline-flex">
                  <Button size="sm" className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </a>
              </div>
            </div>
          </div>

          {/* Sections Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {sections.map((section) => (
              <div
                key={section.id}
                className="bg-white dark:bg-[#111] rounded-xl border border-gray-200/60 dark:border-[#1a1a1a] p-6 hover:shadow-lg dark:hover:shadow-2xl transition-all duration-200 group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg flex items-center justify-center group-hover:bg-gray-900 dark:group-hover:bg-white transition-colors">
                    <section.icon className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-white dark:group-hover:text-black transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{section.title}</h3>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{section.description}</p>
                <div className="space-y-2">
                  {section.articles.slice(0, 3).map((article) => (
                    <a
                      key={article.href}
                      href={article.href}
                      className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors py-1 group/link"
                    >
                      <span>{article.title}</span>
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Installation Section */}
          <section id="installation" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Installation</h2>
            
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                Split Analytics is available as an npm package and can be installed using any package manager.
              </p>

              <div className="bg-gray-50 dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#1a1a1a] p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Package Requirements</h3>
                <ul className="space-y-2 text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Node.js 16.0.0 or higher
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Zero dependencies
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    TypeScript support included
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Works with all major frameworks
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Configuration Section */}
          <section id="configuration" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Configuration</h2>
            
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800/40 p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>WordPress users:</strong> Looking for an easy setup? Check out our <a href="#wordpress-plugin" className="underline hover:no-underline">WordPress Plugin</a> - no coding required!
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Environment Variables</h3>
                <div className="bg-gray-900 dark:bg-black rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 border-b border-gray-700">
                    <div className="flex items-center gap-2 text-gray-400">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm font-mono">.env.local</span>
                    </div>
                    <Button
                      onClick={() => copyToClipboard('SPLIT_API_KEY=split_live_your_key_here')}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                    >
                      {copiedCode === 'SPLIT_API_KEY=split_live_your_key_here' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <pre className="px-4 py-3 text-sm text-gray-100">
                    <code>SPLIT_API_KEY=split_live_your_key_here</code>
                  </pre>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Get your API key from the Split dashboard under Settings → API Keys. Keys start with <code className="text-xs bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded">split_live_</code> for production or <code className="text-xs bg-gray-200 dark:bg-gray-800 px-1 py-0.5 rounded">split_test_</code> for development.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Setup</h3>
                
                {/* Platform Tabs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setSelectedPlatform('nextjs')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      selectedPlatform === 'nextjs'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Next.js
                  </button>
                  <button
                    onClick={() => setSelectedPlatform('nodejs')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      selectedPlatform === 'nodejs'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Node.js/Express
                  </button>
                  <button
                    onClick={() => setSelectedPlatform('wordpress')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      selectedPlatform === 'wordpress'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    WordPress
                  </button>
                  <button
                    onClick={() => setSelectedPlatform('tracking-pixel')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                      selectedPlatform === 'tracking-pixel'
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>Tracking Pixel</span>
                      <span className="px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                        Beta
                      </span>
                    </div>
                  </button>
                </div>

                {/* Next.js Tab Content */}
                {selectedPlatform === 'nextjs' && (
                  <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">
                      Complete setup guide for Next.js middleware with proper configuration.
                    </p>
                    
                    <div className="bg-gray-900 dark:bg-black rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 border-b border-gray-700">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Code2 className="w-4 h-4" />
                          <span className="text-sm font-mono">middleware.ts</span>
                        </div>
                        <Button
                          onClick={() => copyToClipboard(`import { createSplitMiddleware } from '@split.dev/analytics/middleware'

export const middleware = createSplitMiddleware({
  apiKey: process.env.SPLIT_API_KEY!,
  debug: process.env.NODE_ENV === 'development'
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}`)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <pre className="px-4 py-3 text-sm text-gray-100 overflow-x-auto">
                        <code>{`import { createSplitMiddleware } from '@split.dev/analytics/middleware'

export const middleware = createSplitMiddleware({
  apiKey: process.env.SPLIT_API_KEY!,
  debug: process.env.NODE_ENV === 'development'
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}`}</code>
                      </pre>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Key Features:</h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• Automatic AI crawler detection (25+ crawlers)</li>
                        <li>• Non-blocking requests (won't slow your site)</li>
                        <li>• Batched for performance (5-second default)</li>
                        <li>• Excludes static files for efficiency</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Node.js Tab Content */}
                {selectedPlatform === 'nodejs' && (
                  <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">
                      Add AI crawler tracking to your Express.js application with proper error handling.
                    </p>
                    
                    <div className="bg-gray-900 dark:bg-black rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 border-b border-gray-700">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Code2 className="w-4 h-4" />
                          <span className="text-sm font-mono">server.js</span>
                        </div>
                        <Button
                          onClick={() => copyToClipboard(`const express = require('express')
const { trackCrawlerVisit } = require('@split.dev/analytics')

const app = express()

app.use(async (req, res, next) => {
  // Track crawler visits (non-blocking)
  if (process.env.SPLIT_API_KEY) {
    trackCrawlerVisit({
      url: req.url,
      userAgent: req.headers['user-agent'],
      method: req.method
    }, {
      apiKey: process.env.SPLIT_API_KEY,
      debug: process.env.NODE_ENV === 'development'
    }).catch((error) => {
      console.error('Split Analytics error:', error)
    })
  }
  
  next()
})

app.listen(3000, () => {
  console.log('Server running on port 3000')
})`)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <pre className="px-4 py-3 text-sm text-gray-100 overflow-x-auto">
                        <code>{`const express = require('express')
const { trackCrawlerVisit } = require('@split.dev/analytics')

const app = express()

app.use(async (req, res, next) => {
  // Track crawler visits (non-blocking)
  if (process.env.SPLIT_API_KEY) {
    trackCrawlerVisit({
      url: req.url,
      userAgent: req.headers['user-agent'],
      method: req.method
    }, {
      apiKey: process.env.SPLIT_API_KEY,
      debug: process.env.NODE_ENV === 'development'
    }).catch((error) => {
      console.error('Split Analytics error:', error)
    })
  }
  
  next()
})

app.listen(3000, () => {
  console.log('Server running on port 3000')
})`}</code>
                      </pre>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Key Features:</h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• Works with any Express.js application</li>
                        <li>• Automatic AI crawler detection (25+ crawlers)</li>
                        <li>• Non-blocking requests (won't slow your server)</li>
                        <li>• Built-in error handling and retry logic</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* WordPress Tab Content */}
                {selectedPlatform === 'wordpress' && (
                  <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">
                      Install the Split Analytics WordPress plugin to automatically track AI crawler visits on your WordPress site.
                    </p>
                    
                    <div className="bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Installation Steps</h4>
                      <ol className="space-y-3">
                        <li className="flex gap-3">
                          <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">1.</span>
                          <div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">Download the Split Analytics plugin:</p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="mt-2"
                              onClick={downloadWordPressPlugin}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download Plugin (.zip)
                            </Button>
                          </div>
                        </li>
                        <li className="flex gap-3">
                          <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">2.</span>
                          <div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">Install the plugin in your WordPress admin:</p>
                            <div className="bg-gray-900 dark:bg-black rounded-md p-3 mt-2">
                              <code className="text-sm text-gray-100">
                                WordPress Admin → Plugins → Add New → Upload Plugin
                              </code>
                            </div>
                          </div>
                        </li>
                        <li className="flex gap-3">
                          <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">3.</span>
                          <div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">Activate and configure your API key:</p>
                            <div className="bg-gray-900 dark:bg-black rounded-md p-3 mt-2">
                              <code className="text-sm text-gray-100">
                                Settings → Split Analytics → Enter API Key
                              </code>
                            </div>
                          </div>
                        </li>
                        <li className="flex gap-3">
                          <span className="text-gray-500 dark:text-gray-400 flex-shrink-0">4.</span>
                          <div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">Save settings and you're done!</p>
                          </div>
                        </li>
                      </ol>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Key Features:</h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• No coding required - simple plugin installation</li>
                        <li>• Automatic AI crawler detection (25+ crawlers)</li>
                        <li>• Lightweight and optimized for WordPress</li>
                        <li>• Works with any WordPress theme or hosting</li>
                        <li>• Respects WordPress performance best practices</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Tracking Pixel Tab Content */}
                {selectedPlatform === 'tracking-pixel' && (
                  <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-400">
                      Universal HTML tracking pixel that works with any website platform. Perfect for Framer, Webflow, and custom sites.
                    </p>
                    
                    <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800/40 p-4">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Beta Feature</h4>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        This tracking pixel is currently in beta. It provides reliable AI crawler detection but may receive updates and improvements.
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#1a1a1a] rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Quick Setup</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">1. Get Your Tracking Code</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Get your workspace-specific tracking pixel from your Split Dashboard:
                          </p>
                          <div className="bg-gray-900 dark:bg-black rounded-lg p-3">
                            <code className="text-sm text-gray-100">
                              Dashboard → Settings → Tracking Pixel → Copy Code
                            </code>
                          </div>
                        </div>

                        <div>
                          <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">2. Add to Your Website</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Your tracking code will look like this:
                          </p>
                          <div className="bg-gray-900 dark:bg-black rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 border-b border-gray-700">
                              <div className="flex items-center gap-2 text-gray-400">
                                <Code2 className="w-4 h-4" />
                                <span className="text-sm font-mono">HTML</span>
                              </div>
                              <Button
                                onClick={() => copyToClipboard(`<img src="https://split.dev/api/track/YOUR_WORKSPACE_ID/pixel.gif" style="display:none" width="1" height="1" alt="" />`)}
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                            <pre className="px-4 py-3 text-sm text-gray-100 overflow-x-auto">
                              <code>{`<img src="https://split.dev/api/track/YOUR_WORKSPACE_ID/pixel.gif" 
     style="display:none" 
     width="1" 
     height="1" 
     alt="" />`}</code>
                            </pre>
                          </div>
                        </div>

                        <div>
                          <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">3. Platform Instructions</h5>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Framer Card */}
                            <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                  <Image src="/images/framer.svg" alt="Framer" width={16} height={16} className="w-4 h-4" />
                                </div>
                                <div>
                                  <h6 className="font-semibold text-gray-900 dark:text-white">Framer</h6>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Site Settings → SEO & Meta</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-start gap-2">
                                  <span className="text-xs text-gray-400 mt-0.5">1.</span>
                                  <span className="text-xs text-gray-600 dark:text-gray-300">Go to Settings → SEO & Meta</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="text-xs text-gray-400 mt-0.5">2.</span>
                                  <span className="text-xs text-gray-600 dark:text-gray-300">Paste code in "Head" field</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="text-xs text-gray-400 mt-0.5">3.</span>
                                  <span className="text-xs text-gray-600 dark:text-gray-300">Publish your site</span>
                                </div>
                              </div>
                            </div>

                            {/* Webflow Card */}
                            <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#333] rounded-lg p-4">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                                  <Image src="/images/webflow.svg" alt="Webflow" width={16} height={16} className="w-4 h-4" />
                                </div>
                                <div>
                                  <h6 className="font-semibold text-gray-900 dark:text-white">Webflow</h6>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">Site Settings → Custom Code</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-start gap-2">
                                  <span className="text-xs text-gray-400 mt-0.5">1.</span>
                                  <span className="text-xs text-gray-600 dark:text-gray-300">Go to Site Settings</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="text-xs text-gray-400 mt-0.5">2.</span>
                                  <span className="text-xs text-gray-600 dark:text-gray-300">Navigate to Custom Code</span>
                                </div>
                                <div className="flex items-start gap-2">
                                  <span className="text-xs text-gray-400 mt-0.5">3.</span>
                                  <span className="text-xs text-gray-600 dark:text-gray-300">Paste in "Head Code" section</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">What Gets Tracked:</h4>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• <strong>AI Crawlers:</strong> GPTBot, ClaudeBot, PerplexityBot, and 20+ more</li>
                        <li>• <strong>Universal:</strong> Works with any website platform</li>
                        <li>• <strong>Lightweight:</strong> 1x1 invisible pixel (43 bytes)</li>
                        <li>• <strong>Fast:</strong> No JavaScript dependencies required</li>
                      </ul>
                    </div>
                  </div>
                )}
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                  That's it! AI crawler visits will appear in your Split Dashboard within 5-10 seconds.
                </p>
              </div>
            </div>
          </section>



          {/* WordPress Plugin Section */}
          <section id="wordpress-plugin" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">WordPress Plugin</h2>
            
            <div className="space-y-6">
              <div>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                  The Split Analytics WordPress plugin provides the easiest way to add AI crawler tracking to your WordPress site. No coding required.
                </p>

                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200/60 dark:border-[#1a1a1a] p-6 mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Plugin Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Zero coding required</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Automatic AI crawler detection (25+ crawlers)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Lightweight and optimized</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Works with any WordPress theme</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Compatible with all hosting providers</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Non-blocking tracking</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-[#111]/50 rounded-xl border border-gray-200/60 dark:border-[#1a1a1a] p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Installation Guide</h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-gray-900 dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                        1
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Download the Plugin</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Download the official Split Analytics WordPress plugin.
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={downloadWordPressPlugin}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Plugin (.zip)
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-gray-900 dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                        2
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Install in WordPress</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Upload and install the plugin through your WordPress admin panel.
                        </p>
                        <div className="bg-gray-900 dark:bg-black rounded-lg p-3">
                          <code className="text-sm text-gray-100">
                            WordPress Admin → Plugins → Add New → Upload Plugin → Choose File → Install Now
                          </code>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-gray-900 dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                        3
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Activate & Configure</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          Activate the plugin and enter your Split Analytics API key.
                        </p>
                        <div className="bg-gray-900 dark:bg-black rounded-lg p-3">
                          <code className="text-sm text-gray-100">
                            Plugins → Activate → Settings → Split Analytics → Enter API Key → Save
                          </code>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                        ✓
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">You're Done!</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          AI crawler visits will now be automatically tracked and appear in your Split Dashboard within 5-10 seconds.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800/40 p-6">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">WordPress Requirements</h4>
                      <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                        <li>• WordPress 5.0 or higher</li>
                        <li>• PHP 7.4 or higher</li>
                        <li>• HTTPS recommended (required for production)</li>
                        <li>• Valid Split Analytics API key</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Tracking Pixel Section */}
          <section id="tracking-pixel" className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Tracking Pixel
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                    Beta
                  </span>
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Universal HTML pixel tracking for Framer, Webflow & more
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                  The Split Analytics tracking pixel provides the easiest way to add AI crawler tracking to any website. Works with Framer, Webflow, and any HTML-based platform.
                </p>

                <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200/60 dark:border-[#1a1a1a] p-6 mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Pixel Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Universal HTML pixel (1x1 invisible)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">25+ AI crawler detection</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">AI-to-Human conversion tracking</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Works with any website platform</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">No JavaScript dependencies</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Fast & lightweight (43 bytes)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-[#111]/50 rounded-xl border border-gray-200/60 dark:border-[#1a1a1a] p-6">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Setup</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">1. Get Your Tracking Code</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Get your workspace-specific tracking pixel from your Split Dashboard:
                      </p>
                      <div className="bg-gray-900 dark:bg-black rounded-lg p-3">
                        <code className="text-sm text-gray-100">
                          Dashboard → Settings → Tracking Pixel → Copy Code
                        </code>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">2. Basic Tracking Code</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        Your tracking code will look like this:
                      </p>
                      <div className="bg-gray-900 dark:bg-black rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 border-b border-gray-700">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Code2 className="w-4 h-4" />
                            <span className="text-sm font-mono">HTML</span>
                          </div>
                          <Button
                            onClick={() => copyToClipboard(`<img src="https://split.dev/api/track/YOUR_WORKSPACE_ID/pixel.gif" style="display:none" width="1" height="1" alt="" />`)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <pre className="px-4 py-3 text-sm text-gray-100 overflow-x-auto">
                          <code>{`<img src="https://split.dev/api/track/YOUR_WORKSPACE_ID/pixel.gif" 
     style="display:none" 
     width="1" 
     height="1" 
     alt="" />`}</code>
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">3. Platform Integration</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Framer Card */}
                        <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                              <Image src="/images/framer.svg" alt="Framer" width={16} height={16} className="w-4 h-4" />
                            </div>
                            <div>
                              <h5 className="font-semibold text-gray-900 dark:text-white">Framer</h5>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Site Settings → SEO & Meta</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <span className="text-xs text-gray-400 mt-0.5">1.</span>
                              <span className="text-xs text-gray-600 dark:text-gray-300">Open your Framer project</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-xs text-gray-400 mt-0.5">2.</span>
                              <span className="text-xs text-gray-600 dark:text-gray-300">Go to Settings → SEO & Meta</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-xs text-gray-400 mt-0.5">3.</span>
                              <span className="text-xs text-gray-600 dark:text-gray-300">Paste code in "Head" field</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-xs text-gray-400 mt-0.5">4.</span>
                              <span className="text-xs text-gray-600 dark:text-gray-300">Publish your site</span>
                            </div>
                          </div>
                        </div>

                        {/* Webflow Card */}
                        <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#333] rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                              <Image src="/images/webflow.svg" alt="Webflow" width={16} height={16} className="w-4 h-4" />
                            </div>
                            <div>
                              <h5 className="font-semibold text-gray-900 dark:text-white">Webflow</h5>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Site Settings → Custom Code</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <span className="text-xs text-gray-400 mt-0.5">1.</span>
                              <span className="text-xs text-gray-600 dark:text-gray-300">Open your Webflow project</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-xs text-gray-400 mt-0.5">2.</span>
                              <span className="text-xs text-gray-600 dark:text-gray-300">Go to Site Settings</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-xs text-gray-400 mt-0.5">3.</span>
                              <span className="text-xs text-gray-600 dark:text-gray-300">Navigate to Custom Code</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-xs text-gray-400 mt-0.5">4.</span>
                              <span className="text-xs text-gray-600 dark:text-gray-300">Paste in "Head Code" section</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800/40 p-6">
                  <div className="flex items-start gap-3">
                    <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">What Gets Tracked</h4>
                      <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                        <li>• <strong>AI Crawlers:</strong> GPTBot, ClaudeBot, PerplexityBot, and 20+ more</li>
                        <li>• <strong>AI-to-Human Conversions:</strong> When ChatGPT users visit your site (🏆 Gold!)</li>
                        <li>• <strong>Universal Compatibility:</strong> Works with any website platform</li>
                        <li>• <strong>Lightweight:</strong> 1x1 invisible pixel (only 43 bytes)</li>
                        <li>• <strong>Fast Performance:</strong> No JavaScript dependencies required</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* API Reference */}
          <section id="js-api" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">API Reference</h2>
            
            <div className="space-y-8">
              {/* trackCrawlerVisit Function */}
              <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200/60 dark:border-[#1a1a1a] p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">trackCrawlerVisit()</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Main function for tracking AI crawler visits. Works with Next.js middleware and Express requests.
                </p>
                
                <div className="bg-gray-900 dark:bg-black rounded-lg overflow-hidden mb-4">
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 border-b border-gray-700">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Code2 className="w-4 h-4" />
                      <span className="text-sm font-mono">Next.js Usage</span>
                    </div>
                    <Button
                      onClick={() => copyToClipboard(`import { NextRequest, NextResponse } from 'next/server'
import { trackCrawlerVisit } from '@split.dev/analytics/middleware'

export async function middleware(request: NextRequest) {
  if (process.env.SPLIT_API_KEY) {
    trackCrawlerVisit(request, {
      apiKey: process.env.SPLIT_API_KEY,
      debug: process.env.NODE_ENV === 'development'
    }).then((wasTracked) => {
      if (wasTracked && process.env.NODE_ENV === 'development') {
        console.log('✅ AI crawler tracked successfully')
      }
    }).catch((error) => {
      console.error('❌ Split Analytics error:', error)
    })
  }
  
  return NextResponse.next()
}`)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <pre className="px-4 py-3 text-sm text-gray-100 overflow-x-auto text-xs">
                    <code>{`import { NextRequest, NextResponse } from 'next/server'
import { trackCrawlerVisit } from '@split.dev/analytics/middleware'

export async function middleware(request: NextRequest) {
  if (process.env.SPLIT_API_KEY) {
    trackCrawlerVisit(request, {
      apiKey: process.env.SPLIT_API_KEY,
      debug: process.env.NODE_ENV === 'development'
    }).then((wasTracked) => {
      if (wasTracked && process.env.NODE_ENV === 'development') {
        console.log('✅ AI crawler tracked successfully')
      }
    }).catch((error) => {
      console.error('❌ Split Analytics error:', error)
    })
  }
  
  return NextResponse.next()
}`}</code>
                  </pre>
                </div>

                <div className="bg-gray-900 dark:bg-black rounded-lg overflow-hidden mb-4">
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 border-b border-gray-700">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Code2 className="w-4 h-4" />
                      <span className="text-sm font-mono">Express Usage</span>
                    </div>
                    <Button
                      onClick={() => copyToClipboard(`const express = require('express')
const { trackCrawlerVisit } = require('@split.dev/analytics')

const app = express()

app.use(async (req, res, next) => {
  if (process.env.SPLIT_API_KEY) {
    trackCrawlerVisit({
      url: req.url,
      userAgent: req.headers['user-agent'],
      method: req.method
    }, {
      apiKey: process.env.SPLIT_API_KEY,
      debug: process.env.NODE_ENV === 'development'
    }).catch(console.error)
  }
  
  next()
})`)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <pre className="px-4 py-3 text-sm text-gray-100 overflow-x-auto text-xs">
                    <code>{`const express = require('express')
const { trackCrawlerVisit } = require('@split.dev/analytics')

const app = express()

app.use(async (req, res, next) => {
  if (process.env.SPLIT_API_KEY) {
    trackCrawlerVisit({
      url: req.url,
      userAgent: req.headers['user-agent'],
      method: req.method
    }, {
      apiKey: process.env.SPLIT_API_KEY,
      debug: process.env.NODE_ENV === 'development'
    }).catch(console.error)
  }
  
  next()
})`}</code>
                  </pre>
                </div>
              </div>



              {/* Utility Functions */}
              <div id="js-api-utils" className="bg-white dark:bg-[#111] rounded-xl border border-gray-200/60 dark:border-[#1a1a1a] p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Utility Functions</h3>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-lg p-4">
                    <h5 className="font-mono text-sm text-gray-900 dark:text-white mb-2">ping()</h5>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Test your API connection and validate your API key.
                    </p>
                    
                    <div className="bg-gray-900 dark:bg-black rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 border-b border-gray-700">
                        <span className="text-sm font-mono text-gray-400">Usage</span>
                        <Button
                          onClick={() => copyToClipboard(`import { ping } from '@split.dev/analytics'

const result = await ping({
  apiKey: process.env.SPLIT_API_KEY,
  debug: true
})

console.log('Connection:', result.status) // 'ok' or 'error'`)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <pre className="px-4 py-3 text-sm text-gray-100 overflow-x-auto">
                        <code>{`import { ping } from '@split.dev/analytics'

const result = await ping({
  apiKey: process.env.SPLIT_API_KEY,
  debug: true
})

console.log('Connection:', result.status) // 'ok' or 'error'`}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Supported Crawlers */}
          <section id="supported-crawlers" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Supported AI Crawlers</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              The package automatically detects 25+ AI crawlers from major companies:
            </p>
            
            <div className="grid grid-cols-1 gap-6 mb-8">
              {/* OpenAI */}
              <div className="bg-white dark:bg-[#111] rounded-lg border border-gray-200/60 dark:border-[#1a1a1a] p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">OpenAI User Agents</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  OpenAI uses multiple user agents for different purposes across their services.
                </p>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-sm bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-1 rounded">GPTBot</code>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">Training</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <strong>Purpose:</strong> Crawling content for training OpenAI's generative AI foundation models
                    </p>
                    <div className="bg-gray-900 dark:bg-black rounded-md p-2">
                      <code className="text-xs text-gray-300 break-all">
                        Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot
                      </code>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      IP addresses: <a href="https://openai.com/gptbot.json" className="text-blue-600 dark:text-blue-400 underline">openai.com/gptbot.json</a>
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-sm bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-1 rounded">OAI-SearchBot</code>
                      <span className="text-xs bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 px-2 py-1 rounded">Search</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <strong>Purpose:</strong> Search functionality in ChatGPT's search features
                    </p>
                    <div className="bg-gray-900 dark:bg-black rounded-md p-2">
                      <code className="text-xs text-gray-300 break-all">
                        Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot
                      </code>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      IP addresses: <a href="https://openai.com/searchbot.json" className="text-blue-600 dark:text-blue-400 underline">openai.com/searchbot.json</a>
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-sm bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-1 rounded">ChatGPT-User</code>
                      <span className="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 px-2 py-1 rounded">User Request</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <strong>Purpose:</strong> When users ask ChatGPT or Custom GPT to visit a web page
                    </p>
                    <div className="bg-gray-900 dark:bg-black rounded-md p-2">
                      <code className="text-xs text-gray-300 break-all">
                        Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot
                      </code>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      IP addresses: <a href="https://openai.com/chatgpt-user.json" className="text-blue-600 dark:text-blue-400 underline">openai.com/chatgpt-user.json</a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Anthropic (Claude) */}
              <div className="bg-white dark:bg-[#111] rounded-lg border border-gray-200/60 dark:border-[#1a1a1a] p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Claude User Agents (Anthropic)</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Anthropic's Claude AI assistant uses this user agent for web browsing capabilities.
                </p>
                
                <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <code className="text-sm bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-1 rounded">Claude</code>
                    <span className="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 px-2 py-1 rounded">Web Browsing</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    <strong>Purpose:</strong> Primary user agent for Claude's web browsing capability
                  </p>
                  <div className="bg-gray-900 dark:bg-black rounded-md p-2">
                    <code className="text-xs text-gray-300 break-all">
                      Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude/1.0; https://claude.ai/)
                    </code>
                  </div>
                </div>
              </div>

              {/* Microsoft (Bing AI) */}
              <div className="bg-white dark:bg-[#111] rounded-lg border border-gray-200/60 dark:border-[#1a1a1a] p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Bing AI User Agents (Microsoft)</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Microsoft uses several user agents for Bing Search, Bing Chat, and related services.
                </p>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-sm bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-1 rounded">Bingbot</code>
                      <span className="text-xs bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300 px-2 py-1 rounded">Search & Chat</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <strong>Purpose:</strong> Standard crawler that powers Bing Search and Bing Chat (Microsoft Copilot)
                    </p>
                    <div className="bg-gray-900 dark:bg-black rounded-md p-2">
                      <code className="text-xs text-gray-300 break-all">
                        Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/W.X.Y.Z Safari/537.36
                      </code>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-sm bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-1 rounded">BingPreview</code>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">Preview</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <strong>Purpose:</strong> Generates page snapshots for Bing
                    </p>
                    <div className="bg-gray-900 dark:bg-black rounded-md p-2">
                      <code className="text-xs text-gray-300 break-all">
                        Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/W.X.Y.Z Safari/537.36
                      </code>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-sm bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-1 rounded">MicrosoftPreview</code>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">Preview</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <strong>Purpose:</strong> Generates page snapshots for Microsoft products
                    </p>
                    <div className="bg-gray-900 dark:bg-black rounded-md p-2">
                      <code className="text-xs text-gray-300 break-all">
                        Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; MicrosoftPreview/2.0; +https://aka.ms/MicrosoftPreview) Chrome/W.X.Y.Z Safari/537.36
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Perplexity */}
              <div className="bg-white dark:bg-[#111] rounded-lg border border-gray-200/60 dark:border-[#1a1a1a] p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Perplexity User Agents</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Perplexity AI uses different user agents for crawling and AI assistant interactions.
                </p>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-sm bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-1 rounded">PerplexityBot</code>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">Crawling</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <strong>Purpose:</strong> Primary user agent for crawling websites
                    </p>
                    <div className="bg-gray-900 dark:bg-black rounded-md p-2">
                      <code className="text-xs text-gray-300 break-all">
                        Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://www.perplexity.ai/bot)
                      </code>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-sm bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-1 rounded">Perplexity AI Assistant</code>
                      <span className="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 px-2 py-1 rounded">Assistant</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <strong>Purpose:</strong> Used when Perplexity's AI assistant browses the web in response to user queries
                    </p>
                    <div className="bg-gray-900 dark:bg-black rounded-md p-2">
                      <code className="text-xs text-gray-300 break-all">
                        Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Perplexity/1.0; +https://www.perplexity.ai)
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Meta (Llama) */}
              <div className="bg-white dark:bg-[#111] rounded-lg border border-gray-200/60 dark:border-[#1a1a1a] p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Llama User Agents (Meta)</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Meta's Llama AI uses these user agents for web browsing and crawling operations.
                </p>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-sm bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-1 rounded">Meta Llama</code>
                      <span className="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 px-2 py-1 rounded">Web Browsing</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <strong>Purpose:</strong> Primary user agent for web browsing
                    </p>
                    <div className="bg-gray-900 dark:bg-black rounded-md p-2">
                      <code className="text-xs text-gray-300 break-all">
                        Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Meta Llama/1.0; +https://ai.meta.com)
                      </code>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-sm bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-1 rounded">MetaAIBot</code>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">Crawling</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <strong>Purpose:</strong> Web crawling operations for Meta AI
                    </p>
                    <div className="bg-gray-900 dark:bg-black rounded-md p-2">
                      <code className="text-xs text-gray-300 break-all">
                        Mozilla/5.0 (compatible; MetaAIBot/1.0; +https://www.meta.com/ai/bot)
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deepseek */}
              <div className="bg-white dark:bg-[#111] rounded-lg border border-gray-200/60 dark:border-[#1a1a1a] p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Deepseek User Agents</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Deepseek AI uses these user agents for web browsing and crawling operations.
                </p>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-sm bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-1 rounded">Deepseek</code>
                      <span className="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 px-2 py-1 rounded">Web Browsing</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <strong>Purpose:</strong> Primary user agent for web browsing
                    </p>
                    <div className="bg-gray-900 dark:bg-black rounded-md p-2">
                      <code className="text-xs text-gray-300 break-all">
                        Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Deepseek/1.0; +https://www.deepseek.com)
                      </code>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-sm bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 px-2 py-1 rounded">DeepseekBot</code>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">Crawling</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <strong>Purpose:</strong> Web crawling operations
                    </p>
                    <div className="bg-gray-900 dark:bg-black rounded-md p-2">
                      <code className="text-xs text-gray-300 break-all">
                        Mozilla/5.0 (compatible; DeepseekBot/1.0; +https://www.deepseek.com/bot)
                      </code>
                    </div>
                  </div>
                </div>
              </div>


            </div>
          </section>

          {/* Troubleshooting */}
          <section id="troubleshooting" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Troubleshooting</h2>
            
            <div className="space-y-6">
              {/* API Key Issues */}
              <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200/60 dark:border-[#1a1a1a] p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">API Returns 401 Unauthorized</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  <strong>Cause:</strong> API key validation failing
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">1. Check your API key format:</h4>
                    <div className="bg-gray-900 dark:bg-black rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 border-b border-gray-700">
                        <span className="text-sm font-mono text-gray-400">Terminal</span>
                        <Button
                          onClick={() => copyToClipboard(`echo $SPLIT_API_KEY
# Should start with: split_live_ or split_test_`)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <pre className="px-4 py-3 text-sm text-gray-100">
                        <code>{`echo $SPLIT_API_KEY
# Should start with: split_live_ or split_test_`}</code>
                      </pre>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">2. Check for extra characters:</h4>
                    <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-lg p-4">
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>✅ <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">SPLIT_API_KEY=split_live_abc123</code> (Correct)</li>
                        <li>❌ <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">SPLIT_API_KEY="split_live_abc123"</code> (Has quotes)</li>
                        <li>❌ <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">SPLIT_API_KEY= split_live_abc123</code> (Has space)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* No Data Issues */}
              <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200/60 dark:border-[#1a1a1a] p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">No Crawler Visits Detected</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  <strong>Cause:</strong> Middleware not detecting AI crawlers
                </p>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Test with known crawler:</h4>
                  <div className="bg-gray-900 dark:bg-black rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 border-b border-gray-700">
                      <span className="text-sm font-mono text-gray-400">Terminal</span>
                      <Button
                        onClick={() => copyToClipboard(`# Simulate ChatGPT visit
curl -H "User-Agent: Mozilla/5.0 (compatible; ChatGPT-User/1.0; +https://openai.com/bot)" \\
     https://your-website.com`)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <pre className="px-4 py-3 text-sm text-gray-100 overflow-x-auto">
                      <code>{`# Simulate ChatGPT visit
curl -H "User-Agent: Mozilla/5.0 (compatible; ChatGPT-User/1.0; +https://openai.com/bot)" \\
     https://your-website.com`}</code>
                    </pre>
                  </div>
                </div>
              </div>

              {/* Delay Normal */}
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800/40 p-6">
                <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-4">5-10 Second Delay Before Data Appears</h3>
                <p className="text-blue-800 dark:text-blue-200 mb-4">
                  <strong>This is normal!</strong> Events are batched for efficiency:
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• <strong>Single visit:</strong> 5 second delay (batching)</li>
                  <li>• <strong>10+ visits:</strong> Immediate sending</li>
                  <li>• <strong>Production:</strong> Consider this normal behavior</li>
                </ul>
              </div>
            </div>
          </section>



          {/* Footer */}
          <DocsFooter />
        </main>
      </div>
    </div>
  )
} 