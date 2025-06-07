'use client'

import { useState, useEffect } from 'react'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Copy, Check, ExternalLink, AlertCircle, Zap } from 'lucide-react'
import { toast } from 'sonner'

interface TrackingPixelSetupProps {
  className?: string
}

export function TrackingPixelSetup({ className }: TrackingPixelSetupProps) {
  const { currentWorkspace } = useWorkspace()
  const [copied, setCopied] = useState<string | null>(null)
  const [currentUrl, setCurrentUrl] = useState('')

  useEffect(() => {
    setCurrentUrl(window.location.origin)
  }, [])

  const generateTrackingCode = (platform: string, options: { url?: string, page?: string } = {}) => {
    if (!currentWorkspace) return ''
    
    const baseUrl = `${currentUrl}/api/track/${currentWorkspace.id}/pixel.gif`
    const params = new URLSearchParams()
    
    if (options.url) params.set('url', options.url)
    if (options.page) params.set('page', options.page)
    
    const paramString = params.toString()
    const trackingUrl = paramString ? `${baseUrl}?${paramString}` : baseUrl
    
    return `<img src="${trackingUrl}" style="display:none" width="1" height="1" alt="">`
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
      steps: [
        'Open your Framer project',
        'Go to Site Settings (gear icon)',
        'Navigate to SEO & Meta tab',
        'Scroll down to Custom Code section',
        'Paste the code in the "Head" field',
        'Publish your site'
      ]
    },
    webflow: {
      title: 'Webflow',
      description: 'Add to Site Settings → Custom Code → Head Code',
      steps: [
        'Open your Webflow project',
        'Go to Site Settings',
        'Navigate to Custom Code tab',
        'Paste the code in "Head Code" section',
        'Publish your site'
      ]
    },
    wordpress: {
      title: 'WordPress',
      description: 'Add to theme header or use a plugin',
      steps: [
        'Go to Appearance → Theme Editor',
        'Select your active theme',
        'Edit header.php file',
        'Paste the code before the closing </head> tag',
        'Save changes'
      ]
    },
    html: {
      title: 'HTML/Static Site',
      description: 'Add to the <head> section of your pages',
      steps: [
        'Open your HTML file',
        'Locate the <head> section',
        'Paste the code before the closing </head> tag',
        'Save and upload your file'
      ]
    }
  }

  if (!currentWorkspace) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            Please select a workspace to generate tracking code
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          <Zap className="inline-block w-6 h-6 mr-2 text-blue-500" />
          HTML Tracking Pixel Setup
        </h2>
        <p className="text-gray-400">
          Add AI crawler tracking to any website platform with a simple HTML snippet.
          Works with Framer, Webflow, WordPress, and any site that allows custom HTML.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Basic Setup */}
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Basic Tracking Code</CardTitle>
            <CardDescription>
              Universal tracking pixel that works on any platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">HTML Code</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(generateTrackingCode('basic'), 'basic')}
                    className="text-gray-400 hover:text-white"
                  >
                    {copied === 'basic' ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <code className="text-sm text-green-400 break-all">
                  {generateTrackingCode('basic')}
                </code>
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="text-blue-400 font-medium mb-1">How it works</div>
                    <div className="text-gray-300">
                      This invisible 1x1 pixel loads when AI crawlers visit your site. 
                      It captures the crawler's user agent and tracks the visit to your dashboard.
                      Human visitors won't see or be affected by this pixel.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform-Specific Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Platform Setup Instructions</CardTitle>
            <CardDescription>
              Step-by-step guides for popular website platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="framer" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-[#0a0a0a]">
                {Object.entries(platformInstructions).map(([key, platform]) => (
                  <TabsTrigger key={key} value={key} className="text-gray-400 data-[state=active]:text-white">
                    {platform.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {Object.entries(platformInstructions).map(([key, platform]) => (
                <TabsContent key={key} value={key} className="mt-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-white font-medium mb-2">{platform.title}</h4>
                      <p className="text-gray-400 text-sm">{platform.description}</p>
                    </div>
                    
                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Code for {platform.title}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(generateTrackingCode(key), key)}
                          className="text-gray-400 hover:text-white"
                        >
                          {copied === key ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <code className="text-sm text-green-400 break-all">
                        {generateTrackingCode(key)}
                      </code>
                    </div>
                    
                    <div>
                      <h5 className="text-white text-sm font-medium mb-2">Setup Steps:</h5>
                      <ol className="space-y-1">
                        {platform.steps.map((step, index) => (
                          <li key={index} className="text-sm text-gray-400 flex items-start gap-2">
                            <span className="text-blue-400 font-mono text-xs mt-1 flex-shrink-0">
                              {index + 1}.
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Advanced Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Advanced Tracking Options</CardTitle>
            <CardDescription>
              Customize your tracking with additional parameters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Page-specific tracking */}
              <div>
                <h4 className="text-white text-sm font-medium mb-3">Page-Specific Tracking</h4>
                <div className="grid gap-3">
                  {[
                    { page: 'home', description: 'Homepage visits' },
                    { page: 'about', description: 'About page visits' },
                    { page: 'blog', description: 'Blog page visits' },
                    { page: 'pricing', description: 'Pricing page visits' }
                  ].map(({ page, description }) => (
                    <div key={page} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-sm text-white">{page.charAt(0).toUpperCase() + page.slice(1)} Page</span>
                          <span className="text-xs text-gray-500 ml-2">{description}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(generateTrackingCode('page', { page }), `page-${page}`)}
                          className="text-gray-400 hover:text-white"
                        >
                          {copied === `page-${page}` ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <code className="text-xs text-green-400 break-all">
                        {generateTrackingCode('page', { page })}
                      </code>
                    </div>
                  ))}
                </div>
              </div>

              {/* Multiple methods */}
              <div>
                <h4 className="text-white text-sm font-medium mb-3">Redundant Tracking (Recommended)</h4>
                <p className="text-gray-400 text-sm mb-3">
                  Use multiple tracking methods for maximum reliability
                </p>
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">Multiple Tracking Methods</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(
                        `${generateTrackingCode('basic')}\n<link rel="dns-prefetch" href="${currentUrl}/api/track/${currentWorkspace?.id}">`, 
                        'multiple'
                      )}
                      className="text-gray-400 hover:text-white"
                    >
                      {copied === 'multiple' ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <code className="text-sm text-green-400 break-all whitespace-pre-wrap">
                    {`${generateTrackingCode('basic')}\n<link rel="dns-prefetch" href="${currentUrl}/api/track/${currentWorkspace?.id}">`}
                  </code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Testing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-white">Testing Your Setup</CardTitle>
            <CardDescription>
              Verify that your tracking pixel is working correctly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="text-green-400 font-medium mb-1">How to test</div>
                    <div className="text-gray-300 space-y-1">
                      <div>1. Add the tracking code to your website</div>
                      <div>2. Use a tool like Perplexity to search for your website</div>
                      <div>3. Wait 30-60 seconds for data to appear</div>
                      <div>4. Check your Split Analytics dashboard for new crawler visits</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full border-[#333] text-gray-300 hover:text-white hover:border-[#444]"
                onClick={() => window.open('/dashboard/crawler-visits', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Live Crawler Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 