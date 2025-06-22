'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { ChevronDown, Plus, Crown, Check, X, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { WorkspaceCreationDialog } from '@/components/workspace/workspace-creation-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { PRICING_PLANS } from '@/components/onboarding/utils/onboarding-constants'

interface DomainSelectorProps {
  showAddButton?: boolean
  position?: 'welcome' | 'topbar'
}

export function DomainSelector({ showAddButton = false, position = 'welcome' }: DomainSelectorProps) {
  const { user } = useAuth()
  const { 
    workspaces, 
    currentWorkspace, 
    switchWorkspace, 
    loading: workspaceLoading,
    refreshWorkspaces
  } = useWorkspace()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [showWorkspaceCreationDialog, setShowWorkspaceCreationDialog] = useState(false)
  const [userPlan, setUserPlan] = useState<'starter' | 'pro' | 'team'>('starter')
  const [availableSlots, setAvailableSlots] = useState(0)
  const [showPricingModal, setShowPricingModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isAnnualBilling, setIsAnnualBilling] = useState(false)
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null)

  // Get display text based on position
  const getDisplayText = () => {
    return position === 'welcome' ? 'Select Domain' : ''
  }

  // Determine if user can add more domains
  const canAddDomains = availableSlots > 0
  
  // Get Add Domain text based on plan
  const getAddDomainText = () => {
    if (canAddDomains) {
      return 'Add Domain'
    }
    return userPlan === 'starter' ? 'Upgrade for More Domains' : 'Upgrade Plan'
  }

  // Generate Add icon component
  const AddIcon = canAddDomains ? Plus : Crown

  // Load user plan and calculate available slots
  useEffect(() => {
    const loadUserPlan = async () => {
      if (!user) return
      
      try {
        const response = await fetch('/api/user/subscription')
        if (response.ok) {
          const data = await response.json()
          const plan = data.subscriptionPlan || 'starter'
          setUserPlan(plan)
          setStripeCustomerId(data.stripeCustomerId)
          
          // Calculate available slots
          const maxDomains = plan === 'starter' ? 1 : plan === 'pro' ? 3 : 10
          const usedSlots = workspaces.length
          setAvailableSlots(Math.max(0, maxDomains - usedSlots))

          // Determine if user is on annual billing
          if (data.subscriptionStatus === 'active' && data.subscriptionPeriodEnd) {
            const periodEnd = new Date(data.subscriptionPeriodEnd)
            const now = new Date()
            const monthsUntilEnd = (periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)
            setIsAnnualBilling(monthsUntilEnd > 6)
          }
        }
      } catch (error) {
        console.error('Error loading user plan:', error)
      }
    }

    loadUserPlan()
  }, [user, workspaces])

  const handleWorkspaceSwitch = async (workspaceId: string) => {
    if (workspaceId === currentWorkspace?.id) return
    
    // Find the workspace object from the ID
    const targetWorkspace = workspaces.find(ws => ws.id === workspaceId)
    if (!targetWorkspace) {
      console.error('Workspace not found:', workspaceId)
      return
    }
    
    setLoading(true)
    try {
      await switchWorkspace(targetWorkspace)
    } catch (error) {
      console.error('Error switching workspace:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDomain = () => {
    if (canAddDomains) {
      setShowWorkspaceCreationDialog(true)
    } else {
      // Show pricing modal for upgrade
      setShowPricingModal(true)
    }
  }

  const handlePlanChange = async (planId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          isAnnual: isAnnualBilling,
          customerId: stripeCustomerId,
          customerEmail: user?.email || '',
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error creating checkout session:', errorData.error || 'Failed to create checkout session')
        return
      }

      const { url, error } = await response.json()
      
      if (error) {
        console.error('Error creating checkout session:', error)
        return
      }

      // Close modal before redirecting
      setShowPricingModal(false)
      
      // Redirect to Stripe Checkout
      window.location.href = url
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWorkspaceCreated = async () => {
    await refreshWorkspaces()
    setShowWorkspaceCreationDialog(false)
  }

  // Helper to get favicon URL
  const getFaviconUrl = (domain: string) => {
    if (domain && domain !== 'No domain set') {
      const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '')
      return `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`
    }
    return '/images/default-favicon.svg'
  }

  const getDisplayDomain = () => {
    if (position === 'welcome') {
      return currentWorkspace?.domain || 'No domain set'
    }
    return currentWorkspace?.domain || 'Split'
  }

  const faviconUrl = getFaviconUrl(currentWorkspace?.domain || '')

  if (workspaceLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 bg-gray-200 dark:bg-[#333] rounded animate-pulse" />
        <div className="w-24 h-4 bg-gray-200 dark:bg-[#333] rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex items-center relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="bg-transparent hover:bg-gray-100 dark:hover:bg-transparent p-0 rounded-none flex items-center gap-2"
            disabled={loading}
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 flex items-center justify-center">
                <img 
                  src={faviconUrl}
                  alt="Domain favicon"
                  width={16} 
                  height={16}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-geist-semi text-black dark:text-white truncate max-w-[120px]">
                {getDisplayDomain()}
              </span>
              {getDisplayText() && (
                <span className="text-sm text-gray-500 dark:text-[#A7A7A7]">{getDisplayText()}</span>
              )}
            </div>
            <ChevronDown className="h-4 w-4 text-gray-500 dark:text-[#666666] ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333333] text-black dark:text-white rounded-none min-w-[200px] max-w-[300px]"
          align="end"
          alignOffset={0}
          sideOffset={4}
        >
          {/* Existing workspaces */}
          {workspaces.map((workspace) => (
            <DropdownMenuItem 
              key={workspace.id}
              className="hover:bg-gray-100 dark:hover:bg-[#222222] rounded-none"
              onClick={() => handleWorkspaceSwitch(workspace.id)}
            >
              <div className="flex items-center gap-2 w-full">
                <div className="w-4 h-4 flex items-center justify-center">
                  <img 
                    src={getFaviconUrl(workspace.domain)}
                    alt={workspace.workspace_name}
                    width={16} 
                    height={16}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-sm flex-1 truncate">{workspace.domain || workspace.workspace_name}</span>
                {workspace.id === currentWorkspace?.id && (
                  <Check className="w-4 h-4 text-green-500" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
          
          {workspaces.length === 0 && !loading && (
            <DropdownMenuItem className="hover:bg-gray-100 dark:hover:bg-[#222222] rounded-none">
              <div className="flex items-center gap-2 w-full">
                <div className="w-4 h-4 flex items-center justify-center">
                  <img 
                    src={faviconUrl}
                    alt="Default"
                    width={16} 
                    height={16}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-sm flex-1">{getDisplayDomain()}</span>
                <span className="text-xs text-gray-500 dark:text-[#666] bg-gray-100 dark:bg-[#333] px-1.5 py-0.5 rounded">Default</span>
              </div>
            </DropdownMenuItem>
          )}
          
          {/* Empty slots for available billing capacity */}
          {availableSlots > 0 && canAddDomains && Array.from({ length: availableSlots }, (_, i) => (
            <DropdownMenuItem 
              key={`empty-slot-${i}`}
              className="hover:bg-gray-100 dark:hover:bg-[#222222] cursor-pointer rounded-none border border-dashed border-gray-300 dark:border-[#444] m-1"
              onClick={() => setShowWorkspaceCreationDialog(true)}
            >
              <div className="flex items-center gap-2 w-full opacity-60">
                <div className="w-4 h-4 flex items-center justify-center">
                  <Plus className="w-3 h-3 text-gray-500 dark:text-[#666]" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-gray-500 dark:text-[#666]">Available slot</div>
                  <div className="text-xs text-gray-400 dark:text-[#555]">Click to add workspace</div>
                </div>
                <span className="text-xs text-gray-400 dark:text-[#555] bg-gray-100 dark:bg-[#2a2a2a] px-1.5 py-0.5 rounded">Empty</span>
              </div>
            </DropdownMenuItem>
          ))}
          
          {showAddButton && !canAddDomains && (
            <>
              <DropdownMenuSeparator className="bg-gray-200 dark:bg-[#333333]" />
              <DropdownMenuItem 
                className="hover:bg-gray-100 dark:hover:bg-[#222222] cursor-pointer rounded-none"
                onClick={handleAddDomain}
              >
                <div className="flex items-center gap-2">
                  <AddIcon className="w-4 h-4" />
                  <span className="text-sm">{getAddDomainText()}</span>
                </div>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Workspace Creation Dialog */}
      <WorkspaceCreationDialog
        open={showWorkspaceCreationDialog}
        onOpenChange={setShowWorkspaceCreationDialog}
        onSuccess={handleWorkspaceCreated}
      />

      {/* Pricing Modal - Using exact same structure as billing settings */}
      <AnimatePresence>
        {showPricingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-[#0a0a0a] border-b border-[#1a1a1a] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-medium text-black dark:text-white">Choose Your Plan</h2>
                    <p className="text-sm text-[#666] mt-1">Track AI visibility. Attribute real traffic. Enrich what matters.</p>
                  </div>
                  <button
                    onClick={() => setShowPricingModal(false)}
                    className="text-[#666] hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Billing Toggle */}
                <div className="flex items-center justify-center mt-6">
                  <span className={`text-sm mr-3 ${!isAnnualBilling ? 'text-white' : 'text-[#666]'}`}>Monthly</span>
                  <button
                    onClick={() => setIsAnnualBilling(!isAnnualBilling)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      isAnnualBilling ? 'bg-[#1a1a1a] border border-[#333]' : 'bg-[#333]'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        isAnnualBilling ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-sm ml-3 ${isAnnualBilling ? 'text-white' : 'text-[#666]'}`}>
                    Annual
                    <span className="text-xs text-[#888] ml-1">(save 20%)</span>
                  </span>
                </div>
              </div>
              
              {/* Pricing Plans */}
              <div className="p-6">
                <div className="grid grid-cols-3 gap-6">
                  {PRICING_PLANS.map((plan) => (
                    <div
                      key={plan.id}
                      className={`relative bg-[#0c0c0c] border rounded-lg p-6 ${
                        plan.isRecommended ? 'border-white' : 'border-[#333]'
                      }`}
                    >
                      {plan.isRecommended && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <div className="bg-white text-black px-3 py-1 text-xs font-medium rounded">
                            RECOMMENDED
                          </div>
                        </div>
                      )}

                      <div className="text-center mb-6">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <h3 className="text-lg font-medium text-black dark:text-white">{plan.name}</h3>
                        </div>
                        <p className="text-xs text-[#666] mb-4 leading-relaxed">{plan.description}</p>
                        <div className="flex items-end justify-center gap-1 mt-3">
                          <span className="text-3xl font-semibold text-white">
                            ${isAnnualBilling ? plan.annualPrice : plan.monthlyPrice}
                          </span>
                          <span className="text-[#666] mb-1">/month</span>
                        </div>
                      </div>

                      <div className="space-y-2 mb-6">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 bg-[#666] rounded-full mt-2 flex-shrink-0" />
                            <span className="text-sm text-[#ccc]">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>

                      <Button
                        onClick={() => handlePlanChange(plan.id)}
                        className={`w-full h-10 text-sm font-medium ${
                          userPlan === plan.id
                            ? 'bg-[#333] text-white cursor-default border border-[#555]'
                            : plan.buttonStyle
                        }`}
                        disabled={userPlan === plan.id || isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : userPlan === plan.id ? (
                          'Current Plan'
                        ) : (
                          plan.buttonText
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 