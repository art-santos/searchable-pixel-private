'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, ArrowLeft, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useOnboardingState } from './hooks/useOnboardingState'
import { WorkspaceStep } from './steps/WorkspaceStep'
import { PricingStep } from './steps/PricingStep'
import { OnboardingOverlayProps } from './types/onboarding-types'
import { ONBOARDING_STEPS } from './utils/onboarding-constants'

export function OnboardingOverlay({ children, onComplete }: OnboardingOverlayProps) {
  const {
    // State
    showOnboarding,
    currentStep,
    progress,
    isLoading,
    isAnnual,
    workspaceData,
    analyticsData,
    contentData,
    cmsData,
    newKeyword,
    newCompetitor,

    // Setters
    setIsLoading,
    setIsAnnual,
    setWorkspaceData,
    setAnalyticsData,
    setContentData,
    setCmsData,
    setNewKeyword,
    setNewCompetitor,

    // Actions
    goToNextStep,
    goToPreviousStep,
    goToStep,
    canProceed,
    addKeyword,
    removeKeyword,
    addCompetitor,
    removeCompetitor,
    completeOnboarding
  } = useOnboardingState()

  if (!showOnboarding) {
    return <>{children}</>
  }

  const handleNext = async () => {
    if (!canProceed()) return

    setIsLoading(true)

    try {
      // Handle step-specific logic
      switch (currentStep) {
        case ONBOARDING_STEPS.WORKSPACE:
          // Save workspace data and proceed
          goToNextStep()
          break

        case ONBOARDING_STEPS.ANALYTICS:
          // Start analysis and proceed
          goToNextStep()
          break

        case ONBOARDING_STEPS.CONTENT:
          // Save content data and proceed
          goToNextStep()
          break

        case ONBOARDING_STEPS.CMS:
          // Complete setup and start scanning
          goToStep(ONBOARDING_STEPS.SCANNING)
          break

        case ONBOARDING_STEPS.RESULTS:
          // Go to pricing
          goToStep(ONBOARDING_STEPS.PAYWALL)
          break

        default:
          goToNextStep()
      }
    } catch (error) {
      console.error('Error in handleNext:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    if (currentStep === ONBOARDING_STEPS.WORKSPACE) return
    goToPreviousStep()
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case ONBOARDING_STEPS.WORKSPACE:
        return (
          <WorkspaceStep
            workspaceData={workspaceData}
            setWorkspaceData={setWorkspaceData}
          />
        )

      case ONBOARDING_STEPS.ANALYTICS:
        return (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-xl font-medium text-white">Connect Analytics</h2>
              <p className="text-sm text-[#888]">
                Connect your analytics to track performance (optional)
              </p>
            </div>
            {/* Analytics step content would go here */}
          </motion.div>
        )

      case ONBOARDING_STEPS.CONTENT:
        return (
          <motion.div
            key="content"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-xl font-medium text-white">Content Strategy</h2>
              <p className="text-sm text-[#888]">
                Tell us about your business and content goals
              </p>
            </div>
            {/* Content step would go here */}
          </motion.div>
        )

      case ONBOARDING_STEPS.CMS:
        return (
          <motion.div
            key="cms"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-xl font-medium text-white">Content Management</h2>
              <p className="text-sm text-[#888]">
                How do you manage your content?
              </p>
            </div>
            {/* CMS step would go here */}
          </motion.div>
        )

      case ONBOARDING_STEPS.SCANNING:
        return (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-xl font-medium text-white">Analyzing Your Visibility</h2>
              <p className="text-sm text-[#888]">
                We're scanning the web to understand your current AI visibility
              </p>
            </div>
            {/* Scanning progress would go here */}
          </motion.div>
        )

      case ONBOARDING_STEPS.RESULTS:
        return (
          <motion.div
            key="results"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-xl font-medium text-white">Your Visibility Results</h2>
              <p className="text-sm text-[#888]">
                Here's what we found about your AI presence
              </p>
            </div>
            {/* Results would go here */}
          </motion.div>
        )

      case ONBOARDING_STEPS.PAYWALL:
        return (
          <PricingStep
            isAnnual={isAnnual}
            setIsAnnual={setIsAnnual}
            onSelectPlan={completeOnboarding}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-[#333] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-[#333]">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-[#888]">
              Step {Object.values(ONBOARDING_STEPS).indexOf(currentStep) + 1} of {Object.values(ONBOARDING_STEPS).length}
            </div>
            <button
              onClick={completeOnboarding}
              className="text-[#666] hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-[#333] h-1">
            <motion.div
              className="bg-white h-1"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {renderCurrentStep()}
          </AnimatePresence>

          {/* Navigation */}
          {currentStep !== ONBOARDING_STEPS.SCANNING && currentStep !== ONBOARDING_STEPS.PAYWALL && (
            <div className="flex items-center justify-between mt-6">
              <Button
                onClick={handleBack}
                variant="ghost"
                className="text-[#666] hover:text-white h-8 px-3 text-xs"
                disabled={currentStep === ONBOARDING_STEPS.WORKSPACE}
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                Back
              </Button>

              <Button
                onClick={currentStep === ONBOARDING_STEPS.RESULTS ? () => {
                  setIsLoading(true)
                  setTimeout(() => {
                    goToStep(ONBOARDING_STEPS.PAYWALL)
                    setIsLoading(false)
                  }, 300)
                } : handleNext}
                disabled={!canProceed() || isLoading}
                className="bg-white text-black hover:bg-[#f5f5f5] h-8 px-3 text-xs font-medium"
              >
                {isLoading ? (
                  <div className="w-3 h-3 animate-spin rounded-full border border-current border-t-transparent mr-1" />
                ) : (
                  <>
                    {currentStep === ONBOARDING_STEPS.CMS ? 'Complete Setup' : 
                     currentStep === ONBOARDING_STEPS.ANALYTICS ? 'Start Analysis' : 'Continue'}
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 