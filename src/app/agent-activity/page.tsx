'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Activity, 
  Clock, 
  RefreshCw, 
  CheckCircle2, 
  XCircle,
  FileText,
  ExternalLink,
  Send,
  AlertTriangle,
  RotateCw,
  Calendar,
  ChevronDown,
  Search,
  MoreHorizontal
} from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Article {
  id: string;
  title: string;
  url: string;
  status: 'drafted' | 'published' | 'indexed';
  date: string;
  llmPingSent: boolean;
}

export default function AgentActivity() {
  // Mock data for published articles
  const [articles, setArticles] = useState<Article[]>([
    {
      id: '1',
      title: 'How AI Engine Optimization Works',
      url: '/blog/how-ai-engine-optimization-works',
      status: 'indexed',
      date: '2023-05-15',
      llmPingSent: true
    },
    {
      id: '2',
      title: 'ChatGPT Visibility: A Complete Guide',
      url: '/blog/chatgpt-visibility-guide',
      status: 'indexed',
      date: '2023-05-22',
      llmPingSent: true
    },
    {
      id: '3',
      title: '10 Ways to Improve LLM Discoverability',
      url: '/blog/improve-llm-discoverability',
      status: 'published',
      date: '2023-06-01',
      llmPingSent: true
    },
    {
      id: '4',
      title: 'Understanding llms.txt for AI Visibility',
      url: '/blog/understanding-llms-txt',
      status: 'published',
      date: '2023-06-08',
      llmPingSent: false
    },
    {
      id: '5',
      title: 'The Future of AI Search and Content',
      url: '/blog/future-ai-search-content',
      status: 'drafted',
      date: '2023-06-15',
      llmPingSent: false
    }
  ])
  
  // Mock data for upcoming queue
  const upcomingArticles = [
    {
      id: '101',
      title: 'AI-First Content Development',
      keyword: 'AI content strategy',
      date: '2023-06-22',
      status: 'scheduled'
    },
    {
      id: '102',
      title: 'Measuring Your AI Visibility Success',
      keyword: 'AI visibility metrics',
      date: '2023-06-29',
      status: 'scheduled'
    },
    {
      id: '103',
      title: 'How to Get Listed in AI Knowledge Graphs',
      keyword: 'AI knowledge graph optimization',
      date: '2023-07-06',
      status: 'pending'
    }
  ]
  
  const pingLLM = (articleId: string) => {
    setArticles(articles.map(article => 
      article.id === articleId 
        ? {...article, llmPingSent: true} 
        : article
    ))
  }
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'drafted':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-800/50'
      case 'published':
        return 'bg-blue-900/30 text-blue-400 border-blue-800/50'
      case 'indexed':
        return 'bg-green-900/30 text-green-400 border-green-800/50'
      case 'scheduled':
        return 'bg-purple-900/30 text-purple-400 border-purple-800/50'
      case 'pending':
        return 'bg-gray-800 text-gray-300 border-gray-700'
      default:
        return 'bg-gray-800 text-gray-300 border-gray-700'
    }
  }
  
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'drafted':
        return <FileText className="h-4 w-4 text-yellow-400" />
      case 'published':
        return <CheckCircle2 className="h-4 w-4 text-blue-400" />
      case 'indexed':
        return <Search className="h-4 w-4 text-green-400" />
      case 'scheduled':
        return <Calendar className="h-4 w-4 text-purple-400" />
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-400" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }
  
  return (
    <main className="flex flex-1 flex-col gap-8 p-8 bg-[#0c0c0c] overflow-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Activity</h1>
          <p className="text-gray-400">Monitor publishing activity and manage your AI content queue</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2 border-[#333333] text-white hover:bg-[#222222]"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Status
          </Button>
          <Button 
            className="flex items-center gap-2 bg-white hover:bg-gray-100 text-[#0c0c0c]"
          >
            <Activity className="h-4 w-4" />
            Run Activity Report
          </Button>
        </div>
      </div>
      
      {/* Agent Publishing Feed */}
      <Card className="bg-[#161616] border-[#333333] text-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-medium text-white">
            Agent Publishing Feed
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-400"></div>
            <span className="text-sm text-white">Agent active</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-[#333333] overflow-hidden">
            <div className="grid grid-cols-12 gap-4 bg-[#222222] px-4 py-3 text-sm font-medium text-gray-400">
              <div className="col-span-5">Article Title</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-1">LLM Ping</div>
              <div className="col-span-2">Actions</div>
            </div>
            <div className="divide-y divide-[#333333]">
              {articles.map((article) => (
                <div key={article.id} className="grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-[#1a1a1a]">
                  <div className="col-span-5">
                    <p className="font-medium text-white">{article.title}</p>
                    <p className="text-xs text-gray-400">{article.url}</p>
                  </div>
                  <div className="col-span-2">
                    <Badge variant="outline" className={`flex items-center gap-1.5 ${getStatusColor(article.status)}`}>
                      {getStatusIcon(article.status)}
                      <span className="capitalize">{article.status}</span>
                    </Badge>
                  </div>
                  <div className="col-span-2 text-gray-400 text-sm">
                    {article.date}
                  </div>
                  <div className="col-span-1">
                    {article.llmPingSent ? (
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  <div className="col-span-2 flex gap-2">
                    {!article.llmPingSent && (
                      <Button 
                        size="sm" 
                        className="bg-[#333333] hover:bg-[#444444] text-white text-xs"
                        onClick={() => pingLLM(article.id)}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Ping
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="border-[#333333] text-white hover:bg-[#222222]">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    {article.status === 'published' && (
                      <Button variant="outline" size="sm" className="border-[#333333] text-white hover:bg-[#222222]">
                        <RotateCw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-400">
            Showing 5 of 12 articles. 
            <Button variant="link" className="text-white p-0 h-auto text-sm">View all</Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Upcoming Queue */}
      <Card className="bg-[#161616] border-[#333333] text-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-medium text-white">
            Upcoming Queue
          </CardTitle>
          <Badge className="bg-[#222222] text-white border-[#333333]">
            Next publication: 2 days
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingArticles.map((article) => (
              <div key={article.id} className="rounded-md border border-[#333333] p-4 hover:bg-[#1a1a1a] transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={getStatusColor(article.status)}>
                        {article.status}
                      </Badge>
                      <p className="text-sm text-gray-400">{article.date}</p>
                    </div>
                    <h3 className="font-medium text-white mb-1">{article.title}</h3>
                    <p className="text-sm text-gray-400">Keyword: <span className="text-gray-300">{article.keyword}</span></p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="h-8 border-[#333333] text-white hover:bg-[#222222]">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 border-[#333333] text-white hover:bg-[#222222]">
                      Replace
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 border-[#333333] text-white hover:bg-[#222222]">
                      Skip
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            <Button 
              variant="outline" 
              className="w-full mt-4 border-dashed border-[#333333] text-gray-400 hover:text-white hover:bg-[#222222] h-16"
            >
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4" /> 
                <span>Schedule more content</span>
              </p>
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Activity Log */}
      <Card className="bg-[#161616] border-[#333333] text-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-medium text-white">
            Activity Log
          </CardTitle>
          <Button 
            variant="outline" 
            className="text-sm flex items-center gap-2 border-[#333333] text-white hover:bg-[#222222]"
          >
            Export Log
            <ChevronDown className="h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 p-4 rounded-md border border-[#333333] bg-[#111111] max-h-60 overflow-y-auto">
            {[
              { time: '2023-06-15 09:32', message: 'Article "The Future of AI Search and Content" drafted by agent', type: 'info' },
              { time: '2023-06-15 09:30', message: 'Content generation started for "The Future of AI Search and Content"', type: 'info' },
              { time: '2023-06-12 14:45', message: 'Sitemap.xml updated with new content', type: 'success' },
              { time: '2023-06-10 11:20', message: 'LLM ping failed for "Understanding llms.txt for AI Visibility"', type: 'error' },
              { time: '2023-06-08 08:00', message: 'Article "Understanding llms.txt for AI Visibility" published', type: 'success' },
              { time: '2023-06-04 16:33', message: 'LLM ping sent for "10 Ways to Improve LLM Discoverability"', type: 'success' },
              { time: '2023-06-01 09:15', message: 'Article "10 Ways to Improve LLM Discoverability" published', type: 'success' },
              { time: '2023-05-30 15:30', message: 'Content approved for publishing', type: 'info' },
              { time: '2023-05-25 10:22', message: 'ChatGPT Visibility article indexed in multiple LLMs', type: 'success' },
              { time: '2023-05-22 08:00', message: 'Article "ChatGPT Visibility: A Complete Guide" published', type: 'success' },
            ].map((log, i) => (
              <div key={i} className="py-2 px-3 text-sm rounded border-l-2 hover:bg-[#161616]" 
                style={{ 
                  borderLeftColor: log.type === 'success' ? '#10b981' : 
                                  log.type === 'error' ? '#ef4444' : '#6366f1'
                }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    {log.type === 'success' && <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5" />}
                    {log.type === 'error' && <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5" />}
                    {log.type === 'info' && <Activity className="h-4 w-4 text-indigo-400 mt-0.5" />}
                    <div>
                      <p className="text-gray-200">{log.message}</p>
                      <p className="text-xs text-gray-500">{log.time}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-gray-400 hover:text-white">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  )
} 