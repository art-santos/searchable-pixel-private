'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DocsSearchBar } from '@/components/docs-search-bar'
import { 
  Copy, 
  Check, 
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Zap,
  Download,
  Key,
  Globe,
  Code2,
  Server,
  Settings,
  Database,
  Shield,
  Gauge,
  Cpu,
  Bot,
  Package,
  RefreshCw,
  Webhook
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import DocsFooter from '@/components/layout/docs-footer'

interface NavItem {
  id: string
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavSection {
  id: string
  title: string
  items: NavItem[]
}

const navigation: NavSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    items: [
      { id: 'quickstart', title: 'Quick Start', href: '#quickstart', icon: Bot },
      { id: 'installation', title: 'Test Installation', href: '#installation', icon: Package },
      { id: 'nextjs', title: 'Next.js Setup', href: '#nextjs', icon: Code2 }
    ]
  },
  {
    id: 'reference',
    title: 'Reference',
    items: [
      { id: 'api', title: 'API Reference', href: '#api', icon: Code2 },
      { id: 'crawlers', title: 'Detected Crawlers', href: '#crawlers', icon: Bot },
      { id: 'troubleshooting', title: 'Troubleshooting', href: '#troubleshooting', icon: Settings }
    ]
  }
]

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('quickstart')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<string[]>(['getting-started', 'reference'])
  const [copyingMarkdown, setCopyingMarkdown] = useState(false)
  const [isContentLoading, setIsContentLoading] = useState(false)

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const handleSectionChange = (sectionId: string) => {
    setIsContentLoading(true)
    setActiveSection(sectionId)
    // Smooth content transition
    setTimeout(() => setIsContentLoading(false), 150)
  }

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(id)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const copyPageAsMarkdown = async () => {
    setCopyingMarkdown(true)
    
    // Generate markdown based on current page
    const markdownContent = generateMarkdownForSection(activeSection)
    
    try {
      await navigator.clipboard.writeText(markdownContent)
      setTimeout(() => setCopyingMarkdown(false), 1500)
    } catch (error) {
      console.error('Failed to copy markdown:', error)
      setCopyingMarkdown(false)
    }
  }

  const generateMarkdownForSection = (sectionId: string): string => {
    const sections: Record<string, string> = {
      quickstart: `# Quickstart

Get up and running with Split Analytics in under 5 minutes.

## Prerequisites
- Node.js 16.8 or later
- A Next.js, Express, or Node.js application
- A Split Analytics account (free tier available)

## 1. Install the package
\`\`\`bash
npm install @split.dev/analytics
\`\`\`

## 2. Get your API key
Sign in to your Split Analytics dashboard and navigate to Settings → API Keys to generate a new key.

Your API key will look like: \`split_live_1234567890abcdef...\`

## 3. Add to your application
For Next.js applications, create a \`middleware.ts\` file in your project root:

\`\`\`typescript
import { createCrawlerMiddleware } from '@split.dev/analytics/middleware'

export const middleware = createCrawlerMiddleware({
  apiKey: process.env.SPLIT_API_KEY!
})

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}
\`\`\`

## 4. Set your environment variable
Add your API key to your environment variables:

\`\`\`bash
SPLIT_API_KEY=split_live_your_actual_api_key_here
\`\`\`

✅ That's it! Your application is now tracking AI crawler visits.`,

      installation: `# Installation

Install the package and get your API key to start tracking AI crawler visits.

## 1. Install Package

### npm
\`\`\`bash
npm install @split.dev/analytics
\`\`\`

### yarn
\`\`\`bash
yarn add @split.dev/analytics
\`\`\`

### pnpm
\`\`\`bash
pnpm add @split.dev/analytics
\`\`\`

## 2. Get Your API Key

1. Sign up at [split.dev](https://split.dev)
2. Go to Settings → API Keys
3. Click "Generate New Key"
4. Copy the key immediately (it won't be shown again)

Your API key will look like: \`split_live_1234567890abcdef...\`

## 3. Environment Setup

Add your API key to your environment variables:

\`\`\`bash
# .env.local (Next.js)
SPLIT_API_KEY=split_live_your_actual_api_key_here

# .env (Node.js)
SPLIT_API_KEY=split_live_your_actual_api_key_here
\`\`\`

⚠️ **Security:** Never commit API keys to your repository. Always use environment variables.

## Requirements

| Requirement | Version |
|------------|---------|
| Node.js | 16.8 or later |
| Next.js (optional) | 13.0 or later |
| TypeScript (optional) | 4.5 or later |`
    }
    
    return sections[sectionId] || `# ${sectionId}\n\nContent not available.`
  }

  const CodeBlock = ({ children, language = 'bash', id }: { children: string, language?: string, id: string }) => (
    <div className="relative group my-6 code-block-container">
      <div className="flex items-center justify-between bg-[#0a0a0a] border border-[#1a1a1a] rounded-t-lg px-4 py-2">
        <span className="text-xs text-gray-400 font-mono">{language}</span>
      <button
        onClick={() => copyCode(children, id)}
          className={`copy-button opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1 text-xs text-gray-400 hover:text-white ${copiedCode === id ? 'copy-success' : ''}`}
      >
        {copiedCode === id ? (
            <>
              <Check className="h-3 w-3" />
              Copied
            </>
        ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
        )}
      </button>
      </div>
      <pre className="bg-[#0a0a0a] border border-t-0 border-[#1a1a1a] rounded-b-lg p-4 overflow-x-auto text-sm font-mono">
        <code className="text-gray-300">{children}</code>
      </pre>
    </div>
  )

  const InfoCard = ({ title, children, variant = 'default' }: { 
    title: string, 
    children: React.ReactNode, 
    variant?: 'default' | 'warning' | 'success' | 'info' 
  }) => {
    const variants = {
      default: 'border-[#1a1a1a] bg-[#0a0a0a]',
      warning: 'border-[#2a1f0a] bg-[#1a1308]',
      success: 'border-[#0a2a1f] bg-[#081a13]',
      info: 'border-[#0a1f2a] bg-[#081318]'
    }
    
    return (
      <div className={`border ${variants[variant]} rounded-lg p-6 my-6`}>
        <h3 className="text-white font-semibold text-lg mb-3">{title}</h3>
        <div className="text-gray-300 space-y-3">{children}</div>
      </div>
    )
  }

  const StepCard = ({ number, title, children }: { number: number, title: string, children: React.ReactNode }) => (
    <div className="step-card border border-[#1a1a1a] rounded-lg p-6 my-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200">
          {number}
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold text-lg mb-3">{title}</h3>
          <div className="text-gray-300 space-y-3">{children}</div>
        </div>
      </div>
    </div>
  )

  const FeatureGrid = ({ features }: { features: Array<{ title: string, description: string, icon: React.ComponentType<{ className?: string }> }> }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
      {features.map((feature, index) => {
        const Icon = feature.icon
        return (
          <div key={index} className="feature-card border border-[#1a1a1a] rounded-lg p-4 bg-[#0a0a0a]" style={{ animationDelay: `${index * 100}ms` }}>
            <div className="flex items-start gap-3">
              <Icon className="h-5 w-5 text-gray-400 mt-0.5 transition-all duration-200" />
              <div>
                <h4 className="text-white font-medium mb-1">{feature.title}</h4>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0c0c0c] flex">
      
      {/* Add global styles for animations */}
      <style jsx global>{`
        @media (prefers-reduced-motion: no-preference) {
          .accordion-content {
            transition: max-height 0.3s ease-out, opacity 0.2s ease-out;
            overflow: hidden;
          }
          
          .accordion-enter {
            max-height: 0;
            opacity: 0;
          }
          
          .accordion-enter-active {
            max-height: 300px;
            opacity: 1;
          }
          
          .page-content {
            transition: opacity 0.2s ease-out, transform 0.2s ease-out;
          }
          
          .page-content-loading {
            opacity: 0;
            transform: translateY(8px);
          }
          
          .sidebar-item {
            transition: all 0.15s ease-out;
          }
          
          .sidebar-item:hover {
            transform: translateX(3px);
          }
          
          .accordion-button {
            transition: all 0.2s ease-out;
            position: relative;
          }
          
          .accordion-button:hover {
            background-color: rgba(255, 255, 255, 0.03);
            transform: translateX(2px);
          }
          
          .accordion-chevron {
            transition: transform 0.2s ease-out;
          }
          
          .accordion-expanded .accordion-chevron {
            transform: rotate(90deg);
          }
          
          .copy-button {
            transition: all 0.15s ease-out;
          }
          
          .copy-button:hover {
            transform: translateY(-1px);
            background-color: rgba(255, 255, 255, 0.1);
          }
          
          .copy-button:active {
            transform: translateY(0);
          }
          
          .copy-success {
            animation: copySuccess 0.3s ease-out;
          }
          
          @keyframes copySuccess {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          
          .markdown-button {
            transition: all 0.2s ease-out;
          }
          
          .markdown-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          }
          
          .markdown-button:active {
            transform: translateY(-1px);
          }
          
          .feature-card {
            transition: all 0.2s ease-out;
          }
          
          .feature-card:hover {
            transform: translateY(-2px);
            background-color: rgba(255, 255, 255, 0.02);
          }
          
          .step-card {
            transition: all 0.2s ease-out;
          }
          
          .step-card:hover {
            transform: translateY(-1px);
            border-color: rgba(255, 255, 255, 0.15);
          }
          
          .code-block-container {
            transition: all 0.15s ease-out;
          }
          
          .code-block-container:hover {
            border-color: rgba(255, 255, 255, 0.1);
          }
          
          .fade-in {
            animation: fadeInUp 0.4s ease-out;
          }
          
          .stagger-1 { animation-delay: 0.1s; }
          .stagger-2 { animation-delay: 0.2s; }
          .stagger-3 { animation-delay: 0.3s; }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(16px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .bounce-in {
            animation: bounceIn 0.5s ease-out;
          }
          
          @keyframes bounceIn {
            0% {
              opacity: 0;
              transform: scale(0.9) translateY(10px);
            }
            60% {
              opacity: 1;
              transform: scale(1.02) translateY(-2px);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .accordion-content,
          .page-content,
          .sidebar-item,
          .accordion-button,
          .copy-button,
          .markdown-button,
          .feature-card,
          .step-card,
          .code-block-container {
            transition: none;
          }
          
          .fade-in,
          .bounce-in {
            animation: none;
          }
        }
      `}</style>
      
      {/* Sidebar Navigation - Full Height - Lower z-index */}
      <div className="w-80 border-r border-[#1a1a1a] bg-[#0c0c0c] fixed left-0 top-0 bottom-0 overflow-y-auto flex flex-col z-10">
        
        {/* Logo and Search */}
        <div className="p-4 pt-6 space-y-8">
          <div className="flex items-center justify-start gap-3">
            <Link href="/" className="flex items-center justify-start transition-all duration-200 hover:opacity-80">
            <Image 
                src="/images/split-full-text.svg" 
                alt="Split Analytics" 
                width={80} 
              height={28} 
            />
          </Link>
            <span className="text-gray-600 text-sm font-medium">Docs</span>
        </div>
          <div className="border border-[#1a1a1a] rounded-md p-2 transition-all duration-200 hover:border-[#2a2a2a]">
            <DocsSearchBar onNavigate={handleSectionChange} />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-6 py-4">
          {navigation.map((section, sectionIndex) => (
            <div key={section.id} className={`mb-8 fade-in stagger-${Math.min(sectionIndex + 1, 3)}`}>
              <button
                onClick={() => toggleSection(section.id)}
                className={`accordion-button ${expandedSections.includes(section.id) ? 'accordion-expanded' : ''} flex items-center justify-between w-full text-left px-4 py-3 text-sm font-bold text-white hover:text-gray-300 rounded-md`}
              >
                <span>{section.title}</span>
                <ChevronRight 
                  className="accordion-chevron h-4 w-4" 
                />
              </button>
              
              <div className={`accordion-content ${
                expandedSections.includes(section.id) 
                  ? 'accordion-enter-active' 
                  : 'accordion-enter'
              }`}>
              {expandedSections.includes(section.id) && (
                  <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-[#2a2a2a]"></div>
                    
                <div className="mt-2 space-y-1">
                  {section.items.map((item, itemIndex) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                            onClick={() => handleSectionChange(item.id)}
                            className={`sidebar-item ${activeSection === item.id ? 'active' : ''} w-full text-left flex items-center gap-3 pl-8 pr-4 py-3 text-sm rounded-md transition-all duration-200 ${
                          activeSection === item.id
                                ? 'text-white font-bold'
                                : 'text-gray-400 hover:text-gray-200'
                        }`}
                         style={{ animationDelay: `${(itemIndex + 1) * 50}ms` }}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span>{item.title}</span>
                      </button>
                    )
                  })}
                    </div>
                </div>
              )}
              </div>
            </div>
          ))}
        </div>

        {/* Return to Home - Sticky Bottom */}
        <div className="sticky bottom-0 p-6 border-t border-[#1a1a1a] bg-[#0c0c0c]">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-all duration-200 text-sm hover:transform hover:translateX(2px)"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to home
          </Link>
        </div>
      </div>

      {/* Main Content - Lower z-index to allow search overlay to blur it */}
      <div className="flex-1 ml-80 relative z-0">
        <div className="max-w-4xl mx-auto px-8 py-12">
          
          {/* Page Header with Copy Button */}
          <div className="flex items-start justify-between mb-8 fade-in">
            <div className="flex-1">
          {activeSection === 'quickstart' && (
              <div>
                <h1 className="text-4xl font-bold text-white mb-4">Quick Start</h1>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Get up and running with Split Analytics v2.0.0 in under 2 minutes. Track AI crawler visits from ChatGPT, Claude, Perplexity, and more.
                </p>
              </div>
              )}
              {activeSection === 'installation' && (
                <div>
                  <h1 className="text-4xl font-bold text-white mb-4">Test Installation</h1>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Verify your installation works correctly with built-in testing commands.
                  </p>
              </div>
          )}
              {activeSection === 'nextjs' && (
                <div>
                  <h1 className="text-4xl font-bold text-white mb-4">Next.js Setup</h1>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Simple middleware integration for Next.js applications - now with improved routing and error handling.
                  </p>
                </div>
              )}
              {activeSection === 'api' && (
                <div>
                  <h1 className="text-4xl font-bold text-white mb-4">API Reference</h1>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Complete API reference with TypeScript definitions and examples.
                  </p>
                </div>
              )}
              {activeSection === 'crawlers' && (
                <div>
                  <h1 className="text-4xl font-bold text-white mb-4">Detected Crawlers</h1>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    35+ AI crawlers automatically detected and tracked by Split Analytics.
                  </p>
                </div>
              )}
              {activeSection === 'troubleshooting' && (
                <div>
                  <h1 className="text-4xl font-bold text-white mb-4">Troubleshooting</h1>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Common issues and solutions for Split Analytics integration.
                  </p>
                </div>
              )}
                </div>

            {/* Copy as Markdown Button */}
            <button
              onClick={copyPageAsMarkdown}
              className={`markdown-button flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#2a2a2a] rounded-lg text-gray-300 hover:text-white text-sm font-medium ${copyingMarkdown ? 'copy-success' : ''}`}
              disabled={copyingMarkdown}
            >
              {copyingMarkdown ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy as MD
                </>
              )}
            </button>
          </div>

          {/* Page Content */}
          <div className={`page-content ${isContentLoading ? 'page-content-loading' : ''}`}>
            
            {activeSection === 'quickstart' && (
              <div className="space-y-8">
                <InfoCard title="What's New in v2.0.0" variant="success">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="text-white font-medium mb-2">✅ Fixed Issues</h4>
                      <ul className="text-gray-300 space-y-1">
                        <li>• Middleware routing conflicts</li>
                        <li>• Cryptic error messages</li>
                        <li>• TypeScript support gaps</li>
                        <li>• Documentation mismatches</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-2">🚀 New Features</h4>
                      <ul className="text-gray-300 space-y-1">
                        <li>• Built-in testing commands</li>
                        <li>• Comprehensive error handling</li>
                        <li>• Non-blocking tracking</li>
                        <li>• Complete TypeScript definitions</li>
                      </ul>
                    </div>
                  </div>
                </InfoCard>

                <StepCard number={1} title="Install">
                  <CodeBlock language="bash" id="install">
{`npm install @split.dev/analytics`}
                  </CodeBlock>
                </StepCard>

                <StepCard number={2} title="Test Installation">
                  <CodeBlock language="bash" id="test-install">
{`# Test package installation
npx @split.dev/analytics --test

# Test API connection (get key from split.dev)
npx @split.dev/analytics --test-api YOUR_API_KEY`}
                  </CodeBlock>
                </StepCard>

                <StepCard number={3} title="Add to Your App">
                  <p className="text-gray-300 mb-4">
                    For Next.js, create <code className="text-gray-300 bg-[#1a1a1a] px-1.5 py-0.5 rounded">middleware.ts</code> in your project root:
                  </p>
                  <CodeBlock language="typescript" id="nextjs-setup">
{`import { createCrawlerMiddleware } from '@split.dev/analytics/middleware'

export const middleware = createCrawlerMiddleware({
  apiKey: process.env.SPLIT_API_KEY!
})

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}
\`\`\`

## 4. Set your environment variable
Add your API key to your environment variables:

\`\`\`bash
SPLIT_API_KEY=split_live_your_actual_api_key_here
\`\`\`

✅ That's it! Your application is now tracking AI crawler visits.`,

      installation: `# Installation

Install the package and get your API key to start tracking AI crawler visits.

## 1. Install Package

### npm
\`\`\`bash
npm install @split.dev/analytics
\`\`\`

### yarn
\`\`\`bash
yarn add @split.dev/analytics
\`\`\`

### pnpm
\`\`\`bash
pnpm add @split.dev/analytics
\`\`\`

## 2. Get Your API Key

1. Sign up at [split.dev](https://split.dev)
2. Go to Settings → API Keys
3. Click "Generate New Key"
4. Copy the key immediately (it won't be shown again)

Your API key will look like: \`split_live_1234567890abcdef...\`

## 3. Environment Setup

Add your API key to your environment variables:

\`\`\`bash
# .env.local (Next.js)
SPLIT_API_KEY=split_live_your_actual_api_key_here

# .env (Node.js)
SPLIT_API_KEY=split_live_your_actual_api_key_here
\`\`\`

⚠️ **Security:** Never commit API keys to your repository. Always use environment variables.

## Requirements

| Requirement | Version |
|------------|---------|
| Node.js | 16.8 or later |
| Next.js (optional) | 13.0 or later |
| TypeScript (optional) | 4.5 or later |`
    }
    
    return sections[sectionId] || `# ${sectionId}\n\nContent not available.`
  }

  const CodeBlock = ({ children, language = 'bash', id }: { children: string, language?: string, id: string }) => (
    <div className="relative group my-6 code-block-container">
      <div className="flex items-center justify-between bg-[#0a0a0a] border border-[#1a1a1a] rounded-t-lg px-4 py-2">
        <span className="text-xs text-gray-400 font-mono">{language}</span>
      <button
        onClick={() => copyCode(children, id)}
          className={`copy-button opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1 text-xs text-gray-400 hover:text-white ${copiedCode === id ? 'copy-success' : ''}`}
      >
        {copiedCode === id ? (
            <>
              <Check className="h-3 w-3" />
              Copied
            </>
        ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
        )}
      </button>
      </div>
      <pre className="bg-[#0a0a0a] border border-t-0 border-[#1a1a1a] rounded-b-lg p-4 overflow-x-auto text-sm font-mono">
        <code className="text-gray-300">{children}</code>
      </pre>
    </div>
  )

  const InfoCard = ({ title, children, variant = 'default' }: { 
    title: string, 
    children: React.ReactNode, 
    variant?: 'default' | 'warning' | 'success' | 'info' 
  }) => {
    const variants = {
      default: 'border-[#1a1a1a] bg-[#0a0a0a]',
      warning: 'border-[#2a1f0a] bg-[#1a1308]',
      success: 'border-[#0a2a1f] bg-[#081a13]',
      info: 'border-[#0a1f2a] bg-[#081318]'
    }
    
    return (
      <div className={`border ${variants[variant]} rounded-lg p-6 my-6`}>
        <h3 className="text-white font-semibold text-lg mb-3">{title}</h3>
        <div className="text-gray-300 space-y-3">{children}</div>
      </div>
    )
  }

  const StepCard = ({ number, title, children }: { number: number, title: string, children: React.ReactNode }) => (
    <div className="step-card border border-[#1a1a1a] rounded-lg p-6 my-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200">
          {number}
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold text-lg mb-3">{title}</h3>
          <div className="text-gray-300 space-y-3">{children}</div>
        </div>
      </div>
    </div>
  )

  const FeatureGrid = ({ features }: { features: Array<{ title: string, description: string, icon: React.ComponentType<{ className?: string }> }> }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
      {features.map((feature, index) => {
        const Icon = feature.icon
        return (
          <div key={index} className="feature-card border border-[#1a1a1a] rounded-lg p-4 bg-[#0a0a0a]" style={{ animationDelay: `${index * 100}ms` }}>
            <div className="flex items-start gap-3">
              <Icon className="h-5 w-5 text-gray-400 mt-0.5 transition-all duration-200" />
              <div>
                <h4 className="text-white font-medium mb-1">{feature.title}</h4>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0c0c0c] flex">
      
      {/* Add global styles for animations */}
      <style jsx global>{`
        @media (prefers-reduced-motion: no-preference) {
          .accordion-content {
            transition: max-height 0.3s ease-out, opacity 0.2s ease-out;
            overflow: hidden;
          }
          
          .accordion-enter {
            max-height: 0;
            opacity: 0;
          }
          
          .accordion-enter-active {
            max-height: 300px;
            opacity: 1;
          }
          
          .page-content {
            transition: opacity 0.2s ease-out, transform 0.2s ease-out;
          }
          
          .page-content-loading {
            opacity: 0;
            transform: translateY(8px);
          }
          
          .sidebar-item {
            transition: all 0.15s ease-out;
          }
          
          .sidebar-item:hover {
            transform: translateX(3px);
          }
          
          .accordion-button {
            transition: all 0.2s ease-out;
            position: relative;
          }
          
          .accordion-button:hover {
            background-color: rgba(255, 255, 255, 0.03);
            transform: translateX(2px);
          }
          
          .accordion-chevron {
            transition: transform 0.2s ease-out;
          }
          
          .accordion-expanded .accordion-chevron {
            transform: rotate(90deg);
          }
          
          .copy-button {
            transition: all 0.15s ease-out;
          }
          
          .copy-button:hover {
            transform: translateY(-1px);
            background-color: rgba(255, 255, 255, 0.1);
          }
          
          .copy-button:active {
            transform: translateY(0);
          }
          
          .copy-success {
            animation: copySuccess 0.3s ease-out;
          }
          
          @keyframes copySuccess {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          
          .markdown-button {
            transition: all 0.2s ease-out;
          }
          
          .markdown-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          }
          
          .markdown-button:active {
            transform: translateY(-1px);
          }
          
          .feature-card {
            transition: all 0.2s ease-out;
          }
          
          .feature-card:hover {
            transform: translateY(-2px);
            background-color: rgba(255, 255, 255, 0.02);
          }
          
          .step-card {
            transition: all 0.2s ease-out;
          }
          
          .step-card:hover {
            transform: translateY(-1px);
            border-color: rgba(255, 255, 255, 0.15);
          }
          
          .code-block-container {
            transition: all 0.15s ease-out;
          }
          
          .code-block-container:hover {
            border-color: rgba(255, 255, 255, 0.1);
          }
          
          .fade-in {
            animation: fadeInUp 0.4s ease-out;
          }
          
          .stagger-1 { animation-delay: 0.1s; }
          .stagger-2 { animation-delay: 0.2s; }
          .stagger-3 { animation-delay: 0.3s; }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(16px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .bounce-in {
            animation: bounceIn 0.5s ease-out;
          }
          
          @keyframes bounceIn {
            0% {
              opacity: 0;
              transform: scale(0.9) translateY(10px);
            }
            60% {
              opacity: 1;
              transform: scale(1.02) translateY(-2px);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .accordion-content,
          .page-content,
          .sidebar-item,
          .accordion-button,
          .copy-button,
          .markdown-button,
          .feature-card,
          .step-card,
          .code-block-container {
            transition: none;
          }
          
          .fade-in,
          .bounce-in {
            animation: none;
          }
        }
      `}</style>
      
      {/* Sidebar Navigation - Full Height - Lower z-index */}
      <div className="w-80 border-r border-[#1a1a1a] bg-[#0c0c0c] fixed left-0 top-0 bottom-0 overflow-y-auto flex flex-col z-10">
        
        {/* Logo and Search */}
        <div className="p-4 pt-6 space-y-8">
          <div className="flex items-center justify-start gap-3">
            <Link href="/" className="flex items-center justify-start transition-all duration-200 hover:opacity-80">
            <Image 
                src="/images/split-full-text.svg" 
                alt="Split Analytics" 
                width={80} 
              height={28} 
            />
          </Link>
            <span className="text-gray-600 text-sm font-medium">Docs</span>
        </div>
          <div className="border border-[#1a1a1a] rounded-md p-2 transition-all duration-200 hover:border-[#2a2a2a]">
            <DocsSearchBar onNavigate={handleSectionChange} />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-6 py-4">
          {navigation.map((section, sectionIndex) => (
            <div key={section.id} className={`mb-8 fade-in stagger-${Math.min(sectionIndex + 1, 3)}`}>
              <button
                onClick={() => toggleSection(section.id)}
                className={`accordion-button ${expandedSections.includes(section.id) ? 'accordion-expanded' : ''} flex items-center justify-between w-full text-left px-4 py-3 text-sm font-bold text-white hover:text-gray-300 rounded-md`}
              >
                <span>{section.title}</span>
                <ChevronRight 
                  className="accordion-chevron h-4 w-4" 
                />
              </button>
              
              <div className={`accordion-content ${
                expandedSections.includes(section.id) 
                  ? 'accordion-enter-active' 
                  : 'accordion-enter'
              }`}>
              {expandedSections.includes(section.id) && (
                  <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-[#2a2a2a]"></div>
                    
                <div className="mt-2 space-y-1">
                  {section.items.map((item, itemIndex) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                            onClick={() => handleSectionChange(item.id)}
                            className={`sidebar-item ${activeSection === item.id ? 'active' : ''} w-full text-left flex items-center gap-3 pl-8 pr-4 py-3 text-sm rounded-md transition-all duration-200 ${
                          activeSection === item.id
                                ? 'text-white font-bold'
                                : 'text-gray-400 hover:text-gray-200'
                        }`}
                         style={{ animationDelay: `${(itemIndex + 1) * 50}ms` }}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span>{item.title}</span>
                      </button>
                    )
                  })}
                    </div>
                </div>
              )}
              </div>
            </div>
          ))}
        </div>

        {/* Return to Home - Sticky Bottom */}
        <div className="sticky bottom-0 p-6 border-t border-[#1a1a1a] bg-[#0c0c0c]">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-all duration-200 text-sm hover:transform hover:translateX(2px)"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to home
          </Link>
        </div>
      </div>

      {/* Main Content - Lower z-index to allow search overlay to blur it */}
      <div className="flex-1 ml-80 relative z-0">
        <div className="max-w-4xl mx-auto px-8 py-12">
          
          {/* Page Header with Copy Button */}
          <div className="flex items-start justify-between mb-8 fade-in">
            <div className="flex-1">
          {activeSection === 'quickstart' && (
              <div>
                <h1 className="text-4xl font-bold text-white mb-4">Quick Start</h1>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Get up and running with Split Analytics v2.0.0 in under 2 minutes. Track AI crawler visits from ChatGPT, Claude, Perplexity, and more.
                </p>
              </div>
              )}
              {activeSection === 'installation' && (
                <div>
                  <h1 className="text-4xl font-bold text-white mb-4">Test Installation</h1>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Verify your installation works correctly with built-in testing commands.
                  </p>
              </div>
          )}
              {activeSection === 'nextjs' && (
                <div>
                  <h1 className="text-4xl font-bold text-white mb-4">Next.js Setup</h1>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Simple middleware integration for Next.js applications - now with improved routing and error handling.
                  </p>
                </div>
              )}
              {activeSection === 'api' && (
                <div>
                  <h1 className="text-4xl font-bold text-white mb-4">API Reference</h1>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Complete API reference with TypeScript definitions and examples.
                  </p>
                </div>
              )}
              {activeSection === 'crawlers' && (
                <div>
                  <h1 className="text-4xl font-bold text-white mb-4">Detected Crawlers</h1>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    35+ AI crawlers automatically detected and tracked by Split Analytics.
                  </p>
                </div>
              )}
              {activeSection === 'troubleshooting' && (
                <div>
                  <h1 className="text-4xl font-bold text-white mb-4">Troubleshooting</h1>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Common issues and solutions for Split Analytics integration.
                  </p>
                </div>
              )}
                </div>

            {/* Copy as Markdown Button */}
            <button
              onClick={copyPageAsMarkdown}
              className={`markdown-button flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#2a2a2a] rounded-lg text-gray-300 hover:text-white text-sm font-medium ${copyingMarkdown ? 'copy-success' : ''}`}
              disabled={copyingMarkdown}
            >
              {copyingMarkdown ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy as MD
                </>
              )}
            </button>
          </div>

          {/* Page Content */}
          <div className={`page-content ${isContentLoading ? 'page-content-loading' : ''}`}>
            
            {activeSection === 'quickstart' && (
              <div className="space-y-8">
                <InfoCard title="What's New in v2.0.0" variant="success">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="text-white font-medium mb-2">✅ Fixed Issues</h4>
                      <ul className="text-gray-300 space-y-1">
                        <li>• Middleware routing conflicts</li>
                        <li>• Cryptic error messages</li>
                        <li>• TypeScript support gaps</li>
                        <li>• Documentation mismatches</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-2">🚀 New Features</h4>
                      <ul className="text-gray-300 space-y-1">
                        <li>• Built-in testing commands</li>
                        <li>• Comprehensive error handling</li>
                        <li>• Non-blocking tracking</li>
                        <li>• Complete TypeScript definitions</li>
                      </ul>
                    </div>
                  </div>
                </InfoCard>

                <StepCard number={1} title="Install">
                  <CodeBlock language="bash" id="install">
{`npm install @split.dev/analytics`}
                  </CodeBlock>
                </StepCard>

                <StepCard number={2} title="Test Installation">
                  <CodeBlock language="bash" id="test-install">
{`# Test package installation
npx @split.dev/analytics --test

# Test API connection (get key from split.dev)
npx @split.dev/analytics --test-api YOUR_API_KEY`}
                  </CodeBlock>
                </StepCard>

                <StepCard number={3} title="Add to Your App">
                  <p className="text-gray-300 mb-4">
                    For Next.js, create <code className="text-gray-300 bg-[#1a1a1a] px-1.5 py-0.5 rounded">middleware.ts</code> in your project root:
                  </p>
                  <CodeBlock language="typescript" id="nextjs-setup">
{`import { createCrawlerMiddleware } from '@split.dev/analytics/middleware'

export const middleware = createCrawlerMiddleware({
  apiKey: process.env.SPLIT_API_KEY!
})

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}
\`\`\`

## 4. Set your environment variable
Add your API key to your environment variables:

\`\`\`bash
SPLIT_API_KEY=split_live_your_actual_api_key_here
\`\`\`

✅ That's it! Your application is now tracking AI crawler visits.`,

      installation: `# Installation

Install the package and get your API key to start tracking AI crawler visits.

## 1. Install Package

### npm
\`\`\`bash
npm install @split.dev/analytics
\`\`\`

### yarn
\`\`\`bash
yarn add @split.dev/analytics
\`\`\`

### pnpm
\`\`\`bash
pnpm add @split.dev/analytics
\`\`\`

## 2. Get Your API Key

1. Sign up at [split.dev](https://split.dev)
2. Go to Settings → API Keys
3. Click "Generate New Key"
4. Copy the key immediately (it won't be shown again)

Your API key will look like: \`split_live_1234567890abcdef...\`

## 3. Environment Setup

Add your API key to your environment variables:

\`\`\`bash
# .env.local (Next.js)
SPLIT_API_KEY=split_live_your_actual_api_key_here

# .env (Node.js)
SPLIT_API_KEY=split_live_your_actual_api_key_here
\`\`\`

⚠️ **Security:** Never commit API keys to your repository. Always use environment variables.

## Requirements

| Requirement | Version |
|------------|---------|
| Node.js | 16.8 or later |
| Next.js (optional) | 13.0 or later |
| TypeScript (optional) | 4.5 or later |`
    }
    
    return sections[sectionId] || `# ${sectionId}\n\nContent not available.`
  }

  const CodeBlock = ({ children, language = 'bash', id }: { children: string, language?: string, id: string }) => (
    <div className="relative group my-6 code-block-container">
      <div className="flex items-center justify-between bg-[#0a0a0a] border border-[#1a1a1a] rounded-t-lg px-4 py-2">
        <span className="text-xs text-gray-400 font-mono">{language}</span>
      <button
        onClick={() => copyCode(children, id)}
          className={`copy-button opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1 text-xs text-gray-400 hover:text-white ${copiedCode === id ? 'copy-success' : ''}`}
      >
        {copiedCode === id ? (
            <>
              <Check className="h-3 w-3" />
              Copied
            </>
        ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
        )}
      </button>
      </div>
      <pre className="bg-[#0a0a0a] border border-t-0 border-[#1a1a1a] rounded-b-lg p-4 overflow-x-auto text-sm font-mono">
        <code className="text-gray-300">{children}</code>
      </pre>
    </div>
  )

  const InfoCard = ({ title, children, variant = 'default' }: { 
    title: string, 
    children: React.ReactNode, 
    variant?: 'default' | 'warning' | 'success' | 'info' 
  }) => {
    const variants = {
      default: 'border-[#1a1a1a] bg-[#0a0a0a]',
      warning: 'border-[#2a1f0a] bg-[#1a1308]',
      success: 'border-[#0a2a1f] bg-[#081a13]',
      info: 'border-[#0a1f2a] bg-[#081318]'
    }
    
    return (
      <div className={`border ${variants[variant]} rounded-lg p-6 my-6`}>
        <h3 className="text-white font-semibold text-lg mb-3">{title}</h3>
        <div className="text-gray-300 space-y-3">{children}</div>
      </div>
    )
  }

  const StepCard = ({ number, title, children }: { number: number, title: string, children: React.ReactNode }) => (
    <div className="step-card border border-[#1a1a1a] rounded-lg p-6 my-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200">
          {number}
        </div>
        <div className="flex-1">
          <h3 className="text-white font-semibold text-lg mb-3">{title}</h3>
          <div className="text-gray-300 space-y-3">{children}</div>
        </div>
      </div>
    </div>
  )

  const FeatureGrid = ({ features }: { features: Array<{ title: string, description: string, icon: React.ComponentType<{ className?: string }> }> }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
      {features.map((feature, index) => {
        const Icon = feature.icon
        return (
          <div key={index} className="feature-card border border-[#1a1a1a] rounded-lg p-4 bg-[#0a0a0a]" style={{ animationDelay: `${index * 100}ms` }}>
            <div className="flex items-start gap-3">
              <Icon className="h-5 w-5 text-gray-400 mt-0.5 transition-all duration-200" />
              <div>
                <h4 className="text-white font-medium mb-1">{feature.title}</h4>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0c0c0c] flex">
      
      {/* Add global styles for animations */}
      <style jsx global>{`
        @media (prefers-reduced-motion: no-preference) {
          .accordion-content {
            transition: max-height 0.3s ease-out, opacity 0.2s ease-out;
            overflow: hidden;
          }
          
          .accordion-enter {
            max-height: 0;
            opacity: 0;
          }
          
          .accordion-enter-active {
            max-height: 300px;
            opacity: 1;
          }
          
          .page-content {
            transition: opacity 0.2s ease-out, transform 0.2s ease-out;
          }
          
          .page-content-loading {
            opacity: 0;
            transform: translateY(8px);
          }
          
          .sidebar-item {
            transition: all 0.15s ease-out;
          }
          
          .sidebar-item:hover {
            transform: translateX(3px);
          }
          
          .accordion-button {
            transition: all 0.2s ease-out;
            position: relative;
          }
          
          .accordion-button:hover {
            background-color: rgba(255, 255, 255, 0.03);
            transform: translateX(2px);
          }
          
          .accordion-chevron {
            transition: transform 0.2s ease-out;
          }
          
          .accordion-expanded .accordion-chevron {
            transform: rotate(90deg);
          }
          
          .copy-button {
            transition: all 0.15s ease-out;
          }
          
          .copy-button:hover {
            transform: translateY(-1px);
            background-color: rgba(255, 255, 255, 0.1);
          }
          
          .copy-button:active {
            transform: translateY(0);
          }
          
          .copy-success {
            animation: copySuccess 0.3s ease-out;
          }
          
          @keyframes copySuccess {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          
          .markdown-button {
            transition: all 0.2s ease-out;
          }
          
          .markdown-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          }
          
          .markdown-button:active {
            transform: translateY(-1px);
          }
          
          .feature-card {
            transition: all 0.2s ease-out;
          }
          
          .feature-card:hover {
            transform: translateY(-2px);
            background-color: rgba(255, 255, 255, 0.02);
          }
          
          .step-card {
            transition: all 0.2s ease-out;
          }
          
          .step-card:hover {
            transform: translateY(-1px);
            border-color: rgba(255, 255, 255, 0.15);
          }
          
          .code-block-container {
            transition: all 0.15s ease-out;
          }
          
          .code-block-container:hover {
            border-color: rgba(255, 255, 255, 0.1);
          }
          
          .fade-in {
            animation: fadeInUp 0.4s ease-out;
          }
          
          .stagger-1 { animation-delay: 0.1s; }
          .stagger-2 { animation-delay: 0.2s; }
          .stagger-3 { animation-delay: 0.3s; }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(16px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .bounce-in {
            animation: bounceIn 0.5s ease-out;
          }
          
          @keyframes bounceIn {
            0% {
              opacity: 0;
              transform: scale(0.9) translateY(10px);
            }
            60% {
              opacity: 1;
              transform: scale(1.02) translateY(-2px);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .accordion-content,
          .page-content,
          .sidebar-item,
          .accordion-button,
          .copy-button,
          .markdown-button,
          .feature-card,
          .step-card,
          .code-block-container {
            transition: none;
          }
          
          .fade-in,
          .bounce-in {
            animation: none;
          }
        }
      `}</style>
      
      {/* Sidebar Navigation - Full Height - Lower z-index */}
      <div className="w-80 border-r border-[#1a1a1a] bg-[#0c0c0c] fixed left-0 top-0 bottom-0 overflow-y-auto flex flex-col z-10">
        
        {/* Logo and Search */}
        <div className="p-4 pt-6 space-y-8">
          <div className="flex items-center justify-start gap-3">
            <Link href="/" className="flex items-center justify-start transition-all duration-200 hover:opacity-80">
            <Image 
                src="/images/split-full-text.svg" 
                alt="Split Analytics" 
                width={80} 
              height={28} 
            />
          </Link>
            <span className="text-gray-600 text-sm font-medium">Docs</span>
        </div>
          <div className="border border-[#1a1a1a] rounded-md p-2 transition-all duration-200 hover:border-[#2a2a2a]">
            <DocsSearchBar onNavigate={handleSectionChange} />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-6 py-4">
          {navigation.map((section, sectionIndex) => (
            <div key={section.id} className={`mb-8 fade-in stagger-${Math.min(sectionIndex + 1, 3)}`}>
              <button
                onClick={() => toggleSection(section.id)}
                className={`accordion-button ${expandedSections.includes(section.id) ? 'accordion-expanded' : ''} flex items-center justify-between w-full text-left px-4 py-3 text-sm font-bold text-white hover:text-gray-300 rounded-md`}
              >
                <span>{section.title}</span>
                <ChevronRight 
                  className="accordion-chevron h-4 w-4" 
                />
              </button>
              
              <div className={`accordion-content ${
                expandedSections.includes(section.id) 
                  ? 'accordion-enter-active' 
                  : 'accordion-enter'
              }`}>
              {expandedSections.includes(section.id) && (
                  <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-[#2a2a2a]"></div>
                    
                <div className="mt-2 space-y-1">
                  {section.items.map((item, itemIndex) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                            onClick={() => handleSectionChange(item.id)}
                            className={`sidebar-item ${activeSection === item.id ? 'active' : ''} w-full text-left flex items-center gap-3 pl-8 pr-4 py-3 text-sm rounded-md transition-all duration-200 ${
                          activeSection === item.id
                                ? 'text-white font-bold'
                                : 'text-gray-400 hover:text-gray-200'
                        }`}
                         style={{ animationDelay: `${(itemIndex + 1) * 50}ms` }}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span>{item.title}</span>
                      </button>
                    )
                  })}
                    </div>
                </div>
              )}
              </div>
            </div>
          ))}
        </div>

        {/* Return to Home - Sticky Bottom */}
        <div className="sticky bottom-0 p-6 border-t border-[#1a1a1a] bg-[#0c0c0c]">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-all duration-200 text-sm hover:transform hover:translateX(2px)"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to home
          </Link>
        </div>
      </div>

      {/* Main Content - Lower z-index to allow search overlay to blur it */}
      <div className="flex-1 ml-80 relative z-0">
        <div className="max-w-4xl mx-auto px-8 py-12">
          
          {/* Page Header with Copy Button */}
          <div className="flex items-start justify-between mb-8 fade-in">
            <div className="flex-1">
          {activeSection === 'quickstart' && (
              <div>
                <h1 className="text-4xl font-bold text-white mb-4">Quick Start</h1>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Get up and running with Split Analytics v2.0.0 in under 2 minutes. Track AI crawler visits from ChatGPT, Claude, Perplexity, and more.
                </p>
              </div>
              )}
              {activeSection === 'installation' && (
                <div>
                  <h1 className="text-4xl font-bold text-white mb-4">Test Installation</h1>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Verify your installation works correctly with built-in testing commands.
                  </p>
              </div>
          )}
              {activeSection === 'nextjs' && (
                <div>
                  <h1 className="text-4xl font-bold text-white mb-4">Next.js Setup</h1>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Simple middleware integration for Next.js applications - now with improved routing and error handling.
                  </p>
                </div>
              )}
              {activeSection === 'api' && (
                <div>
                  <h1 className="text-4xl font-bold text-white mb-4">API Reference</h1>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Complete API reference with TypeScript definitions and examples.
                  </p>
                </div>
              )}
              {activeSection === 'crawlers' && (
                <div>
                  <h1 className="text-4xl font-bold text-white mb-4">Detected Crawlers</h1>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    35+ AI crawlers automatically detected and tracked by Split Analytics.
                  </p>
                </div>
              )}
              {activeSection === 'troubleshooting' && (
                <div>
                  <h1 className="text-4xl font-bold text-white mb-4">Troubleshooting</h1>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Common issues and solutions for Split Analytics integration.
                  </p>
                </div>
              )}
                </div>

            {/* Copy as Markdown Button */}
            <button
              onClick={copyPageAsMarkdown}
              className={`markdown-button flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#2a2a2a] rounded-lg text-gray-300 hover:text-white text-sm font-medium ${copyingMarkdown ? 'copy-success' : ''}`}
              disabled={copyingMarkdown}
            >
              {copyingMarkdown ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy as MD
                </>
              )}
            </button>
          </div>

          {/* Page Content */}
          <div className={`page-content ${isContentLoading ? 'page-content-loading' : ''}`}>
            
            {activeSection === 'quickstart' && (
              <div className="space-y-8">
                <InfoCard title="What's New in v2.0.0" variant="success">
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="text-white font-medium mb-2">✅ Fixed Issues</h4>
                      <ul className="text-gray-300 space-y-1">
                        <li>• Middleware routing conflicts</li>
                        <li>• Cryptic error messages</li>
                        <li>• TypeScript support gaps</li>
                        <li>• Documentation mismatches</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-2">🚀 New Features</h4>
                      <ul className="text-gray-300 space-y-1">
                        <li>• Built-in testing commands</li>
                        <li>• Comprehensive error handling</li>
                        <li>• Non-blocking tracking</li>
                        <li>• Complete TypeScript definitions</li>
                      </ul>
                    </div>
                  </div>
                </InfoCard>

                <StepCard number={1} title="Install">
                  <CodeBlock language="bash" id="install">
{`npm install @split.dev/analytics`}
                  </CodeBlock>
                </StepCard>

                <StepCard number={2} title="Test Installation">
                  <CodeBlock language="bash" id="test-install">
{`# Test package installation
npx @split.dev/analytics --test

# Test API connection (get key from split.dev)
npx @split.dev/analytics --test-api YOUR_API_KEY`}
                  </CodeBlock>
                </StepCard>

                <StepCard number={3} title="Add to Your App">
                  <p className="text-gray-300 mb-4">
                    For Next.js, create <code className="text-gray-300 bg-[#1a1a1a] px-1.5 py-0.5 rounded">middleware.ts</code> in your project root:
                  </p>
                  <CodeBlock language="typescript" id="nextjs-setup">
{`import { createCrawlerMiddleware } from '@split.dev/analytics/middleware'

export const middleware = createCrawlerMiddleware({
  apiKey: process.env.SPLIT_API_KEY!
})

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}
\`\`\`

## 4. Set your environment variable
Add your API key to your environment variables:

\`\`\`bash
SPLIT_API_KEY=split_live_your_actual_api_key_here
\`\`\`

✅ That's it! Your application is now tracking AI crawler visits.`,

      installation: `# Installation

Install the package and get your API key to start tracking AI crawler visits.

## 1. Install Package

### npm
\`\`\`bash
npm install @split.dev/analytics
\`\`\`

### yarn
\`\`\`bash
yarn add @split.dev/analytics
\`\`\`

### pnpm
\`\`\`bash
pnpm add @split.dev/analytics
\`\`\`

## 2. Get Your API Key

1. Sign up at [split.dev](https://split.dev)
2. Go to Settings → API Keys
3. Click "Generate New Key"
4. Copy the key immediately (it won't be shown again)

Your API key will look like: \`split_live_1234567890abcdef...\`

## 3. Environment Setup

Add your API key to your environment variables:

\`\`\`bash
# .env.local (Next.js)
SPLIT_API_KEY=split_live_your_actual_api_key_here

# .env (Node.js)
SPLIT_API_KEY=split_live_your_actual_api_key_here
\`\`\`

⚠️ **Security:** Never commit API keys to your repository. Always use environment variables.

## Requirements

| Requirement | Version |
|------------|---------|
| Node.js | 16.8 or later |
| Next.js (optional) | 13.0 or later |
| TypeScript (optional) | 4.5 or later |`
    }
    
    return sections[sectionId] || `# ${sectionId}\n\nContent not available.`
  }

  const CodeBlock = ({ children, language = 'bash', id }: { children: string, language?: string, id: string }) => (
    <div className="relative group my-6 code-block-container">
      <div className="flex items-center justify-between bg-[#0a0a0a] border border-[#1a1a1a] rounded-t-lg px-4 py-2">
        <span className="text-xs text-gray-400 font-mono">{language}</span>
      <button
        onClick={() => copyCode(children, id)}
          className={`copy-button opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-1 text-xs text-gray-400 hover:text-white ${copiedCode === id ? 'copy-success' : ''}`}
      >
        {copiedCode === id ? (
            <>
              <Check className="h-3 w-3" />
              Copied
            </>
        ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
        )}
      </button>
      </div>
      <pre className="bg-[#0a0a0a] border border-t-0 border-[#1a1a1a] rounded-b-lg p-4 overflow-x-auto text-sm font-mono">
        <code className="text-gray-300">{children}</code>
      </pre>
    </div>
  )

  const InfoCard = ({ title, children, variant = 'default' }: { 
    title: string, 
    children: React.ReactNode, 
    variant?: 'default' | 'warning' | 'success' | 'info' 
  }) => {
    const variants = {
} 