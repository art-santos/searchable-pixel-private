'use client'

import { useState, useEffect } from 'react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, Check, ExternalLink, AlertCircle, Loader2, Info, Code2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface TrackingPixelSetupProps {
  className?: string
}

export function TrackingPixelSetup({ className }: TrackingPixelSetupProps) {
  const { currentWorkspace } = useWorkspace()
  const { toast } = useToast()
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedOption, setSelectedOption] = useState<'html' | 'javascript'>('html')

  useEffect(() => {
    setLoading(false)
  }, [])

  const generateTrackingCode = (type: 'html' | 'javascript') => {
    if (!currentWorkspace) return ''
    
    const trackingUrl = `https://split.dev/api/track/${currentWorkspace.id}/pixel.gif`
    
    if (type === 'javascript') {
      return `<script>
  (function() {
    var img = new Image();
    img.src = '${trackingUrl}';
    img.style.display = 'none';
    img.width = 1;
    img.height = 1;
    img.alt = '';
  })();
</script>`
    }
    
    return `<img src="${trackingUrl}" style="display:none" width="1" height="1" alt="" />`
  }

  const handleCopy = async (type: 'html' | 'javascript') => {
    const code = generateTrackingCode(type)
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(type)
      toast({
        title: 'Copied!',
        description: 'Tracking pixel copied to clipboard'
      })
      setTimeout(() => setCopiedCode(null), 2000)
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
        
        {/* Workspace Info */}
        <div className="bg-[#0a0a0a] border border-[#333] rounded-sm p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-[#666] mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-sm text-[#ccc] font-mono">
                Your tracking pixel is configured for workspace:
              </p>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-[#222] text-green-400 px-2 py-1 rounded-sm font-mono">
                  {currentWorkspace.workspace_name}
                </code>
                <span className="text-xs text-[#666] font-mono">
                  ID: {currentWorkspace.id}
                </span>
              </div>
              <p className="text-xs text-[#666] font-mono">
                This ID is automatically included in your tracking code below.
              </p>
            </div>
          </div>
        </div>

        {/* Implementation Options */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <h4 className="text-sm font-medium text-black dark:text-white font-mono tracking-tight">
              Choose Implementation Method
            </h4>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedOption('html')}
              className={`p-4 border rounded-sm transition-all ${
                selectedOption === 'html'
                  ? 'bg-[#111] border-[#333] text-white'
                  : 'bg-[#0a0a0a] border-[#222] text-[#666] hover:border-[#333]'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4" />
                  <span className="font-medium font-mono text-sm">HTML</span>
                </div>
                <p className="text-xs text-left font-mono">
                  Simple image tag. Works in body sections.
                </p>
              </div>
            </button>
            
            <button
              onClick={() => setSelectedOption('javascript')}
              className={`p-4 border rounded-sm transition-all ${
                selectedOption === 'javascript'
                  ? 'bg-[#111] border-[#333] text-white'
                  : 'bg-[#0a0a0a] border-[#222] text-[#666] hover:border-[#333]'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4" />
                  <span className="font-medium font-mono text-sm">JavaScript</span>
                  <span className="px-1.5 py-0.5 text-xs bg-green-900/30 text-green-400 rounded font-mono">
                    Framer
                  </span>
                </div>
                <p className="text-xs text-left font-mono">
                  Works in head sections. Required for Framer.
                </p>
              </div>
            </button>
          </div>
        </div>
        
        {/* Tracking Code */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-black dark:text-white font-mono tracking-tight text-sm">
                {selectedOption === 'html' ? 'HTML Tracking Code' : 'JavaScript Tracking Code'}
              </div>
              <div className="text-xs text-gray-500 dark:text-[#666] font-mono tracking-tight mt-1">
                {selectedOption === 'html' 
                  ? 'Add this code to your website\'s <body> section'
                  : 'Add this code to your website\'s <head> section'
                }
              </div>
            </div>
            <Button
              onClick={() => handleCopy(selectedOption)}
              variant="outline"
              size="sm"
              className="text-gray-400 hover:text-white border-[#333] font-mono tracking-tight text-sm h-8 px-4 flex items-center gap-2"
            >
              {copiedCode === selectedOption ? (
                <>
                  <Check className="w-4 h-4 text-green-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Code
                </>
              )}
            </Button>
          </div>
          
          <div className="relative group">
            <div 
              className="bg-[#0a0a0a] border border-[#333] rounded-sm p-4 cursor-pointer hover:border-[#555] transition-all"
              onClick={() => handleCopy(selectedOption)}
              title="Click to copy"
            >
              <code className="text-sm text-[#ccc] font-mono block overflow-x-auto leading-relaxed select-none whitespace-pre">
                {generateTrackingCode(selectedOption)}
              </code>
            </div>
          </div>
          
          {selectedOption === 'javascript' && (
            <div className="bg-orange-900/20 border border-orange-900/30 rounded-sm p-3">
              <p className="text-xs text-orange-400 font-mono">
                <strong>Note for Framer users:</strong> Use this JavaScript version in Site Settings → Custom Code → "Start of &lt;head&gt; tag"
              </p>
            </div>
          )}
        </div>

        {/* Documentation */}
        <div className="flex items-center justify-between py-4 border-t border-gray-200 dark:border-[#1a1a1a]">
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