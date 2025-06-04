'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Circle, ArrowRight, BarChart3, Globe, FileText, Zap, Info, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  completed: boolean
  required: boolean
  href?: string
}

interface OnboardingStateProps {
  currentStep?: string
  completedSteps?: string[]
}

export function OnboardingState({ 
  currentStep = 'analytics', 
  completedSteps = [] 
}: OnboardingStateProps) {
  const steps: OnboardingStep[] = [
    {
      id: 'analytics',
      title: 'Connect Analytics',
      description: 'Connect your analytics provider to monitor domain performance',
      icon: <BarChart3 className="w-5 h-5" />,
      completed: completedSteps.includes('analytics'),
      required: true,
      href: '/onboarding/analytics'
    },
    {
      id: 'project',
      title: 'Describe Project',
      description: 'Set up your CMS and content strategy',
      icon: <FileText className="w-5 h-5" />,
      completed: completedSteps.includes('project'),
      required: true,
      href: '/onboarding/project'
    },
    {
      id: 'scan',
      title: 'AI Visibility Scan',
      description: 'Run your first comprehensive site analysis',
      icon: <Globe className="w-5 h-5" />,
      completed: completedSteps.includes('scan'),
      required: true,
      href: '/onboarding/scan'
    }
  ]

  const nextStep = steps.find(step => !step.completed && step.required)
  const completedCount = steps.filter(step => step.completed).length
  const totalSteps = steps.filter(step => step.required).length

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#0c0c0c] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1a1a1a] border border-[#333333] rounded-full mb-6">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">
            Welcome to Split
          </h1>
          <p className="text-gray-400 text-lg">
            Let's get your AEO engine set up in just a few steps
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
            <span>Setup Progress</span>
            <span>{completedCount} of {totalSteps} completed</span>
          </div>
          <div className="w-full bg-[#1a1a1a] rounded-full h-2">
            <div 
              className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(completedCount / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-8">
          {steps.map((step, index) => (
            <Card 
              key={step.id}
              className={`bg-[#0c0c0c] border transition-all duration-200 ${
                step.completed 
                  ? 'border-[#333333] opacity-75' 
                  : step.id === currentStep
                    ? 'border-[#444444] bg-[#111111]'
                    : 'border-[#1a1a1a] hover:border-[#333333]'
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  {/* Step Icon */}
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200 ${
                    step.completed
                      ? 'bg-[#1a1a1a] border-[#333333] text-[#666666]'
                      : step.id === currentStep
                        ? 'bg-[#1a1a1a] border-[#444444] text-white'
                        : 'bg-[#0c0c0c] border-[#1a1a1a] text-[#666666]'
                  }`}>
                    {step.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-[#666666]" />
                    ) : (
                      step.icon
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${
                        step.completed ? 'text-[#666666]' : 'text-white'
                      }`}>
                        {step.title}
                      </h3>
                      {step.required && (
                        <span className="text-xs bg-[#1a1a1a] text-[#888888] px-2 py-0.5 rounded">
                          Required
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${
                      step.completed ? 'text-[#555555]' : 'text-gray-400'
                    }`}>
                      {step.description}
                    </p>
                  </div>

                  {/* Step Action */}
                  {!step.completed && step.href && (
                    <Link href={step.href}>
                      <Button 
                        variant="outline"
                        size="sm"
                        className={`border-[#333333] hover:border-[#444444] transition-all duration-200 ${
                          step.id === currentStep
                            ? 'bg-white text-[#0c0c0c] hover:bg-gray-100'
                            : 'bg-[#1a1a1a] text-white hover:bg-[#222222]'
                        }`}
                      >
                        {step.id === currentStep ? 'Continue' : 'Start'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Next Step CTA */}
        {nextStep && (
          <Card className="bg-[#111111] border-[#333333]">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold text-white mb-2">
                Ready to continue?
              </h3>
              <p className="text-gray-400 mb-4">
                Complete "{nextStep.title}" to unlock your AEO dashboard
              </p>
              <Link href={nextStep.href || '#'}>
                <Button className="bg-white text-[#0c0c0c] hover:bg-gray-100">
                  {nextStep.title}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* All Complete State */}
        {completedCount === totalSteps && (
          <Card className="bg-[#111111] border-[#333333]">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-[#1a1a1a] border border-[#333333] rounded-full mb-4">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Setup Complete!
              </h3>
              <p className="text-gray-400 mb-4">
                Your AEO engine is ready. Let's explore your visibility dashboard.
              </p>
              <Link href="/dashboard">
                <Button className="bg-white text-[#0c0c0c] hover:bg-gray-100">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Complete Setup Button */}
        <div className="mt-4 p-3 bg-[#1a1a1a] border border-[#333] rounded-lg">
          <div className="flex items-center gap-2 text-[#888] text-sm">
            <Info className="w-4 h-4" />
            This is a demo account. Some features may be limited.
          </div>
        </div>

        {/* Demo account notice */}
        {user?.email === 'admin@splitlabs.io' && (
          <div className="mt-4 p-3 bg-[#1a1a1a] border border-[#333] rounded-lg">
            <div className="flex items-center gap-2 text-[#888] text-sm">
              <Info className="w-4 h-4" />
              This is a demo account. Some features may be limited.
            </div>
          </div>
        )}

        <AnimatePresence>
          {state.showWelcome && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed bottom-6 right-6 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 shadow-lg max-w-sm z-50"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#1a1a1a] rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-white mb-1">Welcome to Split!</h3>
                  <p className="text-xs text-[#666] mb-3">
                    Complete your setup to start tracking your AI visibility.
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => dispatch({ type: 'COMPLETE_ONBOARDING' })}
                      className="bg-[#1a1a1a] hover:bg-[#333] border border-[#333] hover:border-[#444] text-white"
                    >
                      Get Started
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
} 