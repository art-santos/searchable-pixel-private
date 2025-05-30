// Example: Protected Analytics Page (Soft Block)
// This shows preview with upgrade prompt for free users

import { ProtectedFeature } from '@/components/subscription/protected-feature'
import { BarChart, TrendingUp, Users } from 'lucide-react'

export default function CompetitorAnalyticsPage() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Competitor Analysis
        </h1>
        <p className="text-[#888]">
          Track and compare your visibility against competitors
        </p>
      </div>
      
      {/* This content will be blurred with upgrade prompt for free/visibility users */}
      <ProtectedFeature
        requiredPlan="plus"
        feature="competitor-analysis"
        soft={true}
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Competitor Cards */}
          {['competitor1.com', 'competitor2.com', 'competitor3.com'].map((domain) => (
            <div key={domain} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-white">{domain}</h3>
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#888]">Visibility Score</span>
                    <span className="text-white font-medium">87/100</span>
                  </div>
                  <div className="h-2 bg-[#1a1a1a] rounded">
                    <div className="h-2 bg-green-400 rounded" style={{ width: '87%' }} />
                  </div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-[#888]">Keywords</span>
                  <span className="text-white">1,234</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-[#888]">Traffic</span>
                  <span className="text-white">45.2K</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Comparison Chart */}
        <div className="mt-8 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <BarChart className="w-6 h-6 text-white" />
            <h2 className="text-xl font-medium text-white">Performance Comparison</h2>
          </div>
          
          <div className="h-64 flex items-center justify-center text-[#666]">
            {/* Chart would go here */}
            <p>Interactive comparison chart</p>
          </div>
        </div>
      </ProtectedFeature>
    </div>
  )
} 