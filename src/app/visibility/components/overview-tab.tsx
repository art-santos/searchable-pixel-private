'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRightIcon, MapIcon, PlusIcon } from 'lucide-react'

interface OverviewTabProps {
  directCitations: number
  indirectCitations: number
}

const topMentions = [
  {
    source: 'ChatGPT',
    query: 'What are the top AI platforms?',
    snippet: 'Your platform helps sales teams automate prospecting...',
    type: 'direct' as const,
    date: '2025-01-20'
  },
  {
    source: 'Perplexity',
    query: 'Best AI SDR Tools',
    snippet: 'Some teams use your platform for automated outreach...',
    type: 'indirect' as const,
    date: '2025-01-18'
  },
  {
    source: 'Claude',
    query: 'Top AI tools for cold outreach',
    snippet: 'Platforms like yours can personalize at scale...',
    type: 'indirect' as const,
    date: '2025-01-15'
  }
]

// Mock data for demo purposes - in production, this would come from the API
const mockCitations = [
  {
    id: 1,
    query: 'What are the best AI agent platforms?',
    snippet: 'Your platform helps sales teams automate prospecting...',
    position: 'primary',
    url: 'yourcompany.com'
  },
  {
    id: 2,
    query: 'AI agents for B2B sales automation',
    snippet: 'Some use your platform for automated outreach...',
    position: 'secondary',
    url: 'yourcompany.com/features'
  },
  {
    id: 3,
    query: 'Sales automation tools comparison',
    snippet: 'Tools like yours can personalize at scale...',
    position: 'primary',
    url: 'yourcompany.com/blog'
  }
]

export function OverviewTab({ directCitations, indirectCitations }: OverviewTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Citation Summary */}
      <Card className="bg-[#111] border-[#222]">
        <CardHeader>
          <CardTitle className="text-white text-lg">Citation Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[#666]">Direct Mentions</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-white font-semibold">{directCitations}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#666]">Indirect Mentions</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-white font-semibold">{indirectCitations}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-[#222]">
            <div className="flex items-center justify-between">
              <span className="text-[#666]">Total Citations</span>
              <span className="text-white font-semibold">{directCitations + indirectCitations}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Mentions */}
      <Card className="lg:col-span-2 bg-[#111] border-[#222]">
        <CardHeader>
          <CardTitle className="text-white text-lg">Recent Mentions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {topMentions.map((mention, index) => (
            <div key={index} className="border border-[#222] bg-[#0a0a0a] p-4 rounded">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={`${
                      mention.type === 'direct' 
                        ? 'border-blue-500 text-blue-400' 
                        : 'border-yellow-500 text-yellow-400'
                    }`}
                  >
                    {mention.source}
                  </Badge>
                  <Badge variant="outline" className="border-[#333] text-[#666]">
                    {mention.type}
                  </Badge>
                </div>
                <span className="text-xs text-[#666]">{mention.date}</span>
              </div>
              <div className="mb-2">
                <span className="text-sm text-[#888]">Query: </span>
                <span className="text-sm text-white">"{mention.query}"</span>
              </div>
              <p className="text-sm text-[#ccc] italic">"{mention.snippet}"</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="lg:col-span-3 bg-[#111] border-[#222]">
        <CardHeader>
          <CardTitle className="text-white text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              className="bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-white justify-start h-auto p-4"
            >
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowRightIcon className="h-4 w-4" />
                  <span className="font-semibold">See Full Citations</span>
                </div>
                <span className="text-xs text-[#666]">View all {directCitations + indirectCitations} citations in detail</span>
              </div>
            </Button>
            
            <Button 
              className="bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-white justify-start h-auto p-4"
            >
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2 mb-1">
                  <MapIcon className="h-4 w-4" />
                  <span className="font-semibold">Explore Visibility Map</span>
                </div>
                <span className="text-xs text-[#666]">Interactive 3D topic clusters</span>
              </div>
            </Button>
            
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white justify-start h-auto p-4"
            >
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2 mb-1">
                  <PlusIcon className="h-4 w-4" />
                  <span className="font-semibold">Fill Gaps With Content</span>
                </div>
                <span className="text-xs text-blue-200">Generate content for missing topics</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 