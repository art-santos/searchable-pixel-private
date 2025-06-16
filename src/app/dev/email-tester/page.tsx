'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Mail, CheckCircle, XCircle } from 'lucide-react'

export default function EmailTesterPage() {
  // Only show in development - check inside component to avoid build errors
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Page Not Available</h1>
          <p className="text-muted-foreground">
            This development tool is not available in production.
          </p>
        </div>
      </div>
    )
  }

  const [testEmail, setTestEmail] = useState('')
  const [emailType, setEmailType] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])

  const emailTypes = [
    { value: 'first-crawler', label: 'First Crawler Email', description: 'Welcome email when first bot visits' },
    { value: 'weekly-report', label: 'Weekly Report', description: 'Weekly activity summary' },
    { value: 'password-reset', label: 'Password Reset', description: 'Password reset instructions' },
    { value: 'welcome', label: 'Welcome Email', description: 'New user welcome message' },
  ]

  const sendTestEmail = async () => {
    if (!testEmail || !emailType) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/dev/test-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: emailType,
          testEmail: testEmail
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
      setIsLoading(false)
    }
  }

  const runAllTests = async () => {
    if (!testEmail) return

    setIsLoading(true)
    setResults([])

    for (const type of emailTypes) {
      try {
        const response = await fetch('/api/dev/test-emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: type.value,
            testEmail: testEmail
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

    setIsLoading(false)
  }

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Email Campaign Tester</h1>
        <p className="text-muted-foreground">
          Test email campaigns in development environment
        </p>
      </div>

      <div className="grid gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Test Configuration
            </CardTitle>
            <CardDescription>
              Configure and send test emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Test Email Address</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="your-email@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-type">Email Type</Label>
              <Select value={emailType} onValueChange={setEmailType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select email type to test" />
                </SelectTrigger>
                <SelectContent>
                  {emailTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={sendTestEmail} 
                disabled={!testEmail || !emailType || isLoading}
                className="flex-1"
              >
                {isLoading ? (
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
                disabled={!testEmail || isLoading}
                className="flex-1"
              >
                {isLoading ? (
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
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                Recent email test results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.map((result) => (
                  <div key={result.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {result.success ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <div className="font-medium">
                          {emailTypes.find(t => t.value === result.type)?.label || result.type}
                        </div>
                        <div className="text-sm text-muted-foreground">
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

      <Card>
        <CardHeader>
          <CardTitle>Quick Testing Commands</CardTitle>
          <CardDescription>
            Alternative testing methods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Command Line Testing</h4>
              <div className="bg-muted p-3 rounded-md font-mono text-sm">
                <div>node scripts/test-email-campaigns.js all</div>
                <div>node scripts/test-email-campaigns.js first-crawler</div>
                <div>node scripts/test-email-campaigns.js weekly</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">cURL Testing</h4>
              <div className="bg-muted p-3 rounded-md font-mono text-sm">
                                                  <div>curl -X POST localhost:3000/api/dev/test-emails \</div>
                 <div className="pl-4">{`-H "Content-Type: application/json" \\`}</div>
                 <div className="pl-4">{`-d '{"type":"first-crawler","testEmail":"test@example.com"}'`}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 