'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchIcon, DownloadIcon, FilterIcon } from 'lucide-react'

// Mock data for demo purposes - in production, this would come from the API
const mockCitations = [
  {
    id: 1,
    query: 'What are the best AI platforms?',
    ai_model: 'GPT-4',
    snippet: 'Your platform is a tool that helps sales teams automate prospecting and lead qualification using AI-powered research and personalization.',
    position: 'primary',
    url: 'yourcompany.com'
  },
  {
    id: 2,
    query: 'AI tools for sales automation',
    ai_model: 'Claude',
    snippet: 'Some sales teams use your platform to automate their outreach process...',
    position: 'secondary',
    url: 'yourcompany.com/features'
  },
  {
    id: 3,
    query: 'Best B2B prospecting tools',
    ai_model: 'Perplexity',
    snippet: 'Tools like yours can personalize cold outreach at scale using AI research capabilities.',
    position: 'primary',
    url: 'yourcompany.com/blog/ai-sales'
  },
  {
    id: 4,
    query: 'AI-powered sales platforms comparison',
    ai_model: 'ChatGPT',
    snippet: 'Your platform stands out for its research-first approach to sales automation...',
    position: 'secondary',
    url: 'yourcompany.com/compare'
  },
  {
    id: 5,
    query: 'Automated prospecting solutions',
    ai_model: 'Gemini',
    snippet: 'Modern tools like yours help automate the research phase of prospecting.',
    position: 'primary',
    url: 'yourcompany.com/playbooks'
  }
]

export function CitationsTab() {
  const [searchTerm, setSearchTerm] = useState('')
  const [engineFilter, setEngineFilter] = useState('all')
  const [matchTypeFilter, setMatchTypeFilter] = useState('all')

  const filteredCitations = mockCitations.filter(citation => {
    const matchesSearch = citation.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         citation.snippet.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEngine = engineFilter === 'all' || citation.ai_model === engineFilter
    const matchesType = matchTypeFilter === 'all' || citation.position === matchTypeFilter
    
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
                <SelectItem value="GPT-4">GPT-4</SelectItem>
                <SelectItem value="Claude">Claude</SelectItem>
                <SelectItem value="Perplexity">Perplexity</SelectItem>
                <SelectItem value="Gemini">Gemini</SelectItem>
              </SelectContent>
            </Select>
            <Select value={matchTypeFilter} onValueChange={setMatchTypeFilter}>
              <SelectTrigger className="bg-[#1a1a1a] border-[#333] text-white">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#333]">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="secondary">Secondary</SelectItem>
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
                          ${citation.ai_model === 'GPT-4' ? 'border-green-500 text-green-400' : ''}
                          ${citation.ai_model === 'Claude' ? 'border-orange-500 text-orange-400' : ''}
                          ${citation.ai_model === 'Perplexity' ? 'border-purple-500 text-purple-400' : ''}
                          ${citation.ai_model === 'Gemini' ? 'border-pink-500 text-pink-400' : ''}
                        `}
                      >
                        {citation.ai_model}
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
                          citation.position === 'primary' 
                            ? 'border-blue-500 text-blue-400' 
                            : 'border-yellow-500 text-yellow-400'
                        }`}
                      >
                        {citation.position}
                      </Badge>
                    </td>
                    <td className="p-4 text-[#ccc] max-w-md">
                      <div className="line-clamp-2" title={citation.snippet}>
                        {citation.snippet}
                      </div>
                    </td>
                    <td className="p-4 text-[#666]">
                      {citation.url}
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