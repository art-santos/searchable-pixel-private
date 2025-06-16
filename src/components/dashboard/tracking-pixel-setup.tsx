'use client'

import { useState, useEffect } from 'react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, Check, ExternalLink, AlertCircle, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface TrackingPixelSetupProps {
  className?: string
}

export function TrackingPixelSetup({ className }: TrackingPixelSetupProps) {
  const { currentWorkspace } = useWorkspace()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
  }, [])

  const generateTrackingCode = () => {
    if (!currentWorkspace) return ''
    
    const trackingUrl = `https://split.dev/api/track/${currentWorkspace.id}/pixel.gif`
    
    return `<img src="${trackingUrl}" style="display:none" width="1" height="1" alt="" />`
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generateTrackingCode())
      setCopied(true)
      toast({
        title: 'Copied!',
        description: 'Tracking pixel copied to clipboard'
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!currentWorkspace) {
    return (
      <div className={className}>
        <Alert className="bg-gray-900 border-gray-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a workspace to set up tracking pixels.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className={`space-y-8 ${className}`}>
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-lg font-medium text-black dark:text-white font-mono tracking-tight">Tracking Pixel</h3>
          <span className="px-1.5 py-0.5 text-xs font-medium bg-orange-900/30 text-orange-400 rounded font-mono tracking-tight">
            Beta
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-[#666] mb-6 font-mono tracking-tight">
          Lightweight AI crawler tracking for any website
        </p>
        
        {/* Tracking Code */}
        <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-[#1a1a1a]">
          <div>
            <div className="font-medium text-black dark:text-white font-mono tracking-tight text-sm">HTML Tracking Code</div>
            <div className="text-xs text-gray-500 dark:text-[#666] font-mono tracking-tight mt-1">
              Add this code to your website's &lt;head&gt; section
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right min-w-[20rem] relative group">
              <div 
                className="bg-[#0a0a0a] border border-[#333] rounded-sm p-4 cursor-pointer hover:border-[#555] transition-all group"
                onClick={handleCopy}
                title="Click to copy"
              >
                <code className="text-sm text-[#ccc] font-mono block overflow-x-auto leading-relaxed select-none">
                  {generateTrackingCode()}
                </code>
                
                {/* Hover tooltip */}
                <div className="absolute -top-10 right-0 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-mono">
                  {copied ? (
                    <span className="flex items-center gap-1">
                      <Check className="w-3 h-3 text-green-400" />
                      Copied!
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Copy className="w-3 h-3" />
                      Click to copy
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Documentation */}
        <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-[#1a1a1a]">
          <div>
            <div className="font-medium text-black dark:text-white font-mono tracking-tight text-sm">Documentation</div>
            <div className="text-xs text-gray-500 dark:text-[#666] font-mono tracking-tight mt-1">
              Platform-specific integration guides
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/docs#tracking-pixel', '_blank')}
              className="text-gray-400 hover:text-white border-[#333] font-mono tracking-tight text-sm h-8 px-4 flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              View Docs
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 