'use client'

import { useState } from 'react'
import { Search, Download, Filter, Sparkles, X, Copy, ArrowUpRight } from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'

interface EnhancedCitationsTabProps {
  hasVisibilityData: boolean
  isRefreshing: boolean
  onRefreshScore: () => void
  data?: any // Real visibility data from API
}

export function EnhancedCitationsTab({ hasVisibilityData, data }: EnhancedCitationsTabProps) {
  const { subscription } = useSubscription()
  const hasMaxAccess = subscription?.plan === 'plus' || subscription?.plan === 'pro'
  
  const [searchTerm, setSearchTerm] = useState('')
  const [engineFilter, setEngineFilter] = useState('all')
  const [matchTypeFilter, setMatchTypeFilter] = useState('all')
  const [selectedCitation, setSelectedCitation] = useState<any>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // Only render if we have data - empty state handled centrally
  if (!hasVisibilityData || !data) {
    return null
  }

  // Transform real data into citation format
  const citations = data.citations?.all_mentions?.map((mention: any, index: number) => {
    // Check if this is a real citation URL - use the presence of citation_url field
    const hasValidUrl = mention.citation_url && mention.citation_url !== '#' && mention.citation_url.startsWith('http')
    const citationUrl = hasValidUrl ? mention.citation_url : (mention.url || '#')
    
    return {
      id: index + 1,
      engine: 'Perplexity',
      query: mention.question || 'AI Research Question',
      matchType: mention.match_type === 'direct' ? 'Direct' : 'Indirect',
      snippet: hasValidUrl ? 
        `Source: ${mention.domain || 'External Link'}` : 
        (mention.snippet || mention.context || 'No context available'),
      date: new Date(mention.date || Date.now()).toISOString().split('T')[0],
      url: citationUrl,
      sentiment: mention.sentiment || 'neutral',
      confidence: mention.confidence || 0.85,
      sources: hasValidUrl ? [citationUrl] : ['AI Platform'],
      engagement_score: mention.confidence || 0.75,
      isRealCitation: hasValidUrl,
      bucket: mention.bucket || 'earned',
      domain: mention.domain || 'unknown.com'
    }
  }) || []

  const filteredCitations = citations.filter(citation => {
    const matchesSearch = (citation.query || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (citation.snippet || '').toLowerCase().includes(searchTerm.toLowerCase())
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
                    {citation.isRealCitation ? (
                      <a 
                        href={citation.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {citation.url}
                      </a>
                    ) : (
                      citation.snippet
                    )}
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
                  {selectedCitation.isRealCitation ? (
                    <div className="space-y-3">
                      <div className="text-[#ccc] text-sm">
                        <strong>Source URL:</strong>
                      </div>
                      <a 
                        href={selectedCitation.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline text-sm break-all"
                      >
                        {selectedCitation.url}
                      </a>
                      <div className="text-[#ccc] text-sm leading-relaxed">
                        This citation was extracted from the AI response and represents a source that influenced the answer.
                      </div>
                    </div>
                  ) : (
                    <div className="text-[#ccc] text-sm leading-relaxed">
                      {selectedCitation.snippet}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-[#333] p-6 space-y-3">
              <button 
                onClick={() => navigator.clipboard.writeText(selectedCitation.url)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#111] hover:bg-[#222] border border-[#333] rounded text-white text-sm font-medium transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copy Citation URL
              </button>
              {selectedCitation.isRealCitation && (
                <button 
                  onClick={() => window.open(selectedCitation.url, '_blank')}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-[#111] hover:bg-[#222] border border-[#333] rounded text-white text-sm font-medium transition-colors"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  View Source
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
} 