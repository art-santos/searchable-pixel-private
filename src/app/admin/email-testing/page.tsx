'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Mail, CheckCircle, XCircle } from 'lucide-react'

export default function AdminEmailTestingPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [testEmail, setTestEmail] = useState('')
  const [emailType, setEmailType] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const router = useRouter()
  const supabase = createClient()

  const emailTypes = [
    { value: 'first-crawler', label: 'First Crawler Email', description: 'Welcome email when first bot visits' },
    { value: 'weekly-report', label: 'Weekly Report', description: 'Weekly activity summary' },
    { value: 'welcome', label: 'Welcome Email', description: 'New user welcome message' },
  ]

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        // Check if user is authenticated
        const { data: { user }, error } = await supabase?.auth.getUser() || { data: { user: null }, error: null }
        
        if (error || !user) {
          router.push('/login')
          return
        }

        // Check if user has @split.dev email
        if (!user.email?.endsWith('@split.dev')) {
          router.push('/dashboard')
          return
        }

        // Check if admin password was verified recently (within 24 hours)
        const adminVerified = localStorage.getItem('admin_verified')
        const adminVerifiedAt = localStorage.getItem('admin_verified_at')
        
        if (!adminVerified || adminVerified !== 'true') {
          router.push('/admin/verify')
          return
        }

        if (adminVerifiedAt) {
          const verifiedTime = new Date(adminVerifiedAt)
          const now = new Date()
          const hoursSinceVerification = (now.getTime() - verifiedTime.getTime()) / (1000 * 60 * 60)
          
          // Require re-verification after 24 hours
          if (hoursSinceVerification > 24) {
            localStorage.removeItem('admin_verified')
            localStorage.removeItem('admin_verified_at')
            router.push('/admin/verify')
            return
          }
        }

        setUser(user)
      } catch (error) {
        console.error('Error checking admin access:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminAccess()
  }, [router, supabase])

  const sendTestEmail = async () => {
    if (!testEmail || !emailType) return

    setIsSending(true)
    try {
      const response = await fetch('/api/admin/test-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: emailType,
          testEmail: testEmail,
          adminUserId: user?.id
        })
      })

      const result = await response.json()
      
      setResults(prev => [{
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        type: emailType,
        email: testEmail,
        success: result.success,
        result: result
      }, ...prev.slice(0, 9)]) // Keep last 10 results

    } catch (error) {
      console.error('Test email error:', error)
      setResults(prev => [{
        id: Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        type: emailType,
        email: testEmail,
        success: false,
        result: { error: 'Failed to send test email' }
      }, ...prev.slice(0, 9)])
    } finally {
      setIsSending(false)
    }
  }

  const runAllTests = async () => {
    if (!testEmail) return

    setIsSending(true)
    setResults([])

    for (const type of emailTypes) {
      try {
        const response = await fetch('/api/admin/test-emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: type.value,
            testEmail: testEmail,
            adminUserId: user?.id
          })
        })

        const result = await response.json()
        
        setResults(prev => [...prev, {
          id: Date.now() + Math.random(),
          timestamp: new Date().toLocaleTimeString(),
          type: type.value,
          email: testEmail,
          success: result.success,
          result: result
        }])

        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        setResults(prev => [...prev, {
          id: Date.now() + Math.random(),
          timestamp: new Date().toLocaleTimeString(),
          type: type.value,
          email: testEmail,
          success: false,
          result: { error: 'Failed to send test email' }
        }])
      }
    }

    setIsSending(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
        <div className="text-white">Loading admin email testing...</div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c]">
      <AdminSidebar user={user} />
      <div className="ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Email Campaign Testing</h1>
            <p className="text-[#888888]">
              Test email campaigns with admin privileges
            </p>
          </div>

          <div className="grid gap-6 mb-8">
            <Card className="bg-[#111111] border-[#222222]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Mail className="w-5 h-5" />
                  Test Configuration
                </CardTitle>
                <CardDescription className="text-[#888888]">
                  Configure and send test emails
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test-email" className="text-[#888888]">Test Email Address</Label>
                  <Input
                    id="test-email"
                    type="email"
                    placeholder="recipient@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="bg-[#0c0c0c] border-[#222222] text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-type" className="text-[#888888]">Email Type</Label>
                  <Select value={emailType} onValueChange={setEmailType}>
                    <SelectTrigger className="bg-[#0c0c0c] border-[#222222] text-white">
                      <SelectValue placeholder="Select email type to test" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111111] border-[#222222]">
                      {emailTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value} className="text-white hover:bg-[#222222]">
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-sm text-[#888888]">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={sendTestEmail} 
                    disabled={!testEmail || !emailType || isSending}
                    className="flex-1 bg-white text-[#0c0c0c] hover:bg-gray-200"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Test Email'
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={runAllTests} 
                    disabled={!testEmail || isSending}
                    className="flex-1 border-[#222222] text-white hover:bg-[#222222]"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Running All Tests...
                      </>
                    ) : (
                      'Test All Email Types'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {results.length > 0 && (
              <Card className="bg-[#111111] border-[#222222]">
                <CardHeader>
                  <CardTitle className="text-white">Test Results</CardTitle>
                  <CardDescription className="text-[#888888]">
                    Recent email test results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {results.map((result) => (
                      <div key={result.id} className="flex items-center justify-between p-3 border border-[#222222] rounded-lg">
                        <div className="flex items-center gap-3">
                          {result.success ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                          <div>
                            <div className="font-medium text-white">
                              {emailTypes.find(t => t.value === result.type)?.label || result.type}
                            </div>
                            <div className="text-sm text-[#888888]">
                              {result.email} • {result.timestamp}
                            </div>
                          </div>
                        </div>
                        <Badge variant={result.success ? 'default' : 'destructive'}>
                          {result.success ? 'Sent' : 'Failed'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 