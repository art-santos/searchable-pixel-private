'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type OnboardingStep = 'email' | 'content' | 'signup'

interface OnboardingData {
  siteUrl: string
  email: string
  keywords: string[]
  businessOffering: string
  knownFor: string
  competitors: string[]
}

export default function StartPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [newKeyword, setNewKeyword] = useState('')
  const [newCompetitor, setNewCompetitor] = useState('')
  
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    siteUrl: '',
    email: '',
    keywords: [],
    businessOffering: '',
    knownFor: '',
    competitors: []
  })

  // Load URL from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const siteUrl = sessionStorage.getItem('siteUrl')
      if (siteUrl) {
        setOnboardingData(prev => ({ ...prev, siteUrl }))
      } else {
        // Redirect back to homepage if no URL
        router.push('/')
      }
    }
  }, [router])

  const handleEmailSubmit = async () => {
    if (!onboardingData.email || isLoading) return

    setIsLoading(true)

    // Store in localStorage first
    localStorage.setItem('onboardingData', JSON.stringify(onboardingData))

    try {
      // Submit to Loops API using proper form endpoint (non-blocking)
      const formBody = `email=${encodeURIComponent(onboardingData.email)}&siteUrl=${encodeURIComponent(onboardingData.siteUrl)}&userGroup=${encodeURIComponent('Website signups')}&source=${encodeURIComponent('Onboarding form')}`
      
      fetch('https://app.loops.so/api/newsletter-form/cmb5vrlua29icyq0iha1pm14f', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody,
      }).then(response => {
        if (response.ok) {
          console.log('Successfully added to Loops')
        } else {
          console.error('Loops signup failed:', response.status)
        }
      }).catch(error => {
        console.error('Newsletter signup error:', error)
        // Don't block the flow on newsletter errors
      })

      // Continue to next step regardless of newsletter result
      setTimeout(() => {
        setCurrentStep('content')
        setIsLoading(false)
      }, 800)
    } catch (error) {
      console.error('Error:', error)
      setCurrentStep('content')
      setIsLoading(false)
    }
  }

  const handleContentSubmit = () => {
    // Store updated data in localStorage
    localStorage.setItem('onboardingData', JSON.stringify(onboardingData))
    setCurrentStep('signup')
  }

  const handleBack = () => {
    switch (currentStep) {
      case 'content':
        setCurrentStep('email')
        break
      case 'signup':
        setCurrentStep('content')
        break
    }
  }

  const addKeyword = () => {
    if (newKeyword.trim()) {
      setOnboardingData(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }))
      setNewKeyword('')
    }
  }

  const removeKeyword = (index: number) => {
    setOnboardingData(prev => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== index)
    }))
  }

  const addCompetitor = () => {
    if (newCompetitor.trim()) {
      setOnboardingData(prev => ({
        ...prev,
        competitors: [...prev.competitors, newCompetitor.trim()]
      }))
      setNewCompetitor('')
    }
  }

  const removeCompetitor = (index: number) => {
    setOnboardingData(prev => ({
      ...prev,
      competitors: prev.competitors.filter((_, i) => i !== index)
    }))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 'email':
        return onboardingData.email.length > 0
      case 'content':
        return onboardingData.keywords.length > 0 || onboardingData.businessOffering || onboardingData.knownFor
      default:
        return false
    }
  }

  const getStepNumber = () => {
    switch (currentStep) {
      case 'email': return 1
      case 'content': return 2
      case 'signup': return 3
      default: return 1
    }
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white rounded-full" />
                <span className="text-sm text-white font-medium">Setup</span>
              </div>
              <span className="text-xs text-[#666] font-mono">Step {getStepNumber()} / 3</span>
            </div>
            <div className="w-full h-px bg-[#1a1a1a]">
              <motion.div 
                className="h-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: `${(getStepNumber() / 3) * 100}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Email Capture */}
            {currentStep === 'email' && (
              <motion.div
                key="email"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-[#0c0c0c] border border-[#1a1a1a] p-8"
              >
                <div className="mb-8">
                  <h1 className="text-2xl font-medium text-white mb-2">
                    Get your free AI visibility score
                  </h1>
                  <p className="text-sm text-[#666]">
                    We'll analyze <span className="text-white font-mono">{onboardingData.siteUrl}</span> and show you exactly how visible you are to AI engines.
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      Enter your work email to continue
                    </label>
                    <Input
                      type="email"
                      placeholder="you@company.com"
                      value={onboardingData.email}
                      onChange={(e) => setOnboardingData(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-[#1a1a1a] border-[#333] text-white h-12 text-base"
                      onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                    />
                  </div>

                  <div className="bg-[#1a1a1a] border border-[#333] p-4">
                    <div className="text-sm text-white font-medium mb-2">What happens next:</div>
                    <div className="space-y-2 text-xs text-[#ccc]">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-white rounded-full" />
                        <span>We'll run 100+ AI queries to test your visibility</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-white rounded-full" />
                        <span>Get your score + actionable insights</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-white rounded-full" />
                        <span>See exactly where you're missing citations</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleEmailSubmit}
                    disabled={!canProceed() || isLoading}
                    className="w-full bg-white text-black hover:bg-gray-100 h-12 text-base font-medium"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                    ) : null}
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  <div className="text-center text-xs text-[#666]">
                    Free analysis • No credit card required • Results in 2 minutes
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Content Strategy */}
            {currentStep === 'content' && (
              <motion.div
                key="content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-[#0c0c0c] border border-[#1a1a1a] p-8"
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-medium text-white mb-2">
                    Tell us about your content strategy
                  </h2>
                  <p className="text-sm text-[#666]">
                    Help our AI understand your business so we can provide better insights.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Keywords */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      Keywords & terms you want to rank for
                    </label>
                    <p className="text-xs text-[#888] mb-3">What search terms should your business appear for?</p>
                    <div className="flex gap-2 mb-3">
                      <Input
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        placeholder="e.g., AI automation, sales tools..."
                        className="bg-[#1a1a1a] border-[#333] text-white h-10 text-sm flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                      />
                      <Button
                        onClick={addKeyword}
                        size="sm"
                        variant="outline"
                        className="border-[#333] hover:border-[#444] h-10 px-3"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {onboardingData.keywords.map((keyword, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 bg-[#1a1a1a] border border-[#333] px-2 py-1"
                        >
                          <span className="text-white text-sm">{keyword}</span>
                          <button
                            onClick={() => removeKeyword(index)}
                            className="text-[#666] hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Business Offering */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      What does your business offer? (optional)
                    </label>
                    <Textarea
                      value={onboardingData.businessOffering}
                      onChange={(e) => setOnboardingData(prev => ({ ...prev, businessOffering: e.target.value }))}
                      placeholder="We provide AI-powered sales automation tools that help B2B companies..."
                      className="bg-[#1a1a1a] border-[#333] text-white text-sm min-h-[80px] resize-none"
                    />
                  </div>

                  {/* What to be known for */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      What do you want to be known for? (optional)
                    </label>
                    <Textarea
                      value={onboardingData.knownFor}
                      onChange={(e) => setOnboardingData(prev => ({ ...prev, knownFor: e.target.value }))}
                      placeholder="The most intuitive AI sales platform that actually works for small teams..."
                      className="bg-[#1a1a1a] border-[#333] text-white text-sm min-h-[60px] resize-none"
                    />
                  </div>

                  {/* Competitors */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      Competitors (optional)
                    </label>
                    <div className="flex gap-2 mb-3">
                      <Input
                        value={newCompetitor}
                        onChange={(e) => setNewCompetitor(e.target.value)}
                        placeholder="competitor.com"
                        className="bg-[#1a1a1a] border-[#333] text-white h-10 text-sm flex-1"
                        onKeyPress={(e) => e.key === 'Enter' && addCompetitor()}
                      />
                      <Button
                        onClick={addCompetitor}
                        size="sm"
                        variant="outline"
                        className="border-[#333] hover:border-[#444] h-10 px-3"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {onboardingData.competitors.map((competitor, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 bg-[#1a1a1a] border border-[#333] px-2 py-1"
                        >
                          <span className="text-white text-sm">{competitor}</span>
                          <button
                            onClick={() => removeCompetitor(index)}
                            className="text-[#666] hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Redirect to Signup */}
            {currentStep === 'signup' && (
              <motion.div
                key="signup"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-[#0c0c0c] border border-[#1a1a1a] p-8 text-center"
              >
                <div className="mb-8">
                  <h2 className="text-2xl font-medium text-white mb-2">
                    Create your account
                  </h2>
                  <p className="text-sm text-[#666]">
                    Almost there! Create your account to see your AI visibility score.
                  </p>
                </div>

                <Button
                  onClick={() => router.push('/signup')}
                  className="w-full bg-white text-black hover:bg-gray-100 h-12 text-base font-medium"
                >
                  Create Account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          {currentStep === 'content' && (
            <div className="flex items-center justify-between mt-6">
              <Button
                onClick={handleBack}
                variant="ghost"
                className="text-[#666] hover:text-white h-10 px-4 text-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <Button
                onClick={handleContentSubmit}
                disabled={!canProceed()}
                className="bg-white text-black hover:bg-gray-100 h-10 px-4 text-sm font-medium"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 