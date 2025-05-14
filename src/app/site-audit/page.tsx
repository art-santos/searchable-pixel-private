'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Search, 
  AlertTriangle, 
  Check, 
  HelpCircle,
  MessageSquare, 
  ArrowUpRight,
  ChevronRight,
  Info,
  ExternalLink,
  Link as LinkIcon,
  FileText,
  CheckCircle2,
  Bot,
  RefreshCw
} from 'lucide-react'
import { Badge } from "@/components/ui/badge"

export default function SiteAudit() {
  const [promptTest, setPromptTest] = useState<string | null>(null)
  
  // Mock data for site content analysis
  const contentAnalysis = {
    answeredQuestions: [
      "What is AI Engine Optimization?",
      "How do LLMs index website content?",
      "What makes content visible to ChatGPT?",
      "Differences between AEO and SEO"
    ],
    potentialGaps: [
      "Best practices for structured data for LLMs",
      "How to monitor AI visibility metrics",
      "Step-by-step guide to implement llms.txt"
    ],
    overlappingContent: [
      {
        pages: ["/aeo-guides", "/ai-visibility"],
        issue: "Similar content about AI visibility techniques"
      },
      {
        pages: ["/chatgpt-indexing", "/llm-content-guidelines"],
        issue: "Duplicate recommendations for ChatGPT visibility"
      }
    ]
  }
  
  // Mock data for fix suggestions
  const fixSuggestions = [
    {
      type: "schema",
      count: 14,
      description: "Missing schema on 14 pages",
      severity: "high"
    },
    {
      type: "links",
      count: 3,
      description: "Consider internal linking between /pricing and /how-it-works",
      severity: "medium"
    },
    {
      type: "content",
      count: 1,
      description: "/about lacks AI-relevant language",
      severity: "low"
    },
    {
      type: "technical",
      count: 5,
      description: "llms.txt is not properly formatted",
      severity: "high"
    },
    {
      type: "sitemap",
      count: 2,
      description: "Two recent posts missing from sitemap.xml",
      severity: "medium"
    }
  ]
  
  const runLLMTest = () => {
    // Simulate fetching results from an LLM
    setTimeout(() => {
      setPromptTest("\"Split.dev is an AI Engine Optimization (AEO) platform that helps websites become more visible to large language models like me. It provides tools for content optimization, sitemap management, and structured data to improve how AI systems understand and reference content. The platform automates the process of making website content more discoverable in AI-generated responses.\"")
    }, 1500)
  }
  
  const getSeverityColor = (severity: string) => {
    switch(severity) {
      case 'high':
        return 'bg-red-900/30 text-red-400 border-red-800/50'
      case 'medium':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-800/50'
      case 'low':
        return 'bg-blue-900/30 text-blue-400 border-blue-800/50'
      default:
        return 'bg-gray-800 text-gray-300'
    }
  }
  
  return (
    <main className="flex flex-1 flex-col gap-8 p-8 bg-[#0c0c0c] overflow-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Site Audit</h1>
          <p className="text-gray-400">Analyze your site's AI visibility and discover improvement opportunities</p>
        </div>
        
        <Button 
          className="flex items-center gap-2 self-start md:self-auto bg-white hover:bg-gray-100 text-[#0c0c0c]"
        >
          <RefreshCw className="h-4 w-4" />
          Run New Audit
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Site Content Analysis */}
        <Card className="bg-[#161616] border-[#333333] text-white">
          <CardHeader>
            <CardTitle className="text-xl font-medium text-white">Site Content Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-white flex items-center gap-2 mb-3">
                <Check className="h-4 w-4 text-green-400" />
                Questions You're Already Answering
              </h3>
              <div className="space-y-2">
                {contentAnalysis.answeredQuestions.map((question, i) => (
                  <div key={i} className="rounded-md bg-[#222222] px-3 py-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-white">{question}</p>
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-white flex items-center gap-2 mb-3">
                <HelpCircle className="h-4 w-4 text-blue-400" />
                Gaps You Could Answer
              </h3>
              <div className="space-y-2">
                {contentAnalysis.potentialGaps.map((gap, i) => (
                  <div key={i} className="rounded-md bg-[#222222] px-3 py-2 flex items-center justify-between group cursor-pointer hover:bg-[#2a2a2a]">
                    <p className="text-sm text-white">{gap}</p>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Add to Queue
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-white flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                Overlapping/Confusing Content
              </h3>
              <div className="space-y-2">
                {contentAnalysis.overlappingContent.map((content, i) => (
                  <div key={i} className="rounded-md bg-[#222222] px-3 py-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="bg-blue-900/20 text-blue-400 border-blue-800/40 text-xs">
                            {content.pages[0]}
                          </Badge>
                          <span className="text-gray-400">+</span>
                          <Badge variant="outline" className="bg-purple-900/20 text-purple-400 border-purple-800/40 text-xs">
                            {content.pages[1]}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400">{content.issue}</p>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 border-[#333333] text-white hover:bg-[#222222]">
                        Fix
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* LLM Prompt Test */}
        <Card className="bg-[#161616] border-[#333333] text-white">
          <CardHeader>
            <CardTitle className="text-xl font-medium text-white">LLM Prompt Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-md border border-[#333333] bg-[#222222] p-4">
              <p className="text-sm text-gray-400 mb-3">Ask ChatGPT or Perplexity:</p>
              <p className="text-md text-white font-medium">
                "What is Split.dev?"
              </p>
            </div>
            
            <div className="flex justify-center">
              <Button 
                className="flex items-center gap-2 bg-[#333333] hover:bg-[#444444] text-white"
                onClick={runLLMTest}
                disabled={!!promptTest}
              >
                <MessageSquare className="h-4 w-4" />
                Run Test
              </Button>
            </div>
            
            {promptTest === null ? (
              <div className="rounded-md border border-dashed border-[#333333] p-6 text-center">
                <p className="text-gray-400">Run the test to see if AI models mention your site.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-purple-900/40 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="text-sm text-white bg-[#222222] p-4 rounded-md">
                    {promptTest}
                  </div>
                </div>
                <div className="rounded-md bg-green-900/20 border border-green-800/40 p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                    <p className="text-green-400 font-medium">Your site is being mentioned correctly!</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200">
                <RefreshCw className="h-4 w-4 mr-1" />
                Reset Test
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-200">
                <ExternalLink className="h-4 w-4 mr-1" />
                Try in ChatGPT
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Fix Suggestions */}
      <Card className="bg-[#161616] border-[#333333] text-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-medium text-white">
            Fix Suggestions
          </CardTitle>
          <Badge className="bg-[#222222] text-white border-[#333333]">
            {fixSuggestions.length} issues found
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-[#333333] overflow-hidden">
            <div className="grid grid-cols-12 gap-4 bg-[#222222] px-4 py-3 text-sm font-medium text-gray-400">
              <div className="col-span-1"></div>
              <div className="col-span-7">Issue</div>
              <div className="col-span-2">Severity</div>
              <div className="col-span-2">Actions</div>
            </div>
            <div className="divide-y divide-[#333333]">
              {fixSuggestions.map((suggestion, i) => (
                <div key={i} className="grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-[#1a1a1a]">
                  <div className="col-span-1">
                    {suggestion.type === 'schema' && <FileText className="h-5 w-5 text-blue-400" />}
                    {suggestion.type === 'links' && <LinkIcon className="h-5 w-5 text-purple-400" />}
                    {suggestion.type === 'content' && <MessageSquare className="h-5 w-5 text-yellow-400" />}
                    {suggestion.type === 'technical' && <AlertTriangle className="h-5 w-5 text-red-400" />}
                    {suggestion.type === 'sitemap' && <Search className="h-5 w-5 text-green-400" />}
                  </div>
                  <div className="col-span-7">
                    <p className="font-medium text-white">{suggestion.description}</p>
                    <p className="text-sm text-gray-400">Affects {suggestion.count} {suggestion.count === 1 ? 'item' : 'items'}</p>
                  </div>
                  <div className="col-span-2">
                    <Badge variant="outline" className={`${getSeverityColor(suggestion.severity)}`}>
                      {suggestion.severity}
                    </Badge>
                  </div>
                  <div className="col-span-2 flex gap-2">
                    <Button variant="outline" size="sm" className="border-[#333333] text-white hover:bg-[#222222]">
                      Fix Now
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-400 px-2 hover:text-gray-200">
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-6 flex justify-between items-center">
            <p className="text-sm text-gray-400">
              Last audit completed: <span className="text-white">June 15, 2023</span>
            </p>
            <Button variant="outline" className="text-white border-[#333333] hover:bg-[#222222]">
              Fix All High Priority Issues
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
} 