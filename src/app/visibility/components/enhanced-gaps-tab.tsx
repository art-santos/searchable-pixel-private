'use client'

import { useState } from 'react'
import { Search, Filter, Target, TrendingUp, Sparkles } from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'

interface EnhancedGapsTabProps {
  hasVisibilityData: boolean
  isRefreshing: boolean
  onRefreshScore: () => void
}

export function EnhancedGapsTab({ hasVisibilityData }: EnhancedGapsTabProps) {
  const { subscription } = useSubscription()
  const hasMaxAccess = subscription?.plan === 'plus' || subscription?.plan === 'pro'
  
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Only render if we have data - empty state handled centrally
  if (!hasVisibilityData) {
    return null
  }

  const gaps = [
    {
      id: 1,
      prompt: 'Best AI agents for GTM teams',
      status: 'missing' as const,
      searchVolume: 'High' as const,
      difficulty: 'Medium' as const,
      suggestion: 'Create comprehensive guide',
      priority: 'high' as const,
      opportunityScore: 85,
      estimatedTraffic: 1250,
      competitorCoverage: ['Salesforce', 'HubSpot']
    },
    {
      id: 2,
      prompt: 'Alternatives to Clay.com',
      status: 'weak' as const,
      searchVolume: 'Medium' as const,
      difficulty: 'Low' as const,
      suggestion: 'Strengthen positioning',
      priority: 'medium' as const,
      opportunityScore: 72,
      estimatedTraffic: 890,
      competitorCoverage: ['Apollo', 'ZoomInfo']
    },
    {
      id: 3,
      prompt: 'Top cold email automation tools 2025',
      status: 'missing' as const,
      searchVolume: 'High' as const,
      difficulty: 'High' as const,
      suggestion: 'Develop comparison content',
      priority: 'high' as const,
      opportunityScore: 78,
      estimatedTraffic: 2100,
      competitorCoverage: ['Outreach', 'Salesloft', 'Apollo']
    },
    {
      id: 4,
      prompt: 'AI SDR vs human SDR comparison',
      status: 'weak' as const,
      searchVolume: 'Medium' as const,
      difficulty: 'Medium' as const,
      suggestion: 'Expand content depth',
      priority: 'medium' as const,
      opportunityScore: 68,
      estimatedTraffic: 750,
      competitorCoverage: ['Gong', 'Chorus']
    },
    {
      id: 5,
      prompt: 'Sales automation ROI calculator',
      status: 'missing' as const,
      searchVolume: 'High' as const,
      difficulty: 'Medium' as const,
      suggestion: 'Build interactive tool',
      priority: 'high' as const,
      opportunityScore: 92,
      estimatedTraffic: 1800,
      competitorCoverage: ['Salesforce', 'Pipedrive']
    }
  ]

  const filteredGaps = gaps.filter(gap => {
    const matchesSearch = gap.prompt.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPriority = priorityFilter === 'all' || gap.priority === priorityFilter
    const matchesStatus = statusFilter === 'all' || gap.status === statusFilter
    
    return matchesSearch && matchesPriority && matchesStatus
  })

  const summary = {
    missing: gaps.filter(g => g.status === 'missing').length,
    weak: gaps.filter(g => g.status === 'weak').length,
    highPriority: gaps.filter(g => g.priority === 'high').length,
    totalTraffic: gaps.reduce((sum, g) => sum + g.estimatedTraffic, 0)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-[#111] border border-[#333] rounded p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium">Filters & Analysis</h3>
          {hasMaxAccess && (
            <div className="flex items-center gap-1 px-2 py-1 bg-[#222] border border-[#444] rounded text-xs text-[#888]">
              <Sparkles className="w-3 h-3" />
              <span>Enhanced</span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#666]" />
              <input
                type="text"
                placeholder="Search opportunities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#0a0a0a] border border-[#333] rounded text-white placeholder-[#666] focus:outline-none focus:border-[#555]"
              />
            </div>
          </div>
          
          <select 
            value={priorityFilter} 
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-[#0a0a0a] border border-[#333] text-white rounded px-3 py-2 focus:outline-none focus:border-[#555]"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
          
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0a0a0a] border border-[#333] text-white rounded px-3 py-2 focus:outline-none focus:border-[#555]"
          >
            <option value="all">All Status</option>
            <option value="missing">Missing</option>
            <option value="weak">Weak</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#111] border border-[#333] rounded p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-[#666]" />
            <span className="text-[#888] text-sm">Missing</span>
          </div>
          <div className="text-white text-xl font-semibold">{summary.missing}</div>
        </div>
        
        <div className="bg-[#111] border border-[#333] rounded p-4">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4 text-[#666]" />
            <span className="text-[#888] text-sm">Weak</span>
          </div>
          <div className="text-white text-xl font-semibold">{summary.weak}</div>
        </div>
        
        <div className="bg-[#111] border border-[#333] rounded p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            <span className="text-[#888] text-sm">High Priority</span>
          </div>
          <div className="text-white text-xl font-semibold">{summary.highPriority}</div>
        </div>
        
        {hasMaxAccess && (
          <div className="bg-[#111] border border-[#333] rounded p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-green-500" />
              <span className="text-[#888] text-sm">Est. Traffic</span>
            </div>
            <div className="text-white text-xl font-semibold">{summary.totalTraffic.toLocaleString()}</div>
          </div>
        )}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="text-[#888] text-sm">
          Showing {filteredGaps.length} of {gaps.length} opportunities
        </div>
      </div>

      {/* Gaps Table */}
      <div className="bg-[#111] border border-[#333] rounded overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#111] border-b border-[#333]">
            <tr>
              <th className="text-left py-3 px-4 text-[#888] font-medium text-xs uppercase">Status</th>
              <th className="text-left py-3 px-4 text-[#888] font-medium text-xs uppercase">Opportunity</th>
              <th className="text-left py-3 px-4 text-[#888] font-medium text-xs uppercase">Volume</th>
              <th className="text-left py-3 px-4 text-[#888] font-medium text-xs uppercase">Difficulty</th>
              <th className="text-left py-3 px-4 text-[#888] font-medium text-xs uppercase">Action</th>
              {hasMaxAccess && (
                <th className="text-left py-3 px-4 text-[#888] font-medium text-xs uppercase">Score</th>
              )}
              <th className="text-right py-3 px-4 text-[#888] font-medium text-xs uppercase">Priority</th>
            </tr>
          </thead>
          <tbody>
            {filteredGaps.map((gap) => (
              <tr
                key={gap.id}
                className="border-b border-[#222] hover:bg-[#0a0a0a] transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      gap.status === 'missing' ? 'bg-white' : 'bg-[#666]'
                    }`} />
                    <span className={`text-sm capitalize ${
                      gap.status === 'missing' ? 'text-white' : 'text-[#888]'
                    }`}>
                      {gap.status}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-white max-w-md">
                  <div className="font-medium mb-1">{gap.prompt}</div>
                  <div className="text-[#666] text-sm">{gap.suggestion}</div>
                </td>
                <td className="py-3 px-4">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    gap.searchVolume === 'High' ? 'bg-white/10 text-white' :
                    gap.searchVolume === 'Medium' ? 'bg-[#333]/50 text-[#ccc]' :
                    'bg-[#333]/30 text-[#888]'
                  }`}>
                    {gap.searchVolume}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    gap.difficulty === 'Low' ? 'bg-[#333]/30 text-[#888]' :
                    gap.difficulty === 'Medium' ? 'bg-[#333]/50 text-[#ccc]' :
                    'bg-white/10 text-white'
                  }`}>
                    {gap.difficulty}
                  </div>
                </td>
                <td className="py-3 px-4 text-[#ccc] text-sm max-w-xs">
                  {gap.suggestion}
                </td>
                {hasMaxAccess && (
                  <td className="py-3 px-4">
                    <div className="text-green-400 text-sm font-medium">
                      {gap.opportunityScore}
                    </div>
                  </td>
                )}
                <td className="py-3 px-4 text-right">
                  <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    gap.priority === 'high' ? 'bg-white/10 text-white' :
                    gap.priority === 'medium' ? 'bg-[#333]/50 text-[#ccc]' :
                    'bg-[#333]/30 text-[#888]'
                  }`}>
                    {gap.priority}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredGaps.length === 0 && (
          <div className="p-8 text-center text-[#666]">
            No opportunities found matching your filters.
          </div>
        )}
      </div>

      {/* Action Summary */}
      <div className="bg-[#111] border border-[#333] rounded p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white" />
              <span className="text-[#888] text-sm">{summary.missing} missing opportunities</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#666]" />
              <span className="text-[#888] text-sm">{summary.weak} weak positions</span>
            </div>
          </div>
          <button className="px-4 py-2 bg-white text-black rounded text-sm font-medium hover:bg-[#f5f5f5] transition-colors">
            Generate Priority Content
          </button>
        </div>
      </div>
    </div>
  )
} 