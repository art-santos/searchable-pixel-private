'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, CheckCircle2, Code2, Copy, Settings, Zap, ArrowRight, Sparkles, Terminal, Plus, ArrowLeft } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { useWorkspace } from '@/contexts/WorkspaceContext'

interface InstallationGuideProps {
  platform: 'vercel' | 'node' | 'webflow' | 'framer'
  onComplete?: () => void
  onBack?: () => void
}

type InstructionStep = {
  title: string
  description: string
  type: 'instruction'
  content: string
  icon: React.ComponentType<{ className?: string }>
}

type CodeStep = {
  title: string
  description: string
  type: 'code'
  code: string
  filename: string
  icon: React.ComponentType<{ className?: string }>
}

type StepType = InstructionStep | CodeStep

interface PlatformInstructions {
  title: string
  description: string
  steps: StepType[]
}

// Helper function to get platform instructions with workspace ID
const getPlatformInstructions = (workspaceId: string): Record<string, PlatformInstructions> => ({
  vercel: {
    title: 'Vercel / Next.js Setup',
    description: 'Add AI crawler tracking to your Next.js app on Vercel',
    steps: [
      {
        title: 'Install Package',
        description: 'Add our SDK to your project',
        type: 'code' as const,
        code: 'npm install @split.dev/analytics',
        filename: 'Terminal',
        icon: Terminal
      },
      {
        title: 'Create Middleware',
        description: 'Add crawler tracking to all routes',
        type: 'code' as const,
        code: `import { splitAnalytics } from '@split.dev/analytics/next'

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}

export default splitAnalytics({
  // Get your API key from the API Keys page
  apiKey: process.env.SPLIT_API_KEY
})`,
        filename: 'middleware.ts',
        icon: Code2
      },
      {
        title: 'Deploy',
        description: 'Push your changes to start tracking',
        type: 'instruction' as const,
        content: `1. Add your API key to environment variables
2. Deploy to Vercel using git push
3. Crawler visits will appear in your dashboard within minutes`,
        icon: Zap
      }
    ]
  },
  node: {
    title: 'Custom Server Setup',
    description: 'Add AI crawler tracking to Express, Fastify, or any Node.js server',
    steps: [
      {
        title: 'Install Package',
        description: 'Add our SDK to your project',
        type: 'code' as const,
        code: 'npm install @split.dev/analytics',
        filename: 'Terminal',
        icon: Terminal
      },
      {
        title: 'Add Middleware',
        description: 'Track all incoming requests',
        type: 'code' as const,
        code: `const { splitAnalytics } = require('@split.dev/analytics')

// Initialize the middleware
const analytics = splitAnalytics({
  apiKey: process.env.SPLIT_API_KEY
})

// For Express
app.use(analytics.express())

// For Fastify
fastify.register(analytics.fastify())

// For raw Node.js
server.on('request', analytics.node())`,
        filename: 'server.js',
        icon: Code2
      },
      {
        title: 'Start Tracking',
        description: 'Deploy your server to begin tracking',
        type: 'instruction' as const,
        content: `1. Add your API key to environment variables
2. Restart your server
3. AI crawler visits will appear in your dashboard`,
        icon: Zap
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
3. Copy your tracking code (it will include your workspace ID)`,
        icon: Settings
      },
      {
        title: 'Add to Webflow',
        description: 'Paste the tracking pixel in your page settings',
        type: 'code' as const,
        code: `<img src="https://split.dev/api/track/${workspaceId}/pixel.gif" 
     style="display:none" 
     width="1" 
     height="1" 
     alt="" />`,
        filename: 'Page Settings → Custom Code → "Before </body> tag"',
        icon: Code2
      },
      {
        title: 'Add to Webflow',
        description: 'Add custom code to your page settings',
        type: 'instruction' as const,
        content: `1. Open your site in the Designer
2. Open Page settings for the page where you'd like to add your code
3. Add your custom code to the "Before </body> tag" section under Custom code
4. Save your changes and publish`,
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
3. Select "JavaScript" implementation for Framer
4. Copy your tracking code (it will include your workspace ID)`,
        icon: Settings
      },
      {
        title: 'Add to Framer',
        description: 'Use the JavaScript version for Framer',
        type: 'code' as const,
        code: `<script>
(function() {
  var img = new Image();
  img.src = 'https://split.dev/api/track/${workspaceId}/pixel.gif';
  img.style.display = 'none';
  img.width = 1;
  img.height = 1;
  img.alt = '';
  img.onload = function() { /* Pixel loaded */ };
  img.onerror = function() { /* Pixel failed */ };
  document.body.appendChild(img);
})();
</script>`,
        filename: 'Site Settings → Custom Code → "Start of <head> tag"',
        icon: Code2
      },
      {
        title: 'Publish Your Site',
        description: 'Make tracking live on your Framer site',
        type: 'instruction' as const,
        content: `1. Open your Framer project
2. Go to Site Settings (gear icon)
3. Scroll down to Custom Code section
4. Paste the code in the "End of <body> tag" field
5. Save & Publish your site`,
        icon: Zap
      }
    ]
  }
})

export function InstallationGuide({ platform, onComplete, onBack }: InstallationGuideProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const { toast } = useToast()
  const { currentWorkspace } = useWorkspace()
  
  // Get the workspace ID, fallback to placeholder if not available
  const workspaceId = currentWorkspace?.id || 'YOUR_WORKSPACE_ID'
  const platformInstructions = getPlatformInstructions(workspaceId)

  // Show platform selection if we're on a supported platform
  if (platform === 'webflow' || platform === 'framer') {
    if (!platformInstructions[platform]) {
      return (
        <div className="space-y-6">
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Platform Not Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Instructions for {platform} are not available yet.
            </p>
          </div>
          {onBack && (
            <div className="text-center">
              <Button onClick={onBack} variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          )}
        </div>
      )
    }
  }

  // Show alternative options for platforms without installation guides
  if ((platform as string) === 'wordpress') {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-800/50 rounded-lg flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            WordPress Support Coming Soon
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Our WordPress plugin is in development. In the meantime, you can use one of these alternatives:
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => window.location.href = '/dashboard?setup=webflow'}
            className="w-full p-5 text-left bg-white/70 dark:bg-gray-800/70 border border-gray-200/60 dark:border-gray-700/60 rounded-lg transition-all duration-200 ease-out group hover:bg-white/90 dark:hover:bg-gray-800/90 hover:scale-[1.02] hover:shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center transition-transform duration-200 ease-out group-hover:scale-110">
                <Code2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white">Webflow</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Visual web design platform</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs bg-gray-700/20 text-gray-300 border border-gray-700/30 rounded">Beta</span>
                <ArrowRight className="w-5 h-5 text-gray-400 transition-all duration-200 ease-out group-hover:text-gray-600 dark:group-hover:text-gray-300 group-hover:translate-x-1" />
              </div>
            </div>
          </button>

          <button
            onClick={() => window.location.href = '/dashboard?setup=framer'}
            className="w-full p-5 text-left bg-white/70 dark:bg-gray-800/70 border border-gray-200/60 dark:border-gray-700/60 rounded-lg transition-all duration-200 ease-out group hover:bg-white/90 dark:hover:bg-gray-800/90 hover:scale-[1.02] hover:shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center transition-transform duration-200 ease-out group-hover:scale-110">
                <Code2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 dark:text-white">Framer</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Design and development platform</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs bg-gray-700/20 text-gray-300 border border-gray-700/30 rounded">Beta</span>
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

  const handleNext = () => {
    if (currentStep < instructions.steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else if (onComplete) {
      onComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(text)
      toast({
        title: 'Copied!',
        description: 'Code copied to clipboard',
      })
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      })
    }
  }

  const renderStepContent = () => {
    if (step.type === 'instruction') {
      const instructionStep = step as InstructionStep
      return (
        <div className="animate-in slide-in-from-right-4 fade-in duration-300">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700 transition-all duration-200 ease-out hover:shadow-lg">
            <div className="whitespace-pre-line text-gray-700 dark:text-gray-300 leading-relaxed">
              {instructionStep.content}
            </div>
          </div>
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
                  <CheckCircle2 className="w-4 h-4 text-gray-300" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <pre className="px-3 py-4 text-sm text-gray-100 overflow-x-auto max-h-80 whitespace-pre-wrap break-all">
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
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2 flex-1">
          {instructions.steps.map((_, index) => (
            <React.Fragment key={index}>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: index <= currentStep ? 1 : 0.8,
                  opacity: index <= currentStep ? 1 : 0.3
                }}
                transition={{ 
                  duration: 0.3,
                  ease: [0.23, 1, 0.32, 1]
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  index < currentStep 
                    ? 'bg-gray-700 text-white' 
                    : index === currentStep 
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-black shadow-lg' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span className="text-xs font-semibold">{index + 1}</span>
                )}
              </motion.div>
              {index < instructions.steps.length - 1 && (
                <div className={`flex-1 h-0.5 transition-colors duration-500 ${
                  index < currentStep ? 'bg-gray-700' : 'bg-gray-200 dark:bg-gray-700'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ 
            duration: 0.3,
            ease: [0.23, 1, 0.32, 1]
          }}
          className="space-y-4"
        >
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300 ${
              currentStep === instructions.steps.length - 1 
                ? 'bg-gray-900 dark:bg-white shadow-lg' 
                : 'bg-gray-800 dark:bg-gray-700'
            }`}>
              {React.createElement(step.icon, { 
                className: `w-6 h-6 ${
                  currentStep === instructions.steps.length - 1 
                    ? 'text-white dark:text-black' 
                    : 'text-gray-300'
                }` 
              })}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {step.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {step.description}
              </p>
            </div>
          </div>

          {renderStepContent()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between pt-4">
        <Button
          onClick={currentStep === 0 && onBack ? onBack : handlePrevious}
          variant="ghost"
          disabled={currentStep === 0 && !onBack}
          className="transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {currentStep === 0 && onBack ? 'Back' : 'Previous'}
        </Button>
        
        <Button
          onClick={handleNext}
          className="bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black transition-all duration-200 hover:scale-105"
        >
          {currentStep === instructions.steps.length - 1 ? 'Complete Setup' : 'Next'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
} 