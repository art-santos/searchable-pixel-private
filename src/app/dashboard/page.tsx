'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { WelcomeCard } from './components/welcome-card'
import { CrawlerVisitsCard } from './components/crawler-visits-card'
import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, X, Bell } from 'lucide-react'
import { ConnectAnalyticsDialog } from "@/app/dashboard/components/connect-analytics-dialog"
import { SearchBar } from "@/components/layout/search-bar"
import { DomainSelector } from "@/components/custom/domain-selector"
import { AttributionBySourceWhiteCard } from "./components/attribution-by-source-white-card"
import { HelpCenterWhiteCard } from "./components/help-center-white-card"
import { LeadsWhiteCard } from "./components/leads-white-card"

export default function Dashboard() {
  const { user, supabase, loading } = useAuth()
  const { switching } = useWorkspace()
  const shouldReduceMotion = useReducedMotion()
  const [setupStatus, setSetupStatus] = useState<'success' | 'canceled' | null>(null)
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false)

  // Check for setup status from URL parameters and handle payment success
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const setup = urlParams.get('setup')
      const payment = urlParams.get('payment')
      
      if (setup === 'vercel' || setup === 'node') {
        // Redirect to installation guide for specific platform
        // This will be handled by the connect analytics dialog
      } else if (setup === 'success') {
        setSetupStatus('success')
        // Clean up URL
        window.history.replaceState({}, '', '/dashboard')
      } else if (setup === 'canceled') {
        setSetupStatus('canceled')
        // Clean up URL
        window.history.replaceState({}, '', '/dashboard')
      }

      // Handle payment success - poll for verification due to webhook timing
      if (payment === 'success') {
        setIsVerifyingPayment(true)
        
        let timeoutId: NodeJS.Timeout
        
        const pollPaymentVerification = async (attempts = 0, maxAttempts = 10) => {
          try {
            const response = await fetch('/api/payment-method/verify')
            if (response.ok) {
              const data = await response.json()
              if (data.verified) {
                setSetupStatus('success')
                setIsVerifyingPayment(false)
                // Clean up URL
                window.history.replaceState({}, '', '/dashboard')
                return
              }
            }
            
            // If not verified yet and we haven't exceeded max attempts, try again
            if (attempts < maxAttempts) {
              timeoutId = setTimeout(() => {
                pollPaymentVerification(attempts + 1, maxAttempts)
              }, 1000) // Wait 1 second between attempts
            } else {
              // Max attempts reached, payment verification failed
              console.warn('Payment verification polling timed out')
              setIsVerifyingPayment(false)
              // Clean up URL anyway
              window.history.replaceState({}, '', '/dashboard')
            }
          } catch (error) {
            console.error('Error polling payment verification:', error)
            setIsVerifyingPayment(false)
            // Clean up URL anyway
            window.history.replaceState({}, '', '/dashboard')
          }
        }
        
        pollPaymentVerification()
        
        // Cleanup function to stop polling if component unmounts
        return () => {
          if (timeoutId) {
            clearTimeout(timeoutId)
          }
          setIsVerifyingPayment(false)
        }
      }
    }
  }, [])

  const containerVariants = shouldReduceMotion ? {
    hidden: { opacity: 1 },
    visible: { opacity: 1 }
  } : {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  }

  const cardVariants = shouldReduceMotion ? {
    hidden: { opacity: 1, y: 0 },
    visible: { opacity: 1, y: 0 }
  } : {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f9f9f9]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-black" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9] flex flex-col">
      {/* Top Bar */}
      <div className="w-full pt-4">
        <div className="w-full px-2 sm:px-4">
          <div className="h-[60px] sm:h-[60px] bg-white border border-gray-200 rounded-sm shadow-sm">
            <div className="h-full w-full flex items-center px-3 sm:px-6">
              {/* Logo and Search */}
              <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                {/* Logo */}
                <img 
                  src="/images/split-icon-black.svg" 
                  alt="Split" 
                  className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0"
                />

                {/* Search Bar */}
                <div className="max-w-xl flex-1 search-bar-light min-w-0">
                  <SearchBar />
                </div>
              </div>

              {/* Right Section */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Notifications Bell */}
                <button className="p-1.5 text-gray-500 hover:text-gray-700 transition-colors">
                  <Bell className="w-4 h-4" />
                </button>

                {/* Domain Selector */}
                <div className="domain-selector-light hidden sm:block">
                  <DomainSelector showAddButton position="topbar" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <motion.main 
        className="w-full px-2 sm:px-4 pt-4 pb-6 flex-1"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Payment Verification Banner */}
        {isVerifyingPayment && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-3 rounded-lg border flex items-center gap-3 bg-blue-900/20 border-blue-500/30 text-blue-300"
          >
            <div className="w-5 h-5 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-500" />
            <span className="text-sm font-medium">
              Verifying payment...
            </span>
          </motion.div>
        )}

        {/* Setup Status Banner */}
        {setupStatus && !isVerifyingPayment && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-3 rounded-lg border flex items-center gap-3 ${
              setupStatus === 'success' 
                ? 'bg-green-900/20 border-green-500/30 text-green-300' 
                : 'bg-red-900/20 border-red-500/30 text-red-300'
            }`}
          >
            {setupStatus === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">
              {setupStatus === 'success' 
                ? 'Payment completed successfully!' 
                : 'Setup was canceled'}
            </span>
            <button
              onClick={() => setSetupStatus(null)}
              className="ml-2 hover:opacity-70 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Responsive Card Grid */}
        <div className="grid gap-4 lg:grid-cols-12 lg:grid-rows-2 grid-cols-1 auto-rows-fr">
          {/* Welcome Card */}
          <motion.div 
            variants={cardVariants}
            className="lg:col-span-3 lg:row-span-1 h-[43vh] lg:h-[43vh] min-h-[350px]"
          >
            <WelcomeCard />
          </motion.div>

          {/* Site Crawls Card */}
          <motion.div 
            variants={cardVariants}
            className="lg:col-span-9 lg:row-span-1 h-[43vh] lg:h-[43vh] min-h-[350px]"
          >
            <CrawlerVisitsCard />
          </motion.div>

          {/* Leads Card */}
          <motion.div 
            variants={cardVariants}
            className="lg:col-span-4 lg:row-span-1 h-[43vh] lg:h-[43vh] min-h-[350px] bg-white rounded-sm border border-gray-200 overflow-hidden"
          >
            <LeadsWhiteCard />
          </motion.div>

          {/* Attribution by Source Card */}
          <motion.div 
            variants={cardVariants}
            className="lg:col-span-4 lg:row-span-1 h-[43vh] lg:h-[43vh] min-h-[350px] bg-white rounded-sm border border-gray-200 overflow-hidden"
          >
            <AttributionBySourceWhiteCard />
          </motion.div>

          {/* Help Center Card */}
          <motion.div 
            variants={cardVariants}
            className="lg:col-span-4 lg:row-span-1 h-[43vh] lg:h-[43vh] min-h-[350px] bg-white rounded-sm border border-gray-200 overflow-hidden"
          >
            <HelpCenterWhiteCard />
          </motion.div>
        </div>
      </motion.main>

      {/* Workspace Switching Overlay */}
      {switching && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          style={{ pointerEvents: 'all' }}
        >
          <div className="bg-white rounded-lg p-6 shadow-lg text-center">
            <div className="w-16 h-16 mx-auto mb-4" style={{ perspective: '300px' }}>
              <div 
                className="w-full h-full workspace-flip-animation"
                style={{ 
                  transformStyle: 'preserve-3d'
                }}
              >
                <img 
                  src="/images/split-icon-black.svg" 
                  alt="Split" 
                  className="w-full h-full"
                />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Switching workspace...</h2>
            <p className="text-gray-600 text-sm">Loading your workspace data</p>
          </div>
        </motion.div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap');
        
        @keyframes workspaceFlip {
          0% { transform: rotateY(0deg); }
          25% { transform: rotateY(90deg); }
          50% { transform: rotateY(180deg); }
          75% { transform: rotateY(270deg); }
          100% { transform: rotateY(360deg); }
        }
        
        .workspace-flip-animation {
          animation: workspaceFlip 2s cubic-bezier(0.4, 0.0, 0.2, 1) infinite;
        }
        
        /* Light theme for domain selector */
        .domain-selector-light > div {
          min-width: 200px;
        }
        
        .domain-selector-light button[data-state="closed"],
        .domain-selector-light button[data-state="open"] {
          background-color: transparent;
          border: none;
          padding: 0.5rem 0.75rem;
          height: auto;
          border-radius: 0;
          font-size: 0.9375rem;
          display: flex;
          align-items: center;
          width: 100%;
          justify-content: space-between;
          transition: background-color 0.15s ease;
        }
        
        .domain-selector-light button[data-state="closed"]:hover,
        .domain-selector-light button[data-state="open"]:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
        
        .domain-selector-light button > div {
          gap: 0.5rem !important;
          flex: 1;
          display: flex;
          align-items: center;
        }
        
        .domain-selector-light button svg {
          margin-left: 0.25rem !important;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }
        
        .domain-selector-light button[data-state="open"] svg {
          transform: rotate(180deg);
        }
        
        .domain-selector-light span {
          color: #000 !important;
        }
        
        .domain-selector-light span.truncate {
          overflow: visible !important;
          text-overflow: clip !important;
          white-space: nowrap !important;
          max-width: none !important;
        }
        
        .domain-selector-light svg {
          color: #666 !important;
        }
        
        /* Light theme for search bar */
        .search-bar-light input {
          color: #1f2937 !important;
          background-color: transparent !important;
        }
        
        .search-bar-light input::placeholder {
          color: #6b7280 !important;
        }
        
        .search-bar-light svg {
          color: #6b7280 !important;
        }
        
        .search-bar-light [class*="border-gray"] {
          border-color: #d1d5db !important;
          background-color: transparent !important;
        }
        
        .search-bar-light [class*="text-gray"] {
          color: #374151 !important;
        }
      `}</style>
    </div>
  )
}
 