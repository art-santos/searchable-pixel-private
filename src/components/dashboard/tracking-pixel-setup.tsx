'use client'

import { useState, useEffect } from 'react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, Check, ExternalLink, AlertCircle, Zap, Code, Globe } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface TrackingPixelSetupProps {
  className?: string
}

export function TrackingPixelSetup({ className }: TrackingPixelSetupProps) {
  const { currentWorkspace } = useWorkspace()
  const [copied, setCopied] = useState<string | null>(null)
  const [currentUrl, setCurrentUrl] = useState('')
  const [activeTab, setActiveTab] = useState('basic')

  useEffect(() => {
    setCurrentUrl('https://split.dev')
  }, [])

  const generateTrackingCode = (platform: string, options: { url?: string, page?: string, campaign?: string } = {}) => {
    if (!currentWorkspace) return ''
    
    const baseUrl = `${currentUrl}/api/track/${currentWorkspace.id}/pixel.gif`
    const params = new URLSearchParams()
    
    if (options.url) params.set('url', options.url)
    if (options.page) params.set('page', options.page)
    if (options.campaign) params.set('c', options.campaign)
    
    const paramString = params.toString()
    const trackingUrl = paramString ? `${baseUrl}?${paramString}` : baseUrl
    
    return `<img src="${trackingUrl}" style="display:none" width="1" height="1" alt="" />`
  }



  const handleCopy = async (code: string, type: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(type)
      toast.success('Tracking code copied to clipboard')
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      toast.error('Failed to copy to clipboard')
    }
  }



  const platformInstructions = {
    framer: {
      title: 'Framer',
      description: 'Add to Site Settings → SEO & Meta → Custom Code',
      icon: <Image src="/images/framer.svg" alt="Framer" width={20} height={20} className="w-5 h-5" />,
      color: 'bg-blue-500',
      steps: [
        'Open your Framer project',
        'Click the Settings icon (⚙️) in the top right',
        'Navigate to SEO & Meta tab',
        'Scroll down to Custom Code section',
        'Paste the tracking code in the "Head" field',
        'Publish your site to activate tracking'
      ]
    },
    webflow: {
      title: 'Webflow',
      description: 'Add to Site Settings → Custom Code → Head Code',
      icon: <Image src="/images/webflow.svg" alt="Webflow" width={20} height={20} className="w-5 h-5" />,
      color: 'bg-purple-500',
      steps: [
        'Open your Webflow project',
        'Go to Site Settings (⚙️)',
        'Navigate to Custom Code tab',
        'Paste the code in "Head Code" section',
        'Publish your site to activate tracking'
      ]
    }
  }

  if (!currentWorkspace) {
    return (
      <div className={className}>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a workspace to set up tracking pixels.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Zap className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-black dark:text-white">
                AI Tracking Pixel Setup
              </h2>
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
                Beta
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Track AI crawlers and AI-to-human conversions on any website
            </p>
          </div>
        </div>


      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">Basic Setup</TabsTrigger>
          <TabsTrigger value="platforms">Platform Guides</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Quick Setup
              </CardTitle>
              <CardDescription>
                Copy and paste this code into your website's &lt;head&gt; section
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tracking Code
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(generateTrackingCode('basic'), 'basic')}
                      className="h-8"
                    >
                      {copied === 'basic' ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <code className="text-sm text-gray-800 dark:text-gray-200 break-all">
                    {generateTrackingCode('basic')}
                  </code>
                </div>



                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> Add this code to every page you want to track. 
                    The pixel is invisible (1x1 pixel) and won't affect your site's appearance.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platforms" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(platformInstructions).map(([key, platform]) => (
              <Card key={key} className="relative">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${platform.color} text-white`}>
                      {platform.icon}
                    </div>
                    <div>
                      <div className="font-semibold">{platform.title}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                        {platform.description}
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      {platform.steps.map((step, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-medium flex items-center justify-center mt-0.5 flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="text-sm text-gray-700 dark:text-gray-300">
                            {step}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          TRACKING CODE
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(generateTrackingCode(key), key)}
                          className="h-7 text-xs"
                        >
                          {copied === key ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                      <code className="text-xs text-gray-600 dark:text-gray-400 break-all block p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                        {generateTrackingCode(key)}
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>


      </Tabs>
    </div>
  )
} 