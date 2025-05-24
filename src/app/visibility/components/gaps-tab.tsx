'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangleIcon, PlusIcon, TrendingUpIcon, SparklesIcon } from 'lucide-react'

// Mock gaps data
const missingPrompts = [
  {
    id: 1,
    prompt: 'Best AI agents for GTM teams',
    match: 'Not Found',
    difficulty: 'Medium',
    searchVolume: 'High',
    relevance: 95,
    suggestion: 'Generate comprehensive guide on AI agents for Go-To-Market teams',
    selected: false
  },
  {
    id: 2,
    prompt: 'Alternatives to Clay.com',
    match: 'Indirect',
    difficulty: 'Easy',
    searchVolume: 'Medium',
    relevance: 88,
    suggestion: 'Strengthen existing content with direct comparison',
    selected: false
  },
  {
    id: 3,
    prompt: 'Top cold email automation tools 2025',
    match: 'Not Found',
    difficulty: 'Hard',
    searchVolume: 'High',
    relevance: 92,
    suggestion: 'Create comprehensive 2025 comparison guide',
    selected: false
  },
  {
    id: 4,
    prompt: 'AI SDR vs human SDR ROI comparison',
    match: 'Not Found',
    difficulty: 'Medium',
    searchVolume: 'Medium',
    relevance: 85,
    suggestion: 'Generate data-driven ROI analysis',
    selected: false
  },
  {
    id: 5,
    prompt: 'How to train AI sales agents',
    match: 'Weak',
    difficulty: 'Easy',
    searchVolume: 'Low',
    relevance: 78,
    suggestion: 'Strengthen with step-by-step training guide',
    selected: false
  }
]

export function GapsTab() {
  const [gaps, setGaps] = useState(missingPrompts)
  const [sortBy, setSortBy] = useState('relevance')
  const [filterBy, setFilterBy] = useState('all')

  const handleSelectGap = (id: number, checked: boolean) => {
    setGaps(prev => prev.map(gap => 
      gap.id === id ? { ...gap, selected: checked } : gap
    ))
  }

  const handleSelectAll = (checked: boolean) => {
    setGaps(prev => prev.map(gap => ({ ...gap, selected: checked })))
  }

  const selectedCount = gaps.filter(gap => gap.selected).length

  const sortedAndFilteredGaps = gaps
    .filter(gap => {
      if (filterBy === 'all') return true
      if (filterBy === 'missing') return gap.match === 'Not Found'
      if (filterBy === 'weak') return gap.match === 'Weak' || gap.match === 'Indirect'
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'relevance':
          return b.relevance - a.relevance
        case 'difficulty':
          const difficultyOrder = { Easy: 1, Medium: 2, Hard: 3 }
          return difficultyOrder[a.difficulty as keyof typeof difficultyOrder] - difficultyOrder[b.difficulty as keyof typeof difficultyOrder]
        case 'volume':
          const volumeOrder = { Low: 1, Medium: 2, High: 3 }
          return volumeOrder[b.searchVolume as keyof typeof volumeOrder] - volumeOrder[a.searchVolume as keyof typeof volumeOrder]
        default:
          return 0
      }
    })

  const generateContent = () => {
    const selected = gaps.filter(gap => gap.selected)
    console.log('Generating content for:', selected)
    // In real app, this would send to content generator
  }

  const getMatchBadgeColor = (match: string) => {
    switch (match) {
      case 'Not Found':
        return 'border-red-500 text-red-400'
      case 'Weak':
        return 'border-orange-500 text-orange-400'
      case 'Indirect':
        return 'border-yellow-500 text-yellow-400'
      default:
        return 'border-[#333] text-[#666]'
    }
  }

  const getDifficultyBadgeColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'border-green-500 text-green-400'
      case 'Medium':
        return 'border-yellow-500 text-yellow-400'
      case 'Hard':
        return 'border-red-500 text-red-400'
      default:
        return 'border-[#333] text-[#666]'
    }
  }

  return (
    <div className="space-y-6">
      {/* Actions Header */}
      <Card className="bg-[#111] border-[#222]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <SparklesIcon className="h-5 w-5" />
              Content Opportunities
            </CardTitle>
            <Button 
              onClick={generateContent}
              disabled={selectedCount === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Generate Content ({selectedCount})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="select-all"
                checked={selectedCount === gaps.length}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-white text-sm">
                Select All ({gaps.length})
              </label>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-[#1a1a1a] border-[#333] text-white">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#333]">
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="difficulty">Difficulty</SelectItem>
                <SelectItem value="volume">Search Volume</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="bg-[#1a1a1a] border-[#333] text-white">
                <SelectValue placeholder="Filter by..." />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#333]">
                <SelectItem value="all">All Opportunities</SelectItem>
                <SelectItem value="missing">Missing Content</SelectItem>
                <SelectItem value="weak">Weak Coverage</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Opportunities Table */}
      <Card className="bg-[#111] border-[#222]">
        <CardHeader>
          <CardTitle className="text-white text-lg">
            Missing & Weak Content ({sortedAndFilteredGaps.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#222]">
                  <th className="text-left p-4 text-[#666] font-medium w-12"></th>
                  <th className="text-left p-4 text-[#666] font-medium">Prompt</th>
                  <th className="text-left p-4 text-[#666] font-medium">Current Match</th>
                  <th className="text-left p-4 text-[#666] font-medium">Difficulty</th>
                  <th className="text-left p-4 text-[#666] font-medium">Volume</th>
                  <th className="text-left p-4 text-[#666] font-medium">Suggestion</th>
                </tr>
              </thead>
              <tbody>
                {sortedAndFilteredGaps.map((gap) => (
                  <tr key={gap.id} className="border-b border-[#222] hover:bg-[#0a0a0a] transition-colors">
                    <td className="p-4">
                      <Checkbox 
                        checked={gap.selected}
                        onCheckedChange={(checked) => handleSelectGap(gap.id, checked as boolean)}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="text-white font-medium">{gap.prompt}</div>
                        <div className="text-xs text-[#666] bg-[#1a1a1a] px-2 py-1 rounded">
                          {gap.relevance}% match
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge 
                        variant="outline" 
                        className={getMatchBadgeColor(gap.match)}
                      >
                        {gap.match === 'Not Found' && <AlertTriangleIcon className="h-3 w-3 mr-1" />}
                        {gap.match}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge 
                        variant="outline" 
                        className={getDifficultyBadgeColor(gap.difficulty)}
                      >
                        {gap.difficulty}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="border-[#333] text-[#666]">
                        {gap.searchVolume}
                      </Badge>
                    </td>
                    <td className="p-4 text-[#ccc] max-w-xs">
                      <div className="line-clamp-2">{gap.suggestion}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#111] border-[#222]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded">
                <AlertTriangleIcon className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <div className="text-white font-semibold">
                  {gaps.filter(g => g.match === 'Not Found').length}
                </div>
                <div className="text-[#666] text-sm">Missing Content</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-[#222]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/20 rounded">
                <TrendingUpIcon className="h-5 w-5 text-yellow-400" />
              </div>
              <div>
                <div className="text-white font-semibold">
                  {gaps.filter(g => g.match === 'Weak' || g.match === 'Indirect').length}
                </div>
                <div className="text-[#666] text-sm">Weak Coverage</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-[#222]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded">
                <SparklesIcon className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="text-white font-semibold">
                  {Math.round(gaps.reduce((sum, g) => sum + g.relevance, 0) / gaps.length)}%
                </div>
                <div className="text-[#666] text-sm">Avg. Relevance</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 