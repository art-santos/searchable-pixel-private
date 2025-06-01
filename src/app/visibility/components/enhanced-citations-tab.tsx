'use client'

import { useState } from 'react'
import { Search, Download, Filter, Sparkles, X, Copy, ArrowUpRight } from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'

interface EnhancedCitationsTabProps {
  hasVisibilityData: boolean
  isRefreshing: boolean
  onRefreshScore: () => void
}

export function EnhancedCitationsTab({ hasVisibilityData }: EnhancedCitationsTabProps) {
  const { subscription } = useSubscription()
  const hasMaxAccess = subscription?.plan === 'plus' || subscription?.plan === 'pro'
  
  const [searchTerm, setSearchTerm] = useState('')
  const [engineFilter, setEngineFilter] = useState('all')
  const [matchTypeFilter, setMatchTypeFilter] = useState('all')
  const [selectedCitation, setSelectedCitation] = useState<any>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Only render if we have data - empty state handled centrally
  if (!hasVisibilityData) {
    return null
  }

  const citations = [
    {
      id: 1,
      engine: 'Perplexity',
      query: 'What is the best AI sales tool for startups?',
      matchType: 'Direct',
      snippet: 'Origami Agents is a powerful AI tool that helps sales teams automate prospecting and lead qualification using AI-powered research and personalization.',
      date: '2025-01-20',
      url: 'https://origamiagents.com',
      sentiment: 'positive' as const,
      confidence: 0.94,
      sources: ['Reddit', 'Y Combinator'],
      engagement_score: 0.89
    },
    {
      id: 2,
      engine: 'ChatGPT',
      query: 'AI SDR tools comparison 2025',
      matchType: 'Indirect',
      snippet: 'Some sales teams use tools like Origami for automated outreach and lead qualification processes...',
      date: '2025-01-19',
      url: 'https://origamiagents.com/features',
      sentiment: 'neutral' as const,
      confidence: 0.76,
      sources: ['LinkedIn', 'Product Hunt'],
      engagement_score: 0.72
    },
    {
      id: 3,
      engine: 'Claude',
      query: 'Top cold email automation tools',
      matchType: 'Direct',
      snippet: 'Origami Agents stands out for its research-first approach to sales automation and personalized outreach.',
      date: '2025-01-18',
      url: 'https://origamiagents.com/blog/ai-sales',
      sentiment: 'positive' as const,
      confidence: 0.91,
      sources: ['TechCrunch', 'Industry Forums'],
      engagement_score: 0.85
    },
    {
      id: 4,
      engine: 'Perplexity',
      query: 'How to automate sales prospecting with AI',
      matchType: 'Indirect',
      snippet: 'Modern AI tools help automate the research phase of prospecting, with solutions like Origami providing comprehensive automation.',
      date: '2025-01-17',
      url: 'https://origamiagents.com/playbooks',
      sentiment: 'positive' as const,
      confidence: 0.83,
      sources: ['Salesforce Blog', 'HubSpot'],
      engagement_score: 0.78
    }
  ]

  const filteredCitations = citations.filter(citation => {
    const matchesSearch = citation.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         citation.snippet.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEngine = engineFilter === 'all' || citation.engine === engineFilter
    const matchesType = matchTypeFilter === 'all' || citation.matchType === matchTypeFilter
    
    return matchesSearch && matchesEngine && matchesType
  })

  const handleExport = (format: 'csv' | 'json') => {
    console.log(`Exporting ${filteredCitations.length} citations as ${format}`)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-[#111] border border-[#333] rounded p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium">Filters & Search</h3>
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
                placeholder="Search citations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#0a0a0a] border border-[#333] rounded text-white placeholder-[#666] focus:outline-none focus:border-[#555]"
              />
            </div>
          </div>
          
          <select 
            value={engineFilter} 
            onChange={(e) => setEngineFilter(e.target.value)}
            className="bg-[#0a0a0a] border border-[#333] text-white rounded px-3 py-2 focus:outline-none focus:border-[#555]"
          >
            <option value="all">All Engines</option>
            <option value="ChatGPT">ChatGPT</option>
            <option value="Perplexity">Perplexity</option>
            <option value="Claude">Claude</option>
          </select>
          
          <select 
            value={matchTypeFilter} 
            onChange={(e) => setMatchTypeFilter(e.target.value)}
            className="bg-[#0a0a0a] border border-[#333] text-white rounded px-3 py-2 focus:outline-none focus:border-[#555]"
          >
            <option value="all">All Types</option>
            <option value="Direct">Direct</option>
            <option value="Indirect">Indirect</option>
          </select>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="text-[#888] text-sm">
          Showing {filteredCitations.length} of {citations.length} citations
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-3 py-1 bg-[#111] border border-[#333] text-white hover:bg-[#222] rounded text-sm transition-colors"
          >
            <Download className="h-3 w-3" />
            CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            className="flex items-center gap-2 px-3 py-1 bg-[#111] border border-[#333] text-white hover:bg-[#222] rounded text-sm transition-colors"
          >
            <Download className="h-3 w-3" />
            JSON
          </button>
        </div>
      </div>

      {/* Citations Table */}
      <div className="bg-[#111] border border-[#333] rounded overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#111] border-b border-[#333]">
            <tr>
              <th className="text-left py-3 px-4 text-[#888] font-medium text-xs uppercase">Engine</th>
              <th className="text-left py-3 px-4 text-[#888] font-medium text-xs uppercase">Query</th>
              <th className="text-left py-3 px-4 text-[#888] font-medium text-xs uppercase">Type</th>
              <th className="text-left py-3 px-4 text-[#888] font-medium text-xs uppercase">Context</th>
              {hasMaxAccess && (
                <th className="text-left py-3 px-4 text-[#888] font-medium text-xs uppercase">Sentiment</th>
              )}
              <th className="text-left py-3 px-4 text-[#888] font-medium text-xs uppercase">Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredCitations.map((citation) => (
              <tr
                key={citation.id}
                className="border-b border-[#222] hover:bg-[#0a0a0a] transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedCitation(citation)
                  setIsDrawerOpen(true)
                }}
              >
                <td className="py-3 px-4">
                  <div className={`px-2 py-1 rounded text-xs font-medium border ${
                    citation.engine === 'ChatGPT' ? 'border-green-500/20 text-green-400 bg-green-500/5' :
                    citation.engine === 'Perplexity' ? 'border-purple-500/20 text-purple-400 bg-purple-500/5' :
                    'border-orange-500/20 text-orange-400 bg-orange-500/5'
                  }`}>
                    {citation.engine}
                  </div>
                </td>
                <td className="py-3 px-4 text-white max-w-xs">
                  <div className="truncate" title={citation.query}>
                    {citation.query}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className={`px-2 py-1 rounded text-xs font-medium border ${
                    citation.matchType === 'Direct' 
                      ? 'bg-white/5 text-white border-white/10' 
                      : 'bg-[#333]/30 text-[#888] border-[#333]'
                  }`}>
                    {citation.matchType}
                  </div>
                </td>
                <td className="py-3 px-4 text-[#ccc] max-w-md">
                  <div className="line-clamp-2" title={citation.snippet}>
                    {citation.snippet}
                  </div>
                </td>
                {hasMaxAccess && (
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        citation.sentiment === 'positive' ? 'bg-green-500' :
                        citation.sentiment === 'negative' ? 'bg-red-500' :
                        'bg-[#666]'
                      }`} />
                      <span className="text-xs text-[#666] capitalize">{citation.sentiment}</span>
                    </div>
                  </td>
                )}
                <td className="py-3 px-4 text-[#666] text-sm">
                  {citation.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredCitations.length === 0 && (
          <div className="p-8 text-center text-[#666]">
            No citations found matching your filters.
          </div>
        )}
      </div>

      {/* Citation Detail Drawer */}
      {isDrawerOpen && selectedCitation && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setIsDrawerOpen(false)}
          />
          
          <div className="fixed top-0 right-0 w-[480px] h-screen bg-[#0a0a0a] border-l border-[#333] flex flex-col z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#333]">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded border flex items-center justify-center ${
                  selectedCitation.engine === 'ChatGPT' ? 'bg-green-500/10 border-green-500/20' :
                  selectedCitation.engine === 'Perplexity' ? 'bg-purple-500/10 border-purple-500/20' :
                  'bg-orange-500/10 border-orange-500/20'
                }`}>
                  <div className="w-3 h-3 rounded bg-[#666]" />
                </div>
                <div>
                  <div className="text-white font-medium text-sm">{selectedCitation.engine}</div>
                  <div className="text-[#666] text-xs">{selectedCitation.engine.toLowerCase()}.ai › citations</div>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 hover:bg-[#1a1a1a] rounded transition-colors"
              >
                <X className="w-4 h-4 text-[#666]" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 space-y-6">
              <div>
                <div className="text-[#888] text-xs font-medium uppercase mb-3">Query</div>
                <div className="text-white text-sm leading-relaxed bg-[#111] border border-[#333] rounded p-4">
                  {selectedCitation.query}
                </div>
              </div>

              <div>
                <div className="text-[#888] text-xs font-medium uppercase mb-3">Details</div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[#666] text-sm">Type</span>
                    <div className={`px-2 py-1 rounded text-xs font-medium border ${
                      selectedCitation.matchType === 'Direct' 
                        ? 'bg-white/5 text-white border-white/10' 
                        : 'bg-[#333]/30 text-[#888] border-[#333]'
                    }`}>
                      {selectedCitation.matchType}
                    </div>
                  </div>
                  
                  {hasMaxAccess && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[#666] text-sm">Confidence</span>
                        <span className="text-green-400 text-sm font-medium">{(selectedCitation.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#666] text-sm">Sentiment</span>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            selectedCitation.sentiment === 'positive' ? 'bg-green-500' :
                            selectedCitation.sentiment === 'negative' ? 'bg-red-500' :
                            'bg-[#666]'
                          }`} />
                          <span className="text-white text-sm capitalize">{selectedCitation.sentiment}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <div className="text-[#888] text-xs font-medium uppercase mb-3">Citation Context</div>
                <div className="bg-[#111] border border-[#333] rounded p-4">
                  <div className="text-[#ccc] text-sm leading-relaxed">
                    {selectedCitation.snippet}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-[#333] p-6 space-y-3">
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-[#111] hover:bg-[#222] border border-[#333] rounded text-white text-sm font-medium transition-colors">
                <Copy className="w-4 h-4" />
                Copy Citation
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-[#111] hover:bg-[#222] border border-[#333] rounded text-white text-sm font-medium transition-colors">
                <ArrowUpRight className="w-4 h-4" />
                View Source
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
} 