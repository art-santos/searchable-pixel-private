'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, Globe, Activity } from 'lucide-react'

export default function TestTrackingPage() {
  const [timestamp, setTimestamp] = useState('')

  useEffect(() => {
    setTimestamp(new Date().toLocaleString())
  }, [])

  return (
    <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center p-6">
      <div className="max-w-2xl mx-auto text-center">
        {/* Header */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-green-500/10 rounded-full flex items-center justify-center">
            <Activity className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Tracking Test Page
          </h1>
          <p className="text-xl text-[#666] leading-relaxed">
            This page helps you verify that your Split.dev visitor tracking is working correctly.
          </p>
        </div>

        {/* Test Info */}
        <div className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Page Visit Recorded
              </h3>
              <div className="space-y-2 text-[#666]">
                <p><strong className="text-white">Timestamp:</strong> {timestamp}</p>
                <p><strong className="text-white">Page:</strong> /test-tracking</p>
                <p><strong className="text-white">Purpose:</strong> Tracking verification</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-400" />
                What's Being Tracked
              </h3>
              <div className="space-y-1 text-[#666] text-sm">
                <p>• Your IP address and location</p>
                <p>• Browser and device information</p>
                <p>• Time spent on this page</p>
                <p>• Referrer information</p>
                <p>• Company identification (if possible)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-[#0c0c0c] border border-[#333333] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Next Steps</h3>
          <div className="text-[#666] space-y-3">
            <p>
              1. Go back to your Split.dev dashboard and click "Check Connection"
            </p>
            <p>
              2. If tracking is working, you should see this visit in your leads page
            </p>
            <p>
              3. Data may take a few moments to appear in your dashboard
            </p>
          </div>
          
          <div className="mt-6">
            <a 
              href="/dashboard/leads" 
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              Check My Dashboard
            </a>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[#666]">
            This test respects your privacy. Data is only used for verification purposes.
          </p>
        </div>
      </div>
    </div>
  )
} 