'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Copy, CheckCircle2, ExternalLink, Terminal, FileText, Code2, X } from 'lucide-react'

interface InstallationGuideProps {
  platform?: 'vercel' | 'node' | null
  onComplete?: () => void
  onBack?: () => void
  onClose?: () => void
}

type PackageManager = 'npm' | 'pnpm' | 'yarn'

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
        code: `import { SplitAnalytics, isAICrawler } from '@split.dev/analytics'

const analytics = new SplitAnalytics({
  apiKey: process.env.SPLIT_API_KEY
})

app.use(async (req, res, next) => {
  const userAgent = req.get('User-Agent')
  if (isAICrawler(userAgent)) {
    analytics.autoTrack({
      url: req.url,
      userAgent,
      method: req.method
    }).catch(console.error)
  }
  next()
})`,
        filename: 'server.js',
        icon: Code2
      }
    ]
  }
}

export function InstallationGuide({ platform, onComplete, onBack, onClose }: InstallationGuideProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedPackageManager, setSelectedPackageManager] = useState<PackageManager>('npm')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  if (!platform) {
    return (
      <div className="p-8">
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
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        <div className="space-y-4 mb-8">
          <button
            onClick={() => window.location.href = '/dashboard?setup=vercel'}
            className="w-full p-5 text-left bg-white/70 dark:bg-gray-800/70 hover:bg-white/90 dark:hover:bg-gray-800/90 border border-gray-200/60 dark:border-gray-700/60 rounded-lg transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                <Code2 className="w-6 h-6 text-white dark:text-black" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">Next.js / Vercel</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">React framework with middleware support</div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 ml-auto" />
            </div>
          </button>

          <button
            onClick={() => window.location.href = '/dashboard?setup=node'}
            className="w-full p-5 text-left bg-white/70 dark:bg-gray-800/70 hover:bg-white/90 dark:hover:bg-gray-800/90 border border-gray-200/60 dark:border-gray-700/60 rounded-lg transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <Terminal className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">Node.js / Express</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Server-side JavaScript with Express</div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 ml-auto" />
            </div>
          </button>
        </div>

        {onBack && (
          <div className="text-center">
            <Button
              onClick={onBack}
              variant="ghost"
              className="text-gray-500 dark:text-gray-400"
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
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Choose your package manager:
            </label>
            <div className="flex gap-3 mb-6">
              {(Object.entries(packageManagers) as [PackageManager, typeof packageManagers[PackageManager]][]).map(([key, pm]) => (
                <button
                  key={key}
                  onClick={() => setSelectedPackageManager(key)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${
                    selectedPackageManager === key
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-black border-gray-900 dark:border-white'
                      : 'bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border-gray-300/60 dark:border-gray-600/60 hover:bg-white/80 dark:hover:bg-gray-800/80'
                  }`}
                >
                  {pm.name}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="bg-gray-900/95 dark:bg-black/95 rounded-lg border border-gray-800/60 dark:border-gray-700/60 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-800/80 dark:bg-gray-900/80 border-b border-gray-700/60">
                <div className="flex items-center gap-2 text-gray-400">
                  <Terminal className="w-4 h-4" />
                  <span className="text-sm font-mono">Terminal</span>
                </div>
                <Button
                  onClick={() => copyToClipboard(getInstallCommand())}
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-gray-400 hover:text-white"
                >
                  {copiedCode === getInstallCommand() ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
                <code>{getInstallCommand()}</code>
              </pre>
            </div>
          </div>
        </div>
      )
    }

    if (step.type === 'env') {
      return (
        <div className="space-y-4">
          <div className="bg-blue-50/80 dark:bg-blue-900/30 border border-blue-200/60 dark:border-blue-800/60 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs text-white font-bold">i</span>
              </div>
              <div>
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
                  Get your API key
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Find your API key in Settings → API Keys in your Split dashboard
                </p>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-gray-900/95 dark:bg-black/95 rounded-lg border border-gray-800/60 dark:border-gray-700/60 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-800/80 dark:bg-gray-900/80 border-b border-gray-700/60">
                <div className="flex items-center gap-2 text-gray-400">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-mono">{step.filename}</span>
                </div>
                <Button
                  onClick={() => copyToClipboard(step.code!)}
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-gray-400 hover:text-white"
                >
                  {copiedCode === step.code ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <pre className="p-4 text-sm text-gray-100 overflow-x-auto">
                <code>{step.code}</code>
              </pre>
            </div>
          </div>
        </div>
      )
    }

    if (step.type === 'code') {
      return (
        <div className="relative">
          <div className="bg-gray-900/95 dark:bg-black/95 rounded-lg border border-gray-800/60 dark:border-gray-700/60 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-800/80 dark:bg-gray-900/80 border-b border-gray-700/60">
              <div className="flex items-center gap-2 text-gray-400">
                <Code2 className="w-4 h-4" />
                <span className="text-sm font-mono">{step.filename}</span>
              </div>
              <Button
                onClick={() => copyToClipboard(step.code!)}
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-gray-400 hover:text-white"
              >
                {copiedCode === step.code ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <pre className="p-4 text-sm text-gray-100 overflow-x-auto max-h-80">
              <code>{step.code}</code>
            </pre>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            {instructions.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {instructions.description}
          </p>
          
          {/* Progress indicator */}
          <div className="flex gap-2">
            {instructions.steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index <= currentStep ? "bg-gray-900 dark:bg-white" : "bg-gray-300 dark:bg-gray-600"
                }`}
              />
            ))}
          </div>
        </div>
        {onClose && (
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Current Step */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-10 h-10 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center">
            <step.icon className="w-5 h-5 text-white dark:text-black" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {step.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {step.description}
            </p>
          </div>
        </div>

        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200/60 dark:border-gray-700/60">
        <div>
          {currentStep > 0 && (
            <Button
              onClick={() => setCurrentStep(currentStep - 1)}
              variant="outline"
              className="border-gray-300/60 dark:border-gray-600/60 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => window.open('https://docs.split.dev', '_blank')}
            variant="ghost"
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            Documentation
            <ExternalLink className="w-3 h-3 ml-2" />
          </Button>

          {currentStep < instructions.steps.length - 1 ? (
            <Button
              onClick={() => setCurrentStep(currentStep + 1)}
              variant="ghost"
              className="text-white hover:text-gray-200"
            >
              Next Step
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={onComplete}
              className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100"
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