'use client'

import { SplitSidebar } from '@/components/layout/split-sidebar'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { SidebarProvider } from "@/components/ui/sidebar"

export default function ApiKeysLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [showSidebar, setShowSidebar] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  return (
    <AuthenticatedLayout>
      <div className="relative min-h-screen">
        {/* Hover Zone - Much wider strip on left edge */}
        <div 
          className="fixed left-0 top-0 w-32 h-full z-40"
          onMouseEnter={() => setShowSidebar(true)}
        />

        {/* Sidebar Overlay */}
        <AnimatePresence>
          {showSidebar && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={shouldReduceMotion ?
                  { duration: 0.15 } :
                  { 
                    duration: 0.25, 
                    ease: [0.25, 0.1, 0.25, 1] 
                  }
                }
                className="fixed inset-0 bg-black/20 z-40"
                onClick={() => setShowSidebar(false)}
              />
              
              {/* Sidebar Container - includes hover area */}
              <motion.div
                initial={{ 
                  x: -280,
                  opacity: 0.95
                }}
                animate={{ 
                  x: 0,
                  opacity: 1
                }}
                exit={{ 
                  x: -280,
                  opacity: 0.95
                }}
                transition={shouldReduceMotion ? 
                  { duration: 0.15, ease: "easeOut" } :
                  { 
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    mass: 0.8,
                    duration: 0.25
                  }
                }
                className="fixed left-0 top-0 h-full z-50 flex"
                onMouseLeave={() => setShowSidebar(false)}
              >
                <SidebarProvider>
                  <SplitSidebar />
                </SidebarProvider>
                {/* Extended hover area when sidebar is open - much wider */}
                <div className="w-40 h-full" />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex flex-col min-h-screen bg-[#f9f9f9]">
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
} 