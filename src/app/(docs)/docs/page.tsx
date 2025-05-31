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
      { id: 'quickstart', title: 'Quickstart', href: '#quickstart', icon: Zap },
      { id: 'installation', title: 'Installation', href: '#installation', icon: Download }
    ]
  },
  {
    id: 'integration',
    title: 'Integration',
    items: [
      { id: 'nextjs', title: 'Next.js', href: '#nextjs', icon: Globe },
      { id: 'nodejs', title: 'Node.js/Express', href: '#nodejs', icon: Server },
      { id: 'custom', title: 'Custom Setup', href: '#custom', icon: Settings }
    ]
  },
  {
    id: 'features',
    title: 'Features',
    items: [
      { id: 'crawlers', title: 'AI Crawler Detection', href: '#crawlers', icon: Bot },
      { id: 'configuration', title: 'Configuration', href: '#configuration', icon: Code2 }
    ]
  }
]

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('quickstart')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<string[]>(['getting-started', 'integration', 'features'])
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
                <h1 className="text-4xl font-bold text-white mb-4">Quickstart</h1>
                <p className="text-gray-400 text-lg leading-relaxed">
                  Get up and running with Split Analytics in under 5 minutes.
                </p>
              </div>
              )}
              {activeSection === 'installation' && (
                <div>
                  <h1 className="text-4xl font-bold text-white mb-4">Installation</h1>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Install the package and get your API key to start tracking AI crawler visits.
                  </p>
              </div>
          )}
              {activeSection === 'nextjs' && (
                <div>
                  <h1 className="text-4xl font-bold text-white mb-4">Next.js Integration</h1>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Comprehensive guide for integrating Split Analytics with Next.js applications.
                  </p>
                </div>
              )}
              {activeSection === 'nodejs' && (
                <div>
                  <h1 className="text-4xl font-bold text-white mb-4">Node.js & Express</h1>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Add Split Analytics to your Node.js or Express applications.
                  </p>
              </div>
              )}
              {activeSection === 'custom' && (
                <div>
                  <h1 className="text-4xl font-bold text-white mb-4">Custom Setup</h1>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Manual integration for any JavaScript environment or custom use cases.
                  </p>
            </div>
          )}
              {activeSection === 'crawlers' && (
              <div>
                  <h1 className="text-4xl font-bold text-white mb-4">AI Crawler Detection</h1>
                <p className="text-gray-400 text-lg leading-relaxed">
                    Comprehensive list of AI crawlers detected by Split Analytics.
                </p>
              </div>
              )}
              {activeSection === 'configuration' && (
                <div>
                  <h1 className="text-4xl font-bold text-white mb-4">Configuration</h1>
                  <p className="text-gray-400 text-lg leading-relaxed">
                    Advanced configuration options for customizing Split Analytics behavior.
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
              <div className="prose prose-invert max-w-none">
                <h2 className="text-xl font-semibold text-white mb-4">Prerequisites</h2>
                <ul className="space-y-2 text-gray-300 mb-8">
                    <li>• Node.js 16.8 or later</li>
                    <li>• A Next.js, Express, or Node.js application</li>
                    <li>• A Split Analytics account (free tier available)</li>
                  </ul>

                <h2 className="text-2xl font-bold text-white mb-6">Step 1: Install the Package</h2>
                <CodeBlock language="bash" id="quickstart-install">npm install @split.dev/analytics</CodeBlock>
                <p className="text-sm text-gray-400 mb-8">
                  Or using yarn: <code className="text-gray-300 bg-[#1a1a1a] px-1.5 py-0.5 rounded">yarn add @split.dev/analytics</code>
                </p>

                <h2 className="text-2xl font-bold text-white mb-6">Step 2: Get Your API Key</h2>
                <p className="text-gray-300 mb-4">Sign in to your Split Analytics dashboard and navigate to Settings → API Keys to generate a new key.</p>
                <p className="text-gray-300 text-sm mb-8">
                  Your API key will look like: <code className="text-white bg-[#1a1a1a] px-2 py-1 rounded">split_live_1234567890abcdef...</code>
                </p>

                <h2 className="text-2xl font-bold text-white mb-6">Step 3: Add to Your Application</h2>
                <p className="text-gray-300 mb-4">For Next.js applications, create a <code className="text-gray-300 bg-[#1a1a1a] px-1.5 py-0.5 rounded">middleware.ts</code> file in your project root:</p>
                <CodeBlock language="typescript" id="quickstart-middleware">{`import { createCrawlerMiddleware } from '@split.dev/analytics/middleware'

export const middleware = createCrawlerMiddleware({
  apiKey: process.env.SPLIT_API_KEY!
})

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}`}</CodeBlock>

                <h2 className="text-2xl font-bold text-white mb-6">Step 4: Set Environment Variable</h2>
                <p className="text-gray-300 mb-4">Add your API key to your environment variables:</p>
                <CodeBlock language="bash" id="quickstart-env">SPLIT_API_KEY=split_live_your_actual_api_key_here</CodeBlock>
                <p className="text-sm text-gray-400 mb-8">
                  Add this to your <code className="text-gray-300 bg-[#1a1a1a] px-1.5 py-0.5 rounded">.env.local</code> file for local development.
                </p>

                <p className="text-gray-300 flex items-center gap-2 mt-8">
                  <Check className="h-5 w-5" />
                  <strong>You're All Set!</strong>
                </p>
                <p className="text-gray-300 mt-2">Your application is now tracking AI crawler visits. Visit your Split Analytics dashboard to see real-time crawler activity on your website.</p>
            </div>
          )}

          {activeSection === 'installation' && (
              <div className="prose prose-invert max-w-none">
                <h2 className="text-2xl font-bold text-white mb-6">1. Install the Package</h2>
                <p className="text-gray-300 mb-4">Choose your preferred package manager to install Split Analytics:</p>
                
                <h3 className="text-lg font-semibold text-white mb-3">npm</h3>
                <CodeBlock language="bash" id="install-npm">npm install @split.dev/analytics</CodeBlock>
                
                <h3 className="text-lg font-semibold text-white mb-3">yarn</h3>
                <CodeBlock language="bash" id="install-yarn">yarn add @split.dev/analytics</CodeBlock>
                
                <h3 className="text-lg font-semibold text-white mb-3">pnpm</h3>
                <CodeBlock language="bash" id="install-pnpm">pnpm add @split.dev/analytics</CodeBlock>

                <h2 className="text-2xl font-bold text-white mb-6 mt-12">2. Get Your API Key</h2>
                <p className="text-gray-300 mb-4">Sign up for Split Analytics and generate your API key:</p>
                
                <ol className="list-decimal list-inside space-y-2 text-gray-300 mb-6">
                  <li>Sign up at <a href="https://split.dev" className="text-white hover:underline">split.dev</a></li>
                  <li>Navigate to Settings → API Keys</li>
                  <li>Click "Generate New Key"</li>
                  <li>Copy the key immediately (it won't be shown again)</li>
                </ol>

                <h3 className="text-white font-medium mb-2">API Key Format</h3>
                <p className="text-gray-300 text-sm mb-6">
                  Your API key will look like: <code className="text-white bg-[#1a1a1a] px-2 py-1 rounded">split_live_1234567890abcdef...</code>
                </p>

                <h2 className="text-2xl font-bold text-white mb-6 mt-12">3. Environment Setup</h2>
                <p className="text-gray-300 mb-4">Add your API key to your environment variables:</p>
                <CodeBlock language="bash" id="env-setup">{`# .env.local (Next.js)
SPLIT_API_KEY=split_live_your_actual_api_key_here

# .env (Node.js)
SPLIT_API_KEY=split_live_your_actual_api_key_here`}</CodeBlock>

                <h3 className="text-white font-medium mb-2">⚠️ Security Best Practice</h3>
                <p className="text-gray-300 text-sm mb-6">
                  Never commit API keys to your repository. Always use environment variables.
                </p>

                <h2 className="text-2xl font-bold text-white mb-6 mt-12">System Requirements</h2>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-[#1a1a1a]">
                    <thead>
                      <tr className="border-b border-[#1a1a1a]">
                        <th className="text-left py-3 px-4 text-white font-medium border-r border-[#1a1a1a]">Requirement</th>
                        <th className="text-left py-3 px-4 text-white font-medium">Version</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-[#1a1a1a]">
                        <td className="py-3 px-4 text-gray-300 border-r border-[#1a1a1a]">Node.js</td>
                        <td className="py-3 px-4 text-gray-300">16.8 or later</td>
                      </tr>
                      <tr className="border-b border-[#1a1a1a]">
                        <td className="py-3 px-4 text-gray-300 border-r border-[#1a1a1a]">Next.js (optional)</td>
                        <td className="py-3 px-4 text-gray-300">13.0 or later</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 text-gray-300 border-r border-[#1a1a1a]">TypeScript (optional)</td>
                        <td className="py-3 px-4 text-gray-300">4.5 or later</td>
                      </tr>
                    </tbody>
                  </table>
              </div>
            </div>
          )}

          {activeSection === 'nextjs' && (
            <div className="space-y-8">
                <p className="text-gray-300">For Next.js 13+ with App Router, we provide zero-configuration middleware that automatically detects and tracks AI crawlers.</p>

                <StepCard number={1} title="Create Middleware">
                  <p>Create a <code className="text-gray-300 bg-[#1a1a1a] px-1.5 py-0.5 rounded">middleware.ts</code> file in your project root:</p>
                  <CodeBlock language="typescript" id="nextjs-middleware">{`import { createCrawlerMiddleware } from '@split.dev/analytics/middleware'

export const middleware = createCrawlerMiddleware({
  apiKey: process.env.SPLIT_API_KEY!,
  // Optional configuration
  debug: process.env.NODE_ENV === 'development',
  exclude: ['/admin/*', '/api/internal/*']
})

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - static files
     * - image optimization files
     * - favicon
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}`}</CodeBlock>
                </StepCard>

                <h3 className="text-xl font-semibold text-white mb-4">Configuration Options</h3>
                <p className="text-gray-300 mb-4">The middleware accepts various configuration options:</p>
                <CodeBlock language="typescript" id="nextjs-config">{`interface MiddlewareConfig {
  // Required
  apiKey: string
  
  // Optional
  apiEndpoint?: string        // Custom API endpoint
  batchSize?: number          // Events per batch (default: 10)
  batchIntervalMs?: number    // Batch interval in ms (default: 5000)
  debug?: boolean             // Enable debug logging
  
  // Path filtering
  exclude?: string[]          // Paths to exclude
  include?: string[]          // Only track these paths
  
  // Response modification
  addCrawlerHeaders?: boolean // Add X-AI-Crawler headers
  
  // Callbacks
  onCrawlerDetected?: (request: NextRequest, crawler: CrawlerInfo) => void
  onError?: (error: Error) => void
}`}</CodeBlock>

                <StepCard number={2} title="Custom Headers">
                  <p>Add custom headers when AI crawlers are detected:</p>
                  <CodeBlock language="typescript" id="nextjs-headers">{`export const middleware = createCrawlerMiddleware({
  apiKey: process.env.SPLIT_API_KEY!,
  addCrawlerHeaders: true,
  onCrawlerDetected: async (request, crawler) => {
    // Custom logic for specific crawlers
    if (crawler.company === 'OpenAI') {
      console.log('GPTBot visited:', request.url)
    }
  }
})`}</CodeBlock>
                  <p className="text-gray-300 mt-4">This will add headers like:</p>
                  <CodeBlock language="text" id="response-headers">{`X-AI-Crawler: true
X-AI-Crawler-Name: GPTBot
X-AI-Crawler-Company: OpenAI`}</CodeBlock>
                </StepCard>

                <FeatureGrid features={[
                  {
                    title: "Automatic Detection",
                    description: "Zero-configuration crawler detection with 15+ supported bots",
                    icon: Bot
                  },
                  {
                    title: "Path Filtering",
                    description: "Include or exclude specific routes from tracking",
                    icon: Settings
                  },
                  {
                    title: "Custom Headers",
                    description: "Add custom response headers for AI crawlers",
                    icon: Code2
                  },
                  {
                    title: "Debug Mode",
                    description: "Detailed logging for development and troubleshooting",
                    icon: Package
                  }
                ]} />
                </div>
            )}

            {activeSection === 'nodejs' && (
              <div className="space-y-8">
                <StepCard number={1} title="Express Middleware">
                  <p>Add AI crawler tracking to your Express app:</p>
                  <CodeBlock language="javascript" id="express-middleware">{`const express = require('express')
const { createNodeMiddleware } = require('@split.dev/analytics')

const app = express()

// Add Split Analytics middleware
app.use(createNodeMiddleware({
  apiKey: process.env.SPLIT_API_KEY,
  debug: process.env.NODE_ENV === 'development'
}))

// Your routes
app.get('/', (req, res) => {
  res.send('Hello World')
})

app.listen(3000)`}</CodeBlock>
                </StepCard>

                <StepCard number={2} title="Node.js HTTP Server">
                  <p>For vanilla Node.js HTTP servers:</p>
                  <CodeBlock language="javascript" id="node-http">{`const http = require('http')
const { detectAICrawler, trackCrawler } = require('@split.dev/analytics')

const config = {
  apiKey: process.env.SPLIT_API_KEY
}

const server = http.createServer(async (req, res) => {
  const startTime = Date.now()
  
  // Detect AI crawler
  const detection = detectAICrawler(req.headers['user-agent'])
  
  if (detection.isAICrawler) {
    // Track asynchronously
    trackCrawler(config, {
      url: req.url,
      userAgent: req.headers['user-agent'],
      responseTime: Date.now() - startTime
    }).catch(console.error)
  }
  
  // Your response logic
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Hello World')
})

server.listen(3000)`}</CodeBlock>
                </StepCard>

                <InfoCard title="Configuration Options">
                  <p>Available options for Node.js middleware:</p>
                  <CodeBlock language="javascript" id="node-config">{`const middleware = createNodeMiddleware({
  // Required
  apiKey: 'your-api-key',
  
  // Optional
  batchSize: 10,                    // Events per batch
  batchIntervalMs: 5000,            // Batch interval
  debug: false,                     // Debug logging
  
  // Custom handlers
  onCrawlerDetected: (req, crawler) => {
    console.log(\`Bot detected: \${crawler.bot}\`)
  },
  onError: (error) => {
    console.error('Analytics error:', error)
  }
})`}</CodeBlock>
                </InfoCard>
            </div>
          )}

            {activeSection === 'custom' && (
            <div className="space-y-8">
                <InfoCard title="Manual Integration" variant="info">
                  <p>Use Split Analytics with any JavaScript environment through our manual detection and tracking functions.</p>
                </InfoCard>

                <StepCard number={1} title="Manual Detection">
                  <p>Use the detection function directly without automatic tracking:</p>
                  <CodeBlock language="javascript" id="manual-detection">{`import { detectAICrawler } from '@split.dev/analytics'

// Basic detection
const userAgent = request.headers['user-agent']
const detection = detectAICrawler(userAgent)

if (detection.isAICrawler) {
  console.log(\`AI Bot: \${detection.crawler.bot} from \${detection.crawler.company}\`)
}

// Detection result structure
{
  isAICrawler: boolean,
  crawler: {
    bot: string,      // e.g., "GPTBot"
    company: string   // e.g., "OpenAI"
  } | null
}`}</CodeBlock>
                </StepCard>

                <StepCard number={2} title="Manual Tracking">
                  <p>Send events manually with full control:</p>
                  <CodeBlock language="javascript" id="manual-tracking">{`import { trackCrawler } from '@split.dev/analytics'

// Track a visit manually
await trackCrawler({
  apiKey: 'your-api-key',
  apiEndpoint: 'https://api.split.dev/v1/track' // optional
}, {
  url: request.url,
  userAgent: request.headers['user-agent'],
  timestamp: new Date().toISOString(),
  responseTime: 150, // optional
  metadata: {        // optional custom data
    source: 'custom-integration',
    version: '1.0.0'
  }
})`}</CodeBlock>
                </StepCard>

                <StepCard number={3} title="Custom Middleware">
                  <p>Build your own middleware for any framework:</p>
                  <CodeBlock language="javascript" id="custom-middleware">{`import { detectAICrawler, trackCrawler } from '@split.dev/analytics'

export function customAnalyticsMiddleware(config) {
  return async (request, response, next) => {
    const startTime = Date.now()
    
    // Detect AI crawler
    const detection = detectAICrawler(request.headers['user-agent'])
    
    if (detection.isAICrawler) {
      // Add custom headers
      response.setHeader('X-AI-Crawler', 'true')
      response.setHeader('X-AI-Crawler-Bot', detection.crawler.bot)
      
      // Track the visit
      trackCrawler(config, {
        url: request.url,
        userAgent: request.headers['user-agent'],
        responseTime: Date.now() - startTime
      }).catch(console.error) // Don't block request
    }
    
    next()
  }
}`}</CodeBlock>
                </StepCard>
              </div>
            )}

            {activeSection === 'crawlers' && (
              <div className="space-y-8">
                <p className="text-gray-300">Split Analytics maintains an up-to-date database of AI crawlers from major companies. Our detection engine is continuously updated as new crawlers emerge.</p>

                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg overflow-hidden">
                  <div className="bg-[#1a1a1a] px-6 py-3 border-b border-[#2a2a2a]">
                    <h3 className="text-white font-semibold">Supported AI Crawlers</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#1a1a1a]">
                          <th className="text-left py-4 px-6 text-white font-medium">Company</th>
                          <th className="text-left py-4 px-6 text-white font-medium">Bot Name</th>
                          <th className="text-left py-4 px-6 text-white font-medium">User Agent Pattern</th>
                          <th className="text-left py-4 px-6 text-white font-medium">Purpose</th>
                      </tr>
                    </thead>
                    <tbody>
                        {[
                          { company: "OpenAI", bot: "GPTBot", pattern: "GPTBot", purpose: "Training data collection" },
                          { company: "OpenAI", bot: "ChatGPT-User", pattern: "ChatGPT-User", purpose: "Real-time browsing" },
                          { company: "Anthropic", bot: "Claude-Web", pattern: "Claude-Web", purpose: "Training and retrieval" },
                          { company: "Perplexity", bot: "PerplexityBot", pattern: "PerplexityBot", purpose: "Search and answers" },
                          { company: "Google", bot: "Google-Extended", pattern: "Google-Extended", purpose: "AI model training" },
                          { company: "Microsoft", bot: "Bingbot", pattern: "bingbot", purpose: "AI-powered search" }
                        ].map((crawler, index) => (
                          <tr key={index} className="border-b border-[#1a1a1a] hover:bg-[#0a0a0a]">
                            <td className="py-4 px-6 text-gray-300">{crawler.company}</td>
                            <td className="py-4 px-6 text-gray-300">{crawler.bot}</td>
                            <td className="py-4 px-6 text-gray-400 font-mono text-sm">{crawler.pattern}</td>
                            <td className="py-4 px-6 text-gray-400 text-sm">{crawler.purpose}</td>
                      </tr>
                        ))}
                    </tbody>
                  </table>
                  </div>
                </div>

                <StepCard number={1} title="Manual Detection">
                  <p>Use the detection function to identify crawlers without tracking:</p>
                  <CodeBlock language="javascript" id="crawler-detection">{`import { detectAICrawler } from '@split.dev/analytics'

// In your request handler
const userAgent = request.headers['user-agent']
const detection = detectAICrawler(userAgent)

if (detection.isAICrawler) {
  console.log(\`Detected: \${detection.crawler.bot} from \${detection.crawler.company}\`)
  
  // Custom handling
  switch (detection.crawler.company) {
    case 'OpenAI':
      // Handle GPT visits
      break
    case 'Anthropic':
      // Handle Claude visits
      break
    default:
      // Handle other AI crawlers
  }
}`}</CodeBlock>
                </StepCard>

                <StepCard number={2} title="Response Customization">
                  <p>Serve different content or add special headers for AI crawlers:</p>
                  <CodeBlock language="javascript" id="response-custom">{`// Block specific crawlers
if (detection.crawler?.company === 'OpenAI') {
  return new Response('Access denied for AI training', { status: 403 })
}

// Add noai directive
response.headers.set('X-Robots-Tag', 'noai')

// Serve simplified content
if (detection.isAICrawler) {
  return serveSimplifiedContent()
}`}</CodeBlock>
                </StepCard>
            </div>
          )}

            {activeSection === 'configuration' && (
              <div className="space-y-8">
                <p className="text-gray-300">Configure Split Analytics using environment variables for secure and flexible deployment across different environments.</p>

                <StepCard number={1} title="Environment Variables">
                  <p>Configure Split Analytics using environment variables:</p>
                  <CodeBlock language="bash" id="env-config">{`# Required
SPLIT_API_KEY=split_live_your_api_key_here

# Optional
SPLIT_DEBUG=true                    # Enable debug mode
SPLIT_BATCH_SIZE=10                 # Events per batch
SPLIT_BATCH_INTERVAL=5000          # Batch interval in ms`}</CodeBlock>
                </StepCard>

                <StepCard number={2} title="Middleware Configuration">
                  <p>Customize middleware behavior with these options:</p>
                  <CodeBlock language="typescript" id="middleware-config">{`export const middleware = createCrawlerMiddleware({
  apiKey: process.env.SPLIT_API_KEY!,
  
  // Batching configuration
  batchSize: 10,              // Events per batch (default: 10)
  batchIntervalMs: 5000,      // Batch interval (default: 5000ms)
  
  // Debug mode
  debug: process.env.NODE_ENV === 'development',
  
  // Path filtering
  exclude: ['/admin/*', '/api/internal/*'],
  include: ['/*'],            // Include all paths by default
  
  // Response customization
  addCrawlerHeaders: true,    // Add X-AI-Crawler headers
  
  // Event callbacks
  onCrawlerDetected: (request, crawler) => {
    console.log(\`AI Bot detected: \${crawler.bot}\`)
  },
  onError: (error) => {
    console.error('Split Analytics error:', error)
  }
})`}</CodeBlock>
                </StepCard>

                <h3 className="text-xl font-semibold text-white mb-4">API Configuration</h3>
                <div className="space-y-4">
                <div>
                    <h4 className="text-white font-medium mb-2">API Key Format</h4>
                    <p className="text-sm text-gray-300">
                      Keys start with <code className="text-gray-300 bg-[#1a1a1a] px-1.5 py-0.5 rounded">split_live_</code> for production or <code className="text-gray-300 bg-[#1a1a1a] px-1.5 py-0.5 rounded">split_test_</code> for development
                    </p>
                </div>
                <div>
                    <h4 className="text-white font-medium mb-2">Domain Security</h4>
                    <p className="text-sm text-gray-300">
                      Configure allowed domains in your dashboard under Settings → API Keys → Domain Restrictions
                    </p>
              </div>
            </div>

                <FeatureGrid features={[
                  {
                    title: "Event Batching",
                    description: "Optimize performance with configurable event batching",
                    icon: Package
                  },
                  {
                    title: "Path Filtering",
                    description: "Include or exclude specific routes from tracking",
                    icon: Settings
                  },
                  {
                    title: "Debug Mode",
                    description: "Detailed logging for development and troubleshooting",
                    icon: Code2
                  },
                  {
                    title: "Custom Callbacks",
                    description: "Hook into crawler detection events with custom logic",
                    icon: Webhook
                  }
                ]} />
              </div>
            )}
            </div>
          
          <DocsFooter />
        </div>
      </div>
    </div>
  )
} 