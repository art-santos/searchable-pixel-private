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
  Settings
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
      { title: 'Platform Guides', href: '#nextjs', description: 'Platform-specific setup instructions' }
    ]
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    description: 'Complete API documentation',
    icon: BookOpen,
    articles: [
      { title: 'trackCrawlerVisit()', href: '#js-api', description: 'Main tracking function' },
      { title: 'SplitAnalytics Class', href: '#js-api-advanced', description: 'Advanced usage class' },
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
      { title: 'Troubleshooting', href: '#troubleshooting', description: 'Common issues and solutions' },
      { title: 'Platform Integration', href: '#nextjs', description: 'Next.js and Node.js guides' }
    ]
  }
]

export default function DocsPage() {
  const [selectedPackageManager, setSelectedPackageManager] = useState<PackageManager>('npm')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

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
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Setup with Middleware</h3>
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
})`)}
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
})`}</code>
                  </pre>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  That's it! AI crawler visits will appear in your Split Dashboard within 5-10 seconds.
                </p>
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

              {/* SplitAnalytics Class for Advanced Usage */}
              <div id="js-api-advanced" className="bg-white dark:bg-[#111] rounded-xl border border-gray-200/60 dark:border-[#1a1a1a] p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">SplitAnalytics Class (Advanced)</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  For custom tracking scenarios and advanced configuration.
                </p>
                
                <div className="bg-gray-900 dark:bg-black rounded-lg overflow-hidden mb-4">
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-800 dark:bg-gray-900 border-b border-gray-700">
                    <div className="flex items-center gap-2 text-gray-400">
                      <Code2 className="w-4 h-4" />
                      <span className="text-sm font-mono">Custom Tracking</span>
                    </div>
                    <Button
                      onClick={() => copyToClipboard(`import { SplitAnalytics } from '@split.dev/analytics'

const analytics = new SplitAnalytics({
  apiKey: process.env.SPLIT_API_KEY,
  debug: true,
  batchIntervalMs: 1000 // Custom batching interval
})

// Manual tracking with metadata
await analytics.track({
  url: 'https://example.com/page',
  userAgent: 'GPTBot/1.0',
  crawler: {
    name: 'GPTBot',
    company: 'OpenAI', 
    category: 'ai-training'
  },
  metadata: {
    source: 'manual-tracking',
    custom: 'data'
  }
})`)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <pre className="px-4 py-3 text-sm text-gray-100 overflow-x-auto text-xs">
                    <code>{`import { SplitAnalytics } from '@split.dev/analytics'

const analytics = new SplitAnalytics({
  apiKey: process.env.SPLIT_API_KEY,
  debug: true,
  batchIntervalMs: 1000 // Custom batching interval
})

// Manual tracking with metadata
await analytics.track({
  url: 'https://example.com/page',
  userAgent: 'GPTBot/1.0',
  crawler: {
    name: 'GPTBot',
    company: 'OpenAI', 
    category: 'ai-training'
  },
  metadata: {
    source: 'manual-tracking',
    custom: 'data'
  }
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* OpenAI */}
              <div className="bg-white dark:bg-[#111] rounded-lg border border-gray-200/60 dark:border-[#1a1a1a] p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">OpenAI</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">GPTBot</code> (training)</li>
                  <li>• <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">ChatGPT-User</code> (search)</li>
                  <li>• <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">OAI-SearchBot</code> (search)</li>
                </ul>
              </div>

              {/* Anthropic */}
              <div className="bg-white dark:bg-[#111] rounded-lg border border-gray-200/60 dark:border-[#1a1a1a] p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Anthropic</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">ClaudeBot</code> (training)</li>
                  <li>• <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">Claude-Web</code> (assistant)</li>
                </ul>
              </div>

              {/* Google */}
              <div className="bg-white dark:bg-[#111] rounded-lg border border-gray-200/60 dark:border-[#1a1a1a] p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Google</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">Google-Extended</code> (training)</li>
                  <li>• <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">Googlebot</code> (search)</li>
                </ul>
              </div>

              {/* Microsoft */}
              <div className="bg-white dark:bg-[#111] rounded-lg border border-gray-200/60 dark:border-[#1a1a1a] p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Microsoft</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">Bingbot</code> (search)</li>
                  <li>• <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">BingPreview</code> (search)</li>
                </ul>
              </div>

              {/* Others */}
              <div className="bg-white dark:bg-[#111] rounded-lg border border-gray-200/60 dark:border-[#1a1a1a] p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Others</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">PerplexityBot</code> (Perplexity)</li>
                  <li>• <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">FacebookBot</code> (Meta)</li>
                  <li>• <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">Bytespider</code> (ByteDance)</li>
                </ul>
              </div>

              {/* More */}
              <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-lg border border-gray-200/60 dark:border-[#1a1a1a] p-4 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">And 15+ more...</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Including Common Crawl, academic crawlers, and emerging AI services</p>
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

          {/* Platform Guides */}
          <section id="platform-guides" className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Platform Integration Guides</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Next.js */}
              <div id="nextjs" className="bg-white dark:bg-[#111] rounded-xl border border-gray-200/60 dark:border-[#1a1a1a] p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Next.js Integration</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Complete setup guide for Next.js middleware with proper configuration.
                </p>
                
                <div className="bg-gray-900 dark:bg-black rounded-lg overflow-hidden mb-4">
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
                  <pre className="px-4 py-3 text-sm text-gray-100 overflow-x-auto text-xs">
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

              {/* Node.js */}
              <div id="nodejs" className="bg-white dark:bg-[#111] rounded-xl border border-gray-200/60 dark:border-[#1a1a1a] p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Node.js/Express</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Add AI crawler tracking to your Express.js application with proper error handling.
                </p>
                
                <div className="bg-gray-900 dark:bg-black rounded-lg overflow-hidden mb-4">
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
                  <pre className="px-4 py-3 text-sm text-gray-100 overflow-x-auto text-xs">
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