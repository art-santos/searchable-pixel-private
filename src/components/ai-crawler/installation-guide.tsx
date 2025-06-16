'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Copy, CheckCircle2, ExternalLink, Terminal, FileText, Code2, X, Settings, Zap } from 'lucide-react'

interface InstallationGuideProps {
  platform?: 'vercel' | 'node' | 'webflow' | 'framer' | null
  onComplete?: () => void
  onBack?: () => void
  onClose?: () => void
}

type PackageManager = 'npm' | 'pnpm' | 'yarn'

type StepType = 'install' | 'env' | 'code' | 'instruction'

interface BaseStep {
  title: string
  description: string
  type: StepType
  icon: any
}

interface InstallStep extends BaseStep {
  type: 'install'
}

interface EnvStep extends BaseStep {
  type: 'env'
  code: string
  filename: string
}

interface CodeStep extends BaseStep {
  type: 'code'
  code: string
  filename: string
}

interface InstructionStep extends BaseStep {
  type: 'instruction'
  content: string
}

type Step = InstallStep | EnvStep | CodeStep | InstructionStep

const packageManagers = {
  npm: { name: 'npm', command: 'npm install' },
  pnpm: { name: 'pnpm', command: 'pnpm add' },
  yarn: { name: 'yarn', command: 'yarn add' }
}

const platformInstructions = {
  vercel: {
    title: 'Next.js Setup',
    description: 'Set up AI crawler tracking for your Next.js application',
    steps: [
      {
        title: 'Install Package',
        description: 'Add the Split Analytics package to your project',
        type: 'install' as const,
        icon: Terminal
      },
      {
        title: 'Add API Key',
        description: 'Configure your environment variables',
        type: 'env' as const,
        code: 'SPLIT_API_KEY=your_api_key_here',
        filename: '.env.local',
        icon: FileText
      },
      {
        title: 'Create Middleware',
        description: 'Set up automatic AI crawler detection',
        type: 'code' as const,
        code: `import { NextResponse } from 'next/server'
import { trackCrawlerVisit } from '@split.dev/analytics/middleware'

export async function middleware(request) {
  if (process.env.SPLIT_API_KEY) {
    trackCrawlerVisit(request, {
      apiKey: process.env.SPLIT_API_KEY
    }).catch(console.error)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)']
}`,
        filename: 'middleware.ts',
        icon: Code2
      }
    ]
  },
  node: {
    title: 'Node.js Setup',
    description: 'Set up AI crawler tracking for your Node.js server',
    steps: [
      {
        title: 'Install Package',
        description: 'Add the Split Analytics package to your project',
        type: 'install' as const,
        icon: Terminal
      },
      {
        title: 'Add API Key',
        description: 'Configure your environment variables',
        type: 'env' as const,
        code: 'SPLIT_API_KEY=your_api_key_here',
        filename: '.env',
        icon: FileText
      },
      {
        title: 'Add Middleware',
        description: 'Set up Express middleware for tracking',
        type: 'code' as const,
        code: `import { trackCrawlerVisit, isAICrawler } from '@split.dev/analytics'

app.use(async (req, res, next) => {
  const userAgent = req.get('User-Agent')
  if (isAICrawler(userAgent)) {
    trackCrawlerVisit({
      url: req.url,
      userAgent,
      method: req.method
    }, {
      apiKey: process.env.SPLIT_API_KEY
    }).catch(console.error)
  }
  next()
})`,
        filename: 'server.js',
        icon: Code2
      }
    ]
  },
  webflow: {
    title: 'Webflow Setup',
    description: 'Track AI crawlers on your Webflow site with our lightweight tracking pixel',
    steps: [
      {
        title: 'Get Your Tracking Code',
        description: 'Get your workspace-specific tracking pixel',
        type: 'instruction' as const,
        content: `1. Go to your Split Dashboard
2. Navigate to Settings → Tracking Pixel
3. Copy your tracking code`,
        icon: Settings
      },
      {
        title: 'Add to Webflow',
        description: 'Paste the tracking pixel in your site settings',
        type: 'code' as const,
        code: `<img src="https://split.dev/api/track/YOUR_WORKSPACE_ID/pixel.gif" 
     style="display:none" 
     width="1" 
     height="1" 
     alt="" />`,
        filename: 'Site Settings → Custom Code → Head Code',
        icon: Code2
      },
      {
        title: 'Publish Your Site',
        description: 'Make tracking live on your Webflow site',
        type: 'instruction' as const,
        content: `1. Go to Site Settings
2. Navigate to Custom Code tab
3. Paste in "Head Code" section
4. Publish your site`,
        icon: Zap
      }
    ]
  },
  framer: {
    title: 'Framer Setup',
    description: 'Enable AI crawler detection on your Framer site with our tracking pixel',
    steps: [
      {
        title: 'Get Your Tracking Code',
        description: 'Get your workspace-specific tracking pixel',
        type: 'instruction' as const,
        content: `1. Go to your Split Dashboard
2. Navigate to Settings → Tracking Pixel
3. Copy your tracking code`,
        icon: Settings
      },
      {
        title: 'Add to Framer',
        description: 'Paste the tracking pixel in your SEO settings',
        type: 'code' as const,
        code: `<img src="https://split.dev/api/track/YOUR_WORKSPACE_ID/pixel.gif" 
     style="display:none" 
     width="1" 
     height="1" 
     alt="" />`,
        filename: 'Site Settings → SEO & Meta → Head',
        icon: Code2
      },
      {
        title: 'Publish Your Site',
        description: 'Make tracking live on your Framer site',
        type: 'instruction' as const,
        content: `1. Go to Settings → SEO & Meta
2. Paste code in "Head" field
3. Publish your site`,
        icon: Zap
      }
    ]
  }
} as const

export function InstallationGuide({ platform, onComplete, onBack, onClose }: InstallationGuideProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedPackageManager, setSelectedPackageManager] = useState<PackageManager>('npm')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  if (!platform) {
    return (
      <div className="p-8 animate-in fade-in duration-200">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
              Choose Your Platform
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Select your hosting platform to get setup instructions
            </p>
          </div>
          {onClose && (
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        <div className="space-y-4 mb-8">
          <button
            onClick={() => window.location.href = '/dashboard?setup=vercel'}
            className="w-full p-5 text-left bg-white/70 dark:bg-gray-800/70 border border-gray-200/60 dark:border-gray-700/60 rounded-lg transition-all duration-200 ease-out group hover:bg-white/90 dark:hover:bg-gray-800/90 hover:scale-[1.02] hover:shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-black dark:bg-white rounded-lg flex items-center justify-center transition-transform duration-200 ease-out group-hover:scale-110">
                <Code2 className="w-6 h-6 text-white dark:text-black" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">Next.js / Vercel</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">React framework with middleware support</div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 ml-auto transition-all duration-200 ease-out group-hover:text-gray-600 dark:group-hover:text-gray-300 group-hover:translate-x-1" />
            </div>
          </button>

          <button
            onClick={() => window.location.href = '/dashboard?setup=node'}
            className="w-full p-5 text-left bg-white/70 dark:bg-gray-800/70 border border-gray-200/60 dark:border-gray-700/60 rounded-lg transition-all duration-200 ease-out group hover:bg-white/90 dark:hover:bg-gray-800/90 hover:scale-[1.02] hover:shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center transition-transform duration-200 ease-out group-hover:scale-110">
                <Terminal className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">Node.js / Express</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Server-side JavaScript with Express</div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 ml-auto transition-all duration-200 ease-out group-hover:text-gray-600 dark:group-hover:text-gray-300 group-hover:translate-x-1" />
            </div>
          </button>

          <button
            onClick={() => window.location.href = '/dashboard?setup=webflow'}
            className="w-full p-5 text-left bg-white/70 dark:bg-gray-800/70 border border-gray-200/60 dark:border-gray-700/60 rounded-lg transition-all duration-200 ease-out group hover:bg-white/90 dark:hover:bg-gray-800/90 hover:scale-[1.02] hover:shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center transition-transform duration-200 ease-out group-hover:scale-110">
                <Code2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white">Webflow</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">No-code website builder</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">Lite</span>
                <ArrowRight className="w-5 h-5 text-gray-400 transition-all duration-200 ease-out group-hover:text-gray-600 dark:group-hover:text-gray-300 group-hover:translate-x-1" />
              </div>
            </div>
          </button>

          <button
            onClick={() => window.location.href = '/dashboard?setup=framer'}
            className="w-full p-5 text-left bg-white/70 dark:bg-gray-800/70 border border-gray-200/60 dark:border-gray-700/60 rounded-lg transition-all duration-200 ease-out group hover:bg-white/90 dark:hover:bg-gray-800/90 hover:scale-[1.02] hover:shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center transition-transform duration-200 ease-out group-hover:scale-110">
                <Code2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white">Framer</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Design and development platform</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded">Beta</span>
                <ArrowRight className="w-5 h-5 text-gray-400 transition-all duration-200 ease-out group-hover:text-gray-600 dark:group-hover:text-gray-300 group-hover:translate-x-1" />
              </div>
            </div>
          </button>
        </div>

        {onBack && (
          <div className="text-center">
            <Button
              onClick={onBack}
              variant="ghost"
              className="text-gray-500 dark:text-gray-400 transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        )}
      </div>
    )
  }

  const instructions = platformInstructions[platform]
  const step = instructions.steps[currentStep]

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

  const renderStepContent = () => {
    if (step.type === 'install') {
      return (
        <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Choose your package manager:
            </label>
            <div className="flex gap-3 mb-6">
              {(Object.entries(packageManagers) as [PackageManager, typeof packageManagers[PackageManager]][]).map(([key, pm]) => (
                <button
                  key={key}
                  onClick={() => setSelectedPackageManager(key)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ease-out ${
                    selectedPackageManager === key
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-black border-gray-900 dark:border-white scale-105'
                      : 'bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-300/60 dark:border-gray-600/60 hover:bg-white/80 dark:hover:bg-gray-800/80 hover:scale-105'
                  }`}
                >
                  {pm.name}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="bg-gray-900/95 dark:bg-black/95 rounded-lg border border-gray-800/60 dark:border-gray-700/60 overflow-hidden transition-all duration-200 ease-out hover:shadow-lg">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-800/80 dark:bg-gray-900/80 border-b border-gray-700/60">
                <div className="flex items-center gap-2 text-gray-400">
                  <Terminal className="w-4 h-4" />
                  <span className="text-sm font-mono">Terminal</span>
                </div>
                <Button
                  onClick={() => copyToClipboard(getInstallCommand())}
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 flex items-center justify-center text-gray-400 hover:text-white transition-colors duration-200"
                >
                  {copiedCode === getInstallCommand() ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <pre className="px-3 py-4 text-sm text-gray-100 overflow-x-auto">
                <code>{getInstallCommand()}</code>
              </pre>
            </div>
          </div>
        </div>
      )
    }

    if (step.type === 'env') {
      const envStep = step as EnvStep
      return (
        <div className="space-y-4 animate-in slide-in-from-right-4 fade-in duration-300">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Get your API key from Settings → API Keys in your Split dashboard
          </p>
          
          <div className="relative">
            <div className="bg-gray-900/95 dark:bg-black/95 rounded-lg border border-gray-800/60 dark:border-gray-700/60 overflow-hidden transition-all duration-200 ease-out hover:shadow-lg">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-800/80 dark:bg-gray-900/80 border-b border-gray-700/60">
                <div className="flex items-center gap-2 text-gray-400">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-mono">{envStep.filename}</span>
                </div>
                <Button
                  onClick={() => copyToClipboard(envStep.code)}
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 flex items-center justify-center text-gray-400 hover:text-white transition-colors duration-200"
                >
                  {copiedCode === envStep.code ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <pre className="px-3 py-4 text-sm text-gray-100 overflow-x-auto">
                <code>{envStep.code}</code>
              </pre>
            </div>
          </div>
        </div>
      )
    }

    if (step.type === 'instruction') {
      return (
        <div className="animate-in slide-in-from-right-4 fade-in duration-300">
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <div className="space-y-3">
              {(step as InstructionStep).content?.split('\n').map((line, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="text-gray-500 dark:text-gray-400 font-mono text-sm">{line}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Additional help text */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            {step.title === 'Get Your Tracking Code' && 'You need access to your Split Dashboard to get your tracking code.'}
            {step.title === 'Publish Your Site' && 'Changes will only take effect after publishing.'}
          </p>
        </div>
      )
    }

    if (step.type === 'code') {
      const codeStep = step as CodeStep
      return (
        <div className="animate-in slide-in-from-right-4 fade-in duration-300">
          <div className="bg-gray-900/95 dark:bg-black/95 rounded-lg border border-gray-800/60 dark:border-gray-700/60 overflow-hidden transition-all duration-200 ease-out hover:shadow-lg">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-800/80 dark:bg-gray-900/80 border-b border-gray-700/60">
              <div className="flex items-center gap-2 text-gray-400">
                <Code2 className="w-4 h-4" />
                <span className="text-sm font-mono">{codeStep.filename}</span>
              </div>
              <Button
                onClick={() => copyToClipboard(codeStep.code)}
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 flex items-center justify-center text-gray-400 hover:text-white transition-colors duration-200"
              >
                {copiedCode === codeStep.code ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <pre className="px-3 py-4 text-sm text-gray-100 overflow-x-auto max-h-80">
              <code>{codeStep.code}</code>
            </pre>
          </div>
          
          {/* Additional notes */}
          {(platform === 'webflow' || platform === 'framer') && (
            <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <strong>Note:</strong> The tracking pixel is a 1x1 invisible image (43 bytes) that won't affect your site's appearance or performance. It tracks 25+ AI crawlers including GPTBot, ClaudeBot, and PerplexityBot.
              </p>
            </div>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <div className="p-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {instructions.title}
            </h1>
            <button
              onClick={() => window.open('https://docs.split.dev', '_blank')}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-all duration-200 ease-out hover:scale-105 bg-gray-100/60 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200/60 dark:border-gray-700/60"
            >
              <span>Docs</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {instructions.description}
          </p>
          
          {/* Progress indicator - only show if more than one step */}
          {instructions.steps.length > 1 && (
            <div className="flex gap-2">
              {instructions.steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ease-out ${
                    index <= currentStep ? "bg-gray-900 dark:bg-white scale-110" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
        {onClose && (
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Current Step */}
      <div className="mb-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {step.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {step.description}
          </p>
        </div>

        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200/60 dark:border-gray-700/60">
        <div>
          {currentStep > 0 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all duration-200 ease-out flex items-center gap-2 group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform duration-200 ease-out group-hover:-translate-x-1" />
              Previous
            </button>
          )}
        </div>

        <div>
          {currentStep < instructions.steps.length - 1 ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="text-white hover:text-gray-200 transition-all duration-200 ease-out flex items-center gap-2 group"
            >
              Next
              <ArrowRight className="w-4 h-4 transition-transform duration-200 ease-out group-hover:translate-x-1" />
            </button>
          ) : (
            <Button
              onClick={onComplete}
              className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 ease-out hover:scale-105"
            >
              Complete Setup
              <CheckCircle2 className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
} 