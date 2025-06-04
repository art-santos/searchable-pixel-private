import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus, Minus, Globe, AlertCircle, CreditCard, Check, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DomainAddonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentDomains: number
  onSuccess: () => void
}

export function DomainAddonDialog({ 
  open, 
  onOpenChange, 
  currentDomains, 
  onSuccess 
}: DomainAddonDialogProps) {
  const [selectedQuantity, setSelectedQuantity] = useState(currentDomains)
  const [isProcessing, setIsProcessing] = useState(false)
  const [step, setStep] = useState<'select' | 'confirm' | 'processing' | 'success'>('select')
  const { toast } = useToast()

  const pricePerDomain = 100
  const currentCost = currentDomains * pricePerDomain
  const newCost = selectedQuantity * pricePerDomain
  const difference = newCost - currentCost
  const isUpgrade = selectedQuantity > currentDomains
  const isDowngrade = selectedQuantity < currentDomains
  const isRemoval = selectedQuantity === 0

  const handleConfirm = async () => {
    if (selectedQuantity === currentDomains) {
      onOpenChange(false)
      return
    }

    setIsProcessing(true)
    setStep('processing')

    try {
      let action: 'add' | 'update' | 'remove'
      
      if (isRemoval) {
        action = 'remove'
      } else if (currentDomains === 0) {
        action = 'add'
      } else {
        action = 'update'
      }

      const response = await fetch('/api/billing/manage-addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          addonType: 'extra_domains',
          quantity: selectedQuantity
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update domains')
      }

      setStep('success')
      
      // Show success for 2 seconds then close
      setTimeout(() => {
        onSuccess()
        onOpenChange(false)
        setStep('select')
        setSelectedQuantity(currentDomains)
      }, 2000)

    } catch (error) {
      console.error('Error updating domains:', error)
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update domains',
        variant: 'destructive'
      })
      setStep('select')
    } finally {
      setIsProcessing(false)
    }
  }

  const resetDialog = () => {
    setStep('select')
    setSelectedQuantity(currentDomains)
    setIsProcessing(false)
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetDialog()
      onOpenChange(open)
    }}>
      <DialogContent className="sm:max-w-md bg-[#0a0a0a] border-[#1a1a1a]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Globe className="w-5 h-5" />
            {step === 'success' ? 'Domain Updated!' : 'Manage Extra Domains'}
          </DialogTitle>
        </DialogHeader>

        {step === 'select' && (
          <div className="space-y-6">
            {/* Current Status */}
            <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">Current Extra Domains</div>
                  <div className="text-xs text-[#666]">$100 per domain per month</div>
                </div>
                <div className="text-right">
                  <div className="text-white font-medium">{currentDomains}</div>
                  <div className="text-xs text-[#666]">${currentCost}/month</div>
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-white">Select Number of Extra Domains</label>
              <div className="flex items-center justify-center gap-4">
                <Button
                  onClick={() => setSelectedQuantity(Math.max(0, selectedQuantity - 1))}
                  disabled={selectedQuantity === 0}
                  size="sm"
                  variant="outline"
                  className="w-10 h-10 p-0 border-[#333] bg-[#111] hover:bg-[#1a1a1a]"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                
                <div className="bg-[#111] border border-[#1a1a1a] rounded-lg px-6 py-3 min-w-[4rem] text-center">
                  <div className="text-2xl font-semibold text-white">{selectedQuantity}</div>
                  <div className="text-xs text-[#666]">domains</div>
                </div>
                
                <Button
                  onClick={() => setSelectedQuantity(selectedQuantity + 1)}
                  disabled={selectedQuantity >= 10}
                  size="sm"
                  variant="outline"
                  className="w-10 h-10 p-0 border-[#333] bg-[#111] hover:bg-[#1a1a1a]"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-[#666] text-center">Maximum 10 extra domains</p>
            </div>

            {/* Price Preview */}
            {selectedQuantity !== currentDomains && (
              <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-white">Billing Changes</span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#666]">Current monthly cost:</span>
                    <span className="text-white">${currentCost}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#666]">New monthly cost:</span>
                    <span className="text-white">${newCost}</span>
                  </div>
                  <div className="border-t border-[#1a1a1a] pt-2 flex justify-between font-medium">
                    <span className="text-white">
                      {isUpgrade ? 'Additional charge:' : isRemoval ? 'Monthly savings:' : 'Monthly reduction:'}
                    </span>
                    <span className={`${isUpgrade ? 'text-red-400' : 'text-green-400'}`}>
                      {isUpgrade ? '+' : '-'}${Math.abs(difference)}
                    </span>
                  </div>
                </div>

                {isUpgrade && (
                  <div className="text-xs text-[#666] bg-[#0a0a0a] border border-[#1a1a1a] rounded p-2">
                    You'll be charged a prorated amount immediately, then ${newCost}/month on your next billing date.
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={() => onOpenChange(false)}
                variant="ghost"
                className="flex-1 h-10 border-0 bg-transparent hover:bg-[#111] text-[#666] hover:text-white"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setStep('confirm')}
                disabled={selectedQuantity === currentDomains}
                className="flex-1 h-10 bg-[#1a1a1a] hover:bg-[#333] border border-[#333] hover:border-[#444] text-white font-medium"
              >
                {isRemoval ? 'Remove All' : isUpgrade ? 'Upgrade' : 'Downgrade'}
              </Button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-6">
            <div className="bg-[#111] border border-[#1a1a1a] rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <CreditCard className="w-5 h-5 text-blue-400" />
                <span className="font-medium text-white">Confirm Billing Changes</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#666]">Extra domains:</span>
                  <span className="text-white">{currentDomains} → {selectedQuantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Monthly cost:</span>
                  <span className="text-white">${currentCost} → ${newCost}</span>
                </div>
                <div className="border-t border-[#1a1a1a] pt-2 flex justify-between font-medium">
                  <span className="text-white">
                    {isUpgrade ? 'Immediate charge:' : 'Immediate refund:'}
                  </span>
                  <span className={`${isUpgrade ? 'text-red-400' : 'text-green-400'}`}>
                    {isUpgrade ? '+' : '-'}${Math.abs(difference)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-3">
              <p className="text-xs text-[#666] text-center">
                {isUpgrade 
                  ? 'Your card will be charged immediately for the prorated amount.'
                  : isRemoval
                  ? 'Your subscription will be updated and you\'ll receive a prorated refund.'
                  : 'Your subscription will be updated with a prorated adjustment.'
                }
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setStep('select')}
                variant="ghost"
                className="flex-1 h-10 border-0 bg-transparent hover:bg-[#111] text-[#666] hover:text-white"
              >
                Back
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-1 h-10 bg-[#1a1a1a] hover:bg-[#333] border border-[#333] hover:border-[#444] text-white font-medium"
              >
                Confirm & {isUpgrade ? 'Pay' : 'Update'}
              </Button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="py-12 text-center space-y-4">
            <div className="w-12 h-12 border-2 border-[#333] border-t-white rounded-full animate-spin mx-auto" />
            <div>
              <div className="text-white font-medium">Processing...</div>
              <div className="text-sm text-[#666]">Updating your subscription</div>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="py-12 text-center space-y-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <div className="text-white font-medium">Successfully Updated!</div>
              <div className="text-sm text-[#666]">
                {isRemoval 
                  ? 'All extra domains removed'
                  : `Extra domains updated to ${selectedQuantity}`
                }
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 