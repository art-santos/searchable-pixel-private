'use client'

import { useState, useEffect } from 'react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, Check, ExternalLink, AlertCircle, Loader2, Info, Code2, PlayCircle, Globe } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface TrackingPixelSetupProps {
  className?: string
}

export function TrackingPixelSetup({ className }: TrackingPixelSetupProps) {
  const { currentWorkspace, loading: workspaceLoading } = useWorkspace()
  const { toast } = useToast()
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedOption, setSelectedOption] = useState<'html' | 'javascript'>('html')
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    // Wait for workspace to be loaded
    if (!workspaceLoading) {
      setLoading(false)
    }
  }, [workspaceLoading])

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
    // Ensure the image completes loading
    img.onload = function() { /* Pixel loaded successfully */ };
    img.onerror = function() { /* Pixel failed to load */ };
    // Append to body to ensure it loads
    document.body.appendChild(img);
  })();
</script>`
    }
    
    return `<img src="${trackingUrl}" style="display:none" width="1" height="1" alt="" />`
  }

  const handleCopy = async (type: 'html' | 'javascript') => {
    const code = generateTrackingCode(type)
    
    if (!code) {
      toast({
        title: 'Error',
        description: 'Please wait for your workspace to load',
        variant: 'destructive'
      })
      return
    }
    
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

  if (loading || workspaceLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
          <p className="text-sm text-gray-600">Loading workspace data...</p>
        </div>
      </div>
    )
  }

  if (!currentWorkspace) {
    return (
      <div className={className}>
        <Alert className="bg-orange-50 border-orange-200">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-700">
            <strong>No workspace selected.</strong> Please create or select a workspace from your dashboard to generate tracking pixels.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className={`space-y-8 ${className}`}>
      <div>
        
        {/* Workspace Info */}
        <div className="bg-gray-100 border border-gray-200 p-4 mb-6">
          <div className="flex items-start gap-3">
            <Globe className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p className="text-sm text-gray-700">
                Your tracking pixel is configured for workspace:
              </p>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-gray-200 text-gray-800 px-2 py-1 border border-gray-300">
                  {currentWorkspace.id}
                </code>
                <span className="text-xs text-gray-600">
                  {currentWorkspace.workspace_name}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                This ID is automatically included in your tracking code below.
              </p>
            </div>
          </div>
        </div>

        {/* Implementation Options */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <h4 className="text-sm font-medium text-gray-900">
              Choose Implementation Method
            </h4>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setSelectedOption('html')}
              className={`p-4 border transition-all ${
                selectedOption === 'html'
                  ? 'bg-gray-50 border-gray-300 text-gray-900'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4" />
                  <span className="font-medium text-sm">HTML</span>
                </div>
                <p className="text-xs text-left">
                  Simple image tag. Works in body sections.
                </p>
              </div>
            </button>
            
            <button
              onClick={() => setSelectedOption('javascript')}
              className={`p-4 border transition-all ${
                selectedOption === 'javascript'
                  ? 'bg-gray-50 border-gray-300 text-gray-900'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4" />
                  <span className="font-medium text-sm">JavaScript</span>
                  <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-600">
                    Framer
                  </span>
                </div>
                <p className="text-xs text-left">
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
              <div className="font-medium text-gray-900 text-sm">
                {selectedOption === 'html' ? 'HTML Tracking Code' : 'JavaScript Tracking Code'}
              </div>
              <div className="text-xs text-gray-600 mt-1">
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
              className="bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 text-sm h-8 px-4 flex items-center gap-2"
            >
              {copiedCode === selectedOption ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
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
              className="bg-gray-100 border border-gray-200 p-4 cursor-pointer hover:border-gray-300 transition-all overflow-x-auto"
              onClick={() => handleCopy(selectedOption)}
              title="Click to copy"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#d1d5db #f3f4f6'
              }}
            >
              <code className="text-sm text-gray-800 block leading-relaxed select-none whitespace-pre">
                {generateTrackingCode(selectedOption) || 'Loading...'}
              </code>
            </div>
          </div>
          
          {selectedOption === 'javascript' && (
            <div className="bg-orange-50 border border-orange-200 p-3">
              <p className="text-xs text-orange-700">
                <strong>Note for Framer users:</strong> Use this JavaScript version in Site Settings → Custom Code → "Start of &lt;head&gt; tag"
              </p>
            </div>
          )}
        </div>

        {/* Test Pixel */}
        <div className="flex items-center justify-between py-4 border-t border-gray-200">
          <div>
            <div className="font-medium text-gray-900 text-sm">Test Your Pixel</div>
            <div className="text-xs text-gray-600 mt-1">
              Verify your tracking pixel is working correctly
            </div>
          </div>
          <Button
            onClick={async () => {
              setTesting(true)
              try {
                const response = await fetch(`/api/track/${currentWorkspace.id}/test`, {
                  method: 'POST'
                })
                const data = await response.json()
                
                if (data.success) {
                  toast({
                    title: 'Success!',
                    description: data.message,
                  })
                } else {
                  toast({
                    title: 'Test Failed',
                    description: data.error || 'Unable to test pixel',
                    variant: 'destructive'
                  })
                }
              } catch (error) {
                toast({
                  title: 'Error',
                  description: 'Failed to run test',
                  variant: 'destructive'
                })
              } finally {
                setTesting(false)
              }
            }}
            variant="outline"
            size="sm"
            disabled={testing}
            className="bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 text-sm h-8 px-4 flex items-center gap-2"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4" />
                Test Pixel
              </>
            )}
          </Button>
        </div>

        {/* Documentation */}
        <div className="flex items-center justify-between py-4 border-t border-gray-200">
          <div>
            <div className="font-medium text-gray-900 text-sm">Documentation</div>
            <div className="text-xs text-gray-600 mt-1">
              Platform-specific integration guides
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/docs#tracking-pixel', '_blank')}
              className="bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 text-sm h-8 px-4 flex items-center gap-2"
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