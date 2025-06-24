'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { CheckCircle2, X, Check, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { UpgradeDialog } from '@/components/subscription/upgrade-dialog'
import { DomainAddonDialog } from '@/components/subscription/domain-addon-dialog'
import { WorkspaceDeletionDialog } from '@/components/workspace/workspace-deletion-dialog'
import type { PlanType } from '@/lib/subscription/config'
import { useAuth } from '@/contexts/AuthContext'

export function SettingsModals() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [upgradeDialogProps, setUpgradeDialogProps] = useState<{
    feature?: string
    requiredPlan?: PlanType
    fromPath?: string
  }>({})
  const [showDomainDialog, setShowDomainDialog] = useState(false)
  const [showWorkspaceDeletionDialog, setShowWorkspaceDeletionDialog] = useState(false)
  const [workspaces, setWorkspaces] = useState<any[]>([])

  // Check URL parameters for upgrade dialog
  useEffect(() => {
    const shouldShowUpgrade = searchParams.get('showUpgrade') === 'true'
    const feature = searchParams.get('feature')
    const requiredPlan = searchParams.get('requiredPlan') as PlanType
    const fromPath = searchParams.get('fromPath')
    
    if (shouldShowUpgrade) {
      setUpgradeDialogProps({
        feature: feature || undefined,
        requiredPlan: requiredPlan || undefined,
        fromPath: fromPath || undefined
      })
      setShowUpgradeDialog(true)
    }
  }, [searchParams])

  // Handle upgrade dialog close
  const handleUpgradeDialogClose = () => {
    setShowUpgradeDialog(false)
    setUpgradeDialogProps({})
  }

  return (
    <>
      {/* Upgrade Dialog */}
      <UpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={handleUpgradeDialogClose}
        feature={upgradeDialogProps.feature}
        requiredPlan={upgradeDialogProps.requiredPlan}
        fromPath={upgradeDialogProps.fromPath}
      />

      {/* Domain Add-on Dialog */}
      <DomainAddonDialog
        open={showDomainDialog}
        onOpenChange={setShowDomainDialog}
      />

      {/* Workspace Deletion Dialog */}
      <WorkspaceDeletionDialog
        open={showWorkspaceDeletionDialog}
        onOpenChange={setShowWorkspaceDeletionDialog}
        workspaces={workspaces}
        onConfirm={() => {
          console.log('Workspace deletion confirmed')
        }}
      />
    </>
  )
} 