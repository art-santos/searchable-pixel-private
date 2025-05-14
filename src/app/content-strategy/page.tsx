'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Plus, 
  FileText, 
  Zap, 
  Calendar, 
  ChevronDown,
  Search,
  Clock,
  CheckCircle2,
  FileEdit,
  Upload,
  PlusCircle
} from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Keyword {
  id: string;
  keyword: string;
  status: 'planned' | 'drafted' | 'published' | 'indexed';
  difficulty: number;
  dateAdded: string;
}

export default function ContentStrategy() {
  const [keywords, setKeywords] = useState<Keyword[]>([
    { 
      id: '1', 
      keyword: 'AI content optimization techniques', 
      status: 'indexed', 
      difficulty: 45,
      dateAdded: '2023-05-15'
    },
    { 
      id: '2', 
      keyword: 'How to get content visible in ChatGPT', 
      status: 'published', 
      difficulty: 68,
      dateAdded: '2023-05-20'
    },
    { 
      id: '3', 
      keyword: 'Best practices for AI Engine Optimization', 
      status: 'drafted', 
      difficulty: 52,
      dateAdded: '2023-05-25'
    },
    { 
      id: '4', 
      keyword: 'Is AEO better than SEO for LLMs', 
      status: 'planned', 
      difficulty: 33,
      dateAdded: '2023-06-01'
    },
    { 
      id: '5', 
      keyword: 'Content visibility in Perplexity AI', 
      status: 'planned', 
      difficulty: 41,
      dateAdded: '2023-06-05'
    },
  ])
  
  const [newKeyword, setNewKeyword] = useState('')
  const [selectedTone, setSelectedTone] = useState('conversational')
  const [selectedFormat, setSelectedFormat] = useState('how-to')
  const [weeklyPosts, setWeeklyPosts] = useState(2)
  
  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return
    
    const newKeywordObj: Keyword = {
      id: Date.now().toString(),
      keyword: newKeyword,
      status: 'planned',
      difficulty: Math.floor(Math.random() * 60) + 20, // Random difficulty between 20-80
      dateAdded: new Date().toISOString().split('T')[0]
    }
    
    setKeywords([...keywords, newKeywordObj])
    setNewKeyword('')
  }

  const statusIcons = {
    planned: <Clock className="h-4 w-4 text-yellow-400" />,
    drafted: <FileEdit className="h-4 w-4 text-blue-400" />,
    published: <Upload className="h-4 w-4 text-purple-400" />,
    indexed: <CheckCircle2 className="h-4 w-4 text-green-400" />
  }
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'planned':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-800/50'
      case 'drafted':
        return 'bg-blue-900/30 text-blue-400 border-blue-800/50'
      case 'published':
        return 'bg-purple-900/30 text-purple-400 border-purple-800/50'
      case 'indexed':
        return 'bg-green-900/30 text-green-400 border-green-800/50'
      default:
        return 'bg-gray-800 text-gray-300'
    }
  }
  
  const getDifficultyColor = (difficulty: number) => {
    if (difficulty < 40) return 'bg-green-900/30 text-green-400 border-green-800/50'
    if (difficulty < 60) return 'bg-yellow-900/30 text-yellow-400 border-yellow-800/50'
    return 'bg-red-900/30 text-red-400 border-red-800/50'
  }
  
  return (
    <main className="flex flex-1 flex-col gap-8 p-8 bg-[#0c0c0c] overflow-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Content Strategy</h1>
          <p className="text-gray-400">Plan and manage your AI-optimized content</p>
        </div>
        
        <Button 
          className="flex items-center gap-2 self-start md:self-auto bg-white hover:bg-gray-100 text-[#0c0c0c]"
        >
          <Zap className="h-4 w-4" />
          Generate Content Ideas
        </Button>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        {/* Long-tail Keyword Planner */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-[#161616] border-[#333333] text-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-medium text-white">
                Long-tail Keyword Planner
              </CardTitle>
              <Button 
                variant="outline" 
                className="flex items-center gap-2 text-sm border-[#333333] bg-[#222222] hover:bg-[#2a2a2a] text-white"
              >
                <Search className="h-4 w-4" />
                Agent Suggestions
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-6">
                <Input
                  className="bg-[#222222] border-[#333333] text-white placeholder:text-gray-500 focus-visible:ring-gray-500"
                  placeholder="Add a new keyword target..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                />
                <Button 
                  className="flex-shrink-0 bg-[#333333] hover:bg-[#444444] text-white"
                  onClick={handleAddKeyword}
                >
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
              
              <div className="rounded-md border border-[#333333] overflow-hidden">
                <div className="grid grid-cols-10 gap-4 bg-[#222222] px-4 py-3 text-sm font-medium text-gray-400">
                  <div className="col-span-6">Keyword</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Difficulty</div>
                </div>
                <div className="divide-y divide-[#333333]">
                  {keywords.map((keyword) => (
                    <div key={keyword.id} className="grid grid-cols-10 gap-4 px-4 py-3 items-center hover:bg-[#1a1a1a]">
                      <div className="col-span-6 font-medium text-white">
                        {keyword.keyword}
                      </div>
                      <div className="col-span-2">
                        <Badge variant="outline" className={`flex items-center gap-1.5 ${getStatusColor(keyword.status)}`}>
                          {statusIcons[keyword.status as keyof typeof statusIcons]}
                          <span className="capitalize">{keyword.status}</span>
                        </Badge>
                      </div>
                      <div className="col-span-2">
                        <Badge variant="outline" className={getDifficultyColor(keyword.difficulty)}>
                          {keyword.difficulty}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Settings Panel */}
        <div className="space-y-6">
          <Card className="bg-[#161616] border-[#333333] text-white">
            <CardHeader>
              <CardTitle className="text-xl font-medium text-white">
                Publishing Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tone & Format Settings */}
              <div>
                <h3 className="text-sm font-medium text-white mb-3">Tone & Format</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1.5 block">Content Tone</label>
                    <div className="flex items-center justify-between rounded-md border border-[#333333] bg-[#222222] px-3 py-2">
                      <span className="text-sm text-white capitalize">{selectedTone}</span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400 mb-1.5 block">Content Format</label>
                    <div className="flex items-center justify-between rounded-md border border-[#333333] bg-[#222222] px-3 py-2">
                      <span className="text-sm text-white capitalize">{selectedFormat}</span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Schedule & Cadence */}
              <div>
                <h3 className="text-sm font-medium text-white mb-3">Schedule & Cadence</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-1.5 block">Weekly Posts</label>
                    <div className="flex items-center gap-3">
                      <Button 
                        size="sm"
                        variant="outline" 
                        className="border-[#333333] text-white hover:bg-[#222222]"
                        onClick={() => weeklyPosts > 1 && setWeeklyPosts(weeklyPosts - 1)}
                      >
                        -
                      </Button>
                      <span className="text-white font-medium w-6 text-center">{weeklyPosts}</span>
                      <Button 
                        size="sm"
                        variant="outline" 
                        className="border-[#333333] text-white hover:bg-[#222222]"
                        onClick={() => setWeeklyPosts(weeklyPosts + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400 mb-1.5 block">Publishing Days</label>
                    <div className="flex items-center gap-1.5">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                        <div 
                          key={i} 
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium border ${
                            i < 2 ? 'bg-white border-white text-[#0c0c0c]' : 'border-[#333333] text-gray-400 hover:border-gray-300 cursor-pointer'
                          }`}
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm text-gray-400 mb-1.5 block">Publishing Time</label>
                    <div className="flex items-center justify-between rounded-md border border-[#333333] bg-[#222222] px-3 py-2">
                      <span className="text-sm text-white">9:00 AM</span>
                      <Clock className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Button className="w-full bg-[#333333] hover:bg-[#444444] text-white flex items-center gap-2 justify-center">
            <Calendar className="h-4 w-4" />
            View Publishing Calendar
          </Button>
        </div>
      </div>
      
      {/* Content Queue */}
      <Card className="bg-[#161616] border-[#333333] text-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-medium text-white">
            Content Queue
          </CardTitle>
          <Button 
            variant="outline" 
            className="flex items-center gap-2 text-sm border-[#333333] bg-[#222222] hover:bg-[#2a2a2a] text-white"
          >
            <PlusCircle className="h-4 w-4" />
            Add to Queue
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="bg-[#222222] border border-[#333333]">
              <TabsTrigger value="upcoming" className="data-[state=active]:bg-[#333333]">
                Upcoming (3)
              </TabsTrigger>
              <TabsTrigger value="published" className="data-[state=active]:bg-[#333333]">
                Published (8)
              </TabsTrigger>
              <TabsTrigger value="indexed" className="data-[state=active]:bg-[#333333]">
                Indexed (5)
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="pt-4">
              <div className="rounded-md border border-[#333333] overflow-hidden">
                <div className="grid grid-cols-12 gap-4 bg-[#222222] px-4 py-3 text-sm font-medium text-gray-400">
                  <div className="col-span-6">Article Title</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Date</div>
                  <div className="col-span-2">Actions</div>
                </div>
                <div className="divide-y divide-[#333333]">
                  {[
                    { title: "AEO vs SEO: What's the Difference?", status: "drafted", date: "June 20, 2023" },
                    { title: "10 Ways to Improve Your AI Visibility", status: "planned", date: "June 25, 2023" },
                    { title: "How ChatGPT Finds and Ranks Content", status: "planned", date: "June 30, 2023" }
                  ].map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-[#1a1a1a]">
                      <div className="col-span-6 font-medium text-white">
                        {item.title}
                      </div>
                      <div className="col-span-2">
                        <Badge variant="outline" className={`flex items-center gap-1.5 ${getStatusColor(item.status)}`}>
                          {statusIcons[item.status as keyof typeof statusIcons]}
                          <span className="capitalize">{item.status}</span>
                        </Badge>
                      </div>
                      <div className="col-span-2 text-gray-400">
                        {item.date}
                      </div>
                      <div className="col-span-2 flex gap-2">
                        <Button variant="outline" size="sm" className="border-[#333333] text-white hover:bg-[#222222]">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="border-[#333333] text-white hover:bg-[#222222]">
                          Skip
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="published" className="pt-4">
              <div className="rounded-md border border-[#333333] p-6 text-center text-gray-400">
                Published content will appear here
              </div>
            </TabsContent>
            <TabsContent value="indexed" className="pt-4">
              <div className="rounded-md border border-[#333333] p-6 text-center text-gray-400">
                Indexed content will appear here
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  )
} 