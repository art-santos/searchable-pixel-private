'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchIcon, DownloadIcon, FilterIcon } from 'lucide-react'

// Mock citations data
const mockCitations = [
  {
    id: 1,
    engine: 'ChatGPT',
    query: 'What is Origami Agents?',
    matchType: 'Direct',
    snippet: 'Origami Agents is a tool that helps sales teams automate prospecting and lead qualification using AI-powered research and personalization.',
    date: '2025-01-20',
    url: 'https://origamiagents.com'
  },
  {
    id: 2,
    engine: 'Perplexity',
    query: 'Best AI tools for outbound sales',
    matchType: 'Indirect',
    snippet: 'Some sales teams use Origami Agents to automate their outreach process...',
    date: '2025-01-18',
    url: 'https://origamiagents.com/features'
  },
  {
    id: 3,
    engine: 'Claude',
    query: 'Top cold email automation tools 2025',
    matchType: 'Indirect',
    snippet: 'Tools like Origami can personalize cold outreach at scale using AI research capabilities.',
    date: '2025-01-15',
    url: 'https://origamiagents.com/blog/ai-sales'
  },
  {
    id: 4,
    engine: 'ChatGPT',
    query: 'AI SDR platforms comparison',
    matchType: 'Direct',
    snippet: 'Origami Agents stands out for its research-first approach to sales automation...',
    date: '2025-01-12',
    url: 'https://origamiagents.com/compare'
  },
  {
    id: 5,
    engine: 'Perplexity',
    query: 'How to automate sales prospecting',
    matchType: 'Indirect',
    snippet: 'Modern tools like Origami help automate the research phase of prospecting.',
    date: '2025-01-10',
    url: 'https://origamiagents.com/playbooks'
  }
]

export function CitationsTab() {
  const [searchTerm, setSearchTerm] = useState('')
  const [engineFilter, setEngineFilter] = useState('all')
  const [matchTypeFilter, setMatchTypeFilter] = useState('all')

  const filteredCitations = mockCitations.filter(citation => {
    const matchesSearch = citation.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         citation.snippet.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEngine = engineFilter === 'all' || citation.engine === engineFilter
    const matchesType = matchTypeFilter === 'all' || citation.matchType === matchTypeFilter
    
    return matchesSearch && matchesEngine && matchesType
  })

  const handleExport = (format: 'csv' | 'json') => {
    // Mock export functionality
    console.log(`Exporting ${filteredCitations.length} citations as ${format}`)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="bg-[#111] border-[#222]">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <FilterIcon className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#666]" />
                <Input
                  placeholder="Search citations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#1a1a1a] border-[#333] text-white"
                />
              </div>
            </div>
            <Select value={engineFilter} onValueChange={setEngineFilter}>
              <SelectTrigger className="bg-[#1a1a1a] border-[#333] text-white">
                <SelectValue placeholder="Filter by engine" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#333]">
                <SelectItem value="all">All Engines</SelectItem>
                <SelectItem value="ChatGPT">ChatGPT</SelectItem>
                <SelectItem value="Perplexity">Perplexity</SelectItem>
                <SelectItem value="Claude">Claude</SelectItem>
              </SelectContent>
            </Select>
            <Select value={matchTypeFilter} onValueChange={setMatchTypeFilter}>
              <SelectTrigger className="bg-[#1a1a1a] border-[#333] text-white">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#333]">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Direct">Direct</SelectItem>
                <SelectItem value="Indirect">Indirect</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="text-[#666]">
          Showing {filteredCitations.length} of {mockCitations.length} citations
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            className="bg-[#1a1a1a] border-[#333] text-white hover:bg-[#222]"
          >
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('json')}
            className="bg-[#1a1a1a] border-[#333] text-white hover:bg-[#222]"
          >
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Citations Table */}
      <Card className="bg-[#111] border-[#222]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#222]">
                  <th className="text-left p-4 text-[#666] font-medium">Engine</th>
                  <th className="text-left p-4 text-[#666] font-medium">Query</th>
                  <th className="text-left p-4 text-[#666] font-medium">Type</th>
                  <th className="text-left p-4 text-[#666] font-medium">Snippet</th>
                  <th className="text-left p-4 text-[#666] font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredCitations.map((citation) => (
                  <tr key={citation.id} className="border-b border-[#222] hover:bg-[#0a0a0a] transition-colors">
                    <td className="p-4">
                      <Badge 
                        variant="outline" 
                        className={`
                          ${citation.engine === 'ChatGPT' ? 'border-green-500 text-green-400' : ''}
                          ${citation.engine === 'Perplexity' ? 'border-purple-500 text-purple-400' : ''}
                          ${citation.engine === 'Claude' ? 'border-orange-500 text-orange-400' : ''}
                        `}
                      >
                        {citation.engine}
                      </Badge>
                    </td>
                    <td className="p-4 text-white max-w-xs">
                      <div className="truncate" title={citation.query}>
                        {citation.query}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge 
                        variant="outline" 
                        className={`${
                          citation.matchType === 'Direct' 
                            ? 'border-blue-500 text-blue-400' 
                            : 'border-yellow-500 text-yellow-400'
                        }`}
                      >
                        {citation.matchType}
                      </Badge>
                    </td>
                    <td className="p-4 text-[#ccc] max-w-md">
                      <div className="line-clamp-2" title={citation.snippet}>
                        {citation.snippet}
                      </div>
                    </td>
                    <td className="p-4 text-[#666]">
                      {citation.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredCitations.length === 0 && (
            <div className="p-8 text-center text-[#666]">
              No citations found matching your filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 