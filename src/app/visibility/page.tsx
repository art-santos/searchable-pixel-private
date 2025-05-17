'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/use-user'

interface Mention {
  source: string
  query: string
  mention_type: string
  mention_tier: string
  snippet: string
  prompt_type: string
  weighted_score: number
  position_in_response: number
  sentiment?: string
}

interface ScoreBreakdown {
  authority_score: number
  recall_score: number
  citation_depth_score: number
  visibility_score: number
}

interface VisibilityResult {
  domain: string
  scores: ScoreBreakdown
  brand_rank: number
  rank_total: number
  brand_position: string
  industry_brands_detected: number
  mention_quality: {
    tier1_mentions: number
    tier2_mentions: number
    tier3_mentions: number
    no_mentions: number
  }
  prompt_performance: {
    high_intent: number
    medium_intent: number
    direct: number
    general: number
  }
  top_ranked_companies: string[]
  mentions_found: Mention[]
  last_rerolled: string
  action_plan: string[]
}

export default function VisibilityPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { user, profile } = useUser()
  
  const [domain, setDomain] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<VisibilityResult | null>(null)
  const [savedResults, setSavedResults] = useState<VisibilityResult[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [chunkedMentions, setChunkedMentions] = useState<Mention[]>([])
  const [receivingChunks, setReceivingChunks] = useState(false)
  const [resultWithoutMentions, setResultWithoutMentions] = useState<Partial<VisibilityResult> | null>(null)

  // Load user's domain from profile and saved results
  useEffect(() => {
    if (profile) {
      setDomain(profile.company_domain || '')
      setCategory(profile.company_category || '')
      loadSavedResults()
    }
  }, [profile])

  // Effect to assemble complete result when chunks are received
  useEffect(() => {
    if (receivingChunks && resultWithoutMentions && chunkedMentions.length > 0) {
      console.log(`Assembling result with ${chunkedMentions.length} mentions`);
      // Only finalize if we're not still loading
      if (!loading) {
        const completeResult = {
          ...resultWithoutMentions,
          mentions_found: chunkedMentions
        } as VisibilityResult;
        
        setResult(completeResult);
        saveResultToSupabase(completeResult);
        setReceivingChunks(false);
        console.log("Reconstructed complete result with all mentions");
      }
    }
  }, [chunkedMentions, resultWithoutMentions, receivingChunks, loading]);

  const loadSavedResults = async () => {
    if (!user?.id) return
    
    const supabase = createClient()
    const { data, error } = await supabase
      .from('visibility_results')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (error) {
      console.error('Error loading saved results:', error)
      return
    }
    
    if (data && data.length > 0) {
      setSavedResults(data.map(d => d.result_data))
      setResult(data[0].result_data)
    }
  }

  const saveResultToSupabase = async (resultData: VisibilityResult) => {
    if (!user?.id) return
    
    const supabase = createClient()
    const { error } = await supabase
      .from('visibility_results')
      .insert({
        user_id: user.id,
        domain: resultData.domain,
        result_data: resultData,
        created_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Error saving result:', error)
      toast({
        title: 'Error saving result',
        description: error.message,
        variant: 'destructive'
      })
    } else {
      loadSavedResults() // Reload saved results
    }
  }

  const updateProgress = (completed: number, total: number) => {
    const percentage = Math.round((completed / total) * 100)
    setProgress(percentage)
  }

  const runCheck = async () => {
    if (!domain || !category) {
      toast({
        title: 'Missing information',
        description: 'Please provide both domain and category',
        variant: 'destructive'
      })
      return
    }
    
    setLoading(true)
    setProgress(0)
    setChunkedMentions([])
    setReceivingChunks(false)
    setResultWithoutMentions(null)
    
    try {
      const res = await fetch('/api/visibility/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          domain, 
          category,
          onProgress: true
        })
      })
      
      // Handle server-sent events for progress updates
      if (res.headers.get('Content-Type')?.includes('text/event-stream')) {
        const reader = res.body?.getReader()
        const decoder = new TextDecoder()
        
        while (reader && res.ok) {
          const { value, done } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value)
          console.log("Received chunk:", chunk.length) // Log the chunk size
          const lines = chunk.split('\n').filter(Boolean)
          
          for (const line of lines) {
            if (line.startsWith('data:')) {
              try {
                const jsonStr = line.slice(5).trim()
                console.log("Processing JSON type:", jsonStr.includes('"type":"result_start"') ? "result_start" : 
                                                  jsonStr.includes('"type":"result_chunk"') ? "result_chunk" : 
                                                  jsonStr.includes('"type":"result_end"') ? "result_end" : 
                                                  jsonStr.includes('"type":"result"') ? "result" : 
                                                  jsonStr.includes('"type":"progress"') ? "progress" : "unknown")
                
                const data = JSON.parse(jsonStr)
                console.log("Parsed data type:", data.type) 
                
                if (data.type === 'progress') {
                  updateProgress(data.completed, data.total)
                  console.log(`Progress update: ${data.completed}/${data.total}`)
                } 
                else if (data.type === 'result_start') {
                  // This contains everything except mentions
                  setReceivingChunks(true)
                  setResultWithoutMentions(data.result)
                  console.log("Received result metadata (without mentions)")
                  
                  // Initialize with empty mentions array
                  setChunkedMentions([])
                }
                else if (data.type === 'result_chunk') {
                  // This contains a chunk of mentions
                  console.log(`Received mention chunk with ${data.mentions.length} mentions`)
                  setChunkedMentions(prev => [...prev, ...data.mentions])
                }
                else if (data.type === 'result_end') {
                  // This is the final chunk of mentions
                  console.log(`Received final mention chunk with ${data.mentions.length} mentions`)
                  const finalMentions = [...chunkedMentions, ...data.mentions]
                  
                  // Now we can reconstruct the complete result
                  if (resultWithoutMentions) {
                    const completeResult = {
                      ...resultWithoutMentions,
                      mentions_found: finalMentions
                    } as VisibilityResult
                    
                    setResult(completeResult)
                    saveResultToSupabase(completeResult)
                    setLoading(false)
                    setProgress(100)
                    setReceivingChunks(false)
                    console.log("Reconstructed complete result with all mentions")
                  }
                }
                else if (data.type === 'result') {
                  // Legacy format - single complete result
                  console.log("Received complete result (non-chunked)")
                  setResult(data.result)
                  saveResultToSupabase(data.result)
                  setLoading(false)
                  setProgress(100)
                }
              } catch (parseError) {
                console.error("JSON parse error:", parseError)
                console.error("Problem with line:", line.slice(5).substring(0, 100) + "...")
                // Continue processing other lines even if one fails
              }
            }
          }
        }
      } else {
        // Fallback for non-streaming response
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Error fetching visibility')
        setResult(data)
        saveResultToSupabase(data)
      }
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Error checking visibility',
        description: err.message || 'An unexpected error occurred',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Group mentions by type for better organization
  const mentionsByTier = result ? {
    tier1: result.mentions_found?.filter(m => m?.mention_tier === 'tier1') || [],
    tier2: result.mentions_found?.filter(m => m?.mention_tier === 'tier2') || [],
    tier3: result.mentions_found?.filter(m => m?.mention_tier === 'tier3') || []
  } : { tier1: [], tier2: [], tier3: [] }

  return (
    <main className="flex flex-1 flex-col gap-4 p-6 overflow-auto bg-[#050505] text-gray-300">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-medium text-white">Visibility Dashboard</h1>
          <p className="text-xs text-gray-500 mt-1">
            {result ? `Last checked: ${new Date(result.last_rerolled).toLocaleDateString()} ${new Date(result.last_rerolled).toLocaleTimeString()}` : 'Track your brand\'s visibility in AI responses'}
          </p>
        </div>
        
        <Button
          onClick={runCheck}
          disabled={loading}
          className="border-none bg-[#171717] hover:bg-[#222] text-white h-9 px-4 text-sm"
        >
          {loading ? 'Analyzing...' : 'Run Check'}
        </Button>
      </div>

      {/* Company settings - simplified */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Domain</label>
          <Input
            placeholder="yourdomain.com"
            value={domain}
            onChange={e => setDomain(e.target.value)}
            className="bg-[#101010] border-[#1a1a1a] text-white h-9"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Category</label>
          <Input
            placeholder="e.g. AI Marketing, CRM, Analytics"
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="bg-[#101010] border-[#1a1a1a] text-white h-9"
          />
        </div>
      </div>
      
      {loading && (
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-md p-4 my-2">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-medium text-white">
              {receivingChunks 
                ? `Processing data: ${chunkedMentions.length} mentions gathered` 
                : `Analyzing ${domain}`}
            </h2>
            <span className="text-sm text-gray-400">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1 bg-[#1a1a1a]" indicatorClassName="bg-gradient-to-r from-gray-500 to-gray-700" />
          <p className="text-xs text-gray-500 mt-3">
            Analyzing AI responses to measure brand visibility
          </p>
        </div>
      )}

      {result && !loading && (
        <Tabs defaultValue="overview" className="space-y-4" onValueChange={setActiveTab}>
          <TabsList className="bg-[#0a0a0a] border border-[#1a1a1a] p-0.5">
            <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-[#171717] data-[state=active]:text-white rounded-sm">
              Overview
            </TabsTrigger>
            <TabsTrigger value="mentions" className="text-xs data-[state=active]:bg-[#171717] data-[state=active]:text-white rounded-sm">
              Mentions
            </TabsTrigger>
            <TabsTrigger value="action-plan" className="text-xs data-[state=active]:bg-[#171717] data-[state=active]:text-white rounded-sm">
              Action Plan
            </TabsTrigger>
          </TabsList>
          
          {/* OVERVIEW TAB - Simplified */}
          <TabsContent value="overview" className="space-y-4 mt-2">
            <div className="grid gap-4 md:grid-cols-3">
              {/* Visibility Score - Kept orange gradient */}
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-md p-4 flex flex-col items-center">
                <div className="relative w-32 h-32">
                  <svg width="128" height="128" viewBox="0 0 128 128" className="rotate-[-90deg]">
                    <circle
                      cx="64"
                      cy="64"
                      r="60"
                      fill="transparent"
                      stroke="#1a1a1a"
                      strokeWidth="8"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="60"
                      fill="transparent"
                      stroke="url(#scoreGradient)"
                      strokeWidth="8"
                      strokeDasharray={2 * Math.PI * 60}
                      strokeDashoffset={2 * Math.PI * 60 * (1 - result.scores.visibility_score / 100)}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ff7c43" />
                        <stop offset="100%" stopColor="#ff9b57" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-medium text-white">{result.scores.visibility_score}</span>
                    <span className="text-xs text-gray-500">Visibility</span>
                  </div>
                </div>
              </div>
              
              {/* Brand Position */}
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-md p-4 flex flex-col justify-center">
                <div className="text-center">
                  <div className="text-3xl font-medium text-white mb-1">
                    #{result.brand_rank}
                  </div>
                  <div className="text-xs text-gray-500">
                    of {result.rank_total} brands detected
                  </div>
                  <div className="mt-2 text-xs text-white py-1 px-3 bg-[#171717] inline-block rounded">
                    {result.brand_position}
                  </div>
                </div>
              </div>
              
              {/* Mention Quality */}
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-md p-4">
                <h3 className="text-xs text-gray-500 mb-3">Mention Quality</h3>
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div>
                    <div className="text-xl font-medium text-white">
                      {result.mention_quality.tier1_mentions}
                    </div>
                    <div className="text-xs text-gray-500">Tier 1</div>
                  </div>
                  <div>
                    <div className="text-xl font-medium text-white">
                      {result.mention_quality.tier2_mentions}
                    </div>
                    <div className="text-xs text-gray-500">Tier 2</div>
                  </div>
                  <div>
                    <div className="text-xl font-medium text-white">
                      {result.mention_quality.tier3_mentions}
                    </div>
                    <div className="text-xs text-gray-500">Tier 3</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Score breakdown and top competitors - combined */}
            <div className="grid gap-4 md:grid-cols-2">
              {/* Score Breakdown */}
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-md p-4">
                <h3 className="text-xs text-gray-500 mb-3">Score Breakdown</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-400">Authority</span>
                      <span className="text-xs text-white">{result.scores.authority_score}</span>
                    </div>
                    <Progress value={result.scores.authority_score} className="h-1 bg-[#1a1a1a]" indicatorClassName="bg-gray-500" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-400">Recall</span>
                      <span className="text-xs text-white">{result.scores.recall_score}</span>
                    </div>
                    <Progress value={result.scores.recall_score} className="h-1 bg-[#1a1a1a]" indicatorClassName="bg-gray-600" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-400">Citation Depth</span>
                      <span className="text-xs text-white">{result.scores.citation_depth_score}</span>
                    </div>
                    <Progress value={result.scores.citation_depth_score} className="h-1 bg-[#1a1a1a]" indicatorClassName="bg-gray-700" />
                  </div>
                </div>
              </div>
              
              {/* Top Competitors */}
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-md p-4">
                <h3 className="text-xs text-gray-500 mb-3">Top Competitors</h3>
                <div>
                  {result.top_ranked_companies && result.top_ranked_companies.length > 0 ? (
                    result.top_ranked_companies.slice(0, 5).map((company, idx) => (
                      <div key={idx} className="flex items-center py-1 border-b border-[#171717] last:border-0">
                        <div className="w-5 text-xs text-gray-500">#{idx + 1}</div>
                        <div className="flex-1 text-sm text-white">{company}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 text-center py-3 text-xs">
                      No notable competitors detected
                    </div>
                  )}
                </div>
                {result.top_ranked_companies && result.top_ranked_companies.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-[#171717] text-xs text-gray-500">
                    Top Brands Mentioned
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* MENTIONS TAB - Simplified */}
          <TabsContent value="mentions" className="mt-2">
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-md p-3">
              <Tabs defaultValue="tier1" className="w-full">
                <div className="flex mb-3 border-b border-[#171717]">
                  <TabsList className="bg-transparent p-0">
                    <TabsTrigger value="tier1" className="text-xs data-[state=active]:text-white data-[state=active]:border-b data-[state=active]:border-white pb-2 rounded-none bg-transparent">
                      Tier 1 <span className="ml-1 text-xs text-gray-500">({mentionsByTier.tier1.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="tier2" className="text-xs data-[state=active]:text-white data-[state=active]:border-b data-[state=active]:border-white pb-2 rounded-none bg-transparent">
                      Tier 2 <span className="ml-1 text-xs text-gray-500">({mentionsByTier.tier2.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="tier3" className="text-xs data-[state=active]:text-white data-[state=active]:border-b data-[state=active]:border-white pb-2 rounded-none bg-transparent">
                      Tier 3 <span className="ml-1 text-xs text-gray-500">({mentionsByTier.tier3.length})</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                {/* Tier1 mentions */}
                <TabsContent value="tier1">
                  <Accordion type="single" collapsible className="space-y-2">
                    {mentionsByTier.tier1.map((m, idx) => (
                      <AccordionItem key={idx} value={`tier1-${idx}`} className="border border-[#171717] rounded-sm">
                        <AccordionTrigger className="text-white px-3 py-2 text-xs">
                          <div className="flex justify-between w-full pr-4 text-left">
                            <span className="truncate max-w-[70%]">{m?.query || 'Unknown query'}</span>
                            <span className="text-xs px-2 py-0.5 bg-[#171717] rounded-sm">
                              {m?.prompt_type?.replace('_', ' ') || 'unknown'}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-3">
                          <div className="text-gray-400 text-xs mb-2 whitespace-pre-wrap">{m?.snippet || 'No content available'}</div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <span className="text-xs text-gray-500">
                              Score: {m?.weighted_score || 0}
                            </span>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                    {mentionsByTier.tier1.length === 0 && (
                      <div className="text-gray-500 text-center py-4 text-xs">No tier 1 mentions found</div>
                    )}
                  </Accordion>
                </TabsContent>
                
                {/* Tier2 mentions */}
                <TabsContent value="tier2">
                  <Accordion type="single" collapsible className="space-y-2">
                    {mentionsByTier.tier2.map((m, idx) => (
                      <AccordionItem key={idx} value={`tier2-${idx}`} className="border border-[#171717] rounded-sm">
                        <AccordionTrigger className="text-white px-3 py-2 text-xs">
                          <div className="flex justify-between w-full pr-4 text-left">
                            <span className="truncate max-w-[70%]">{m?.query || 'Unknown query'}</span>
                            <span className="text-xs px-2 py-0.5 bg-[#171717] rounded-sm">
                              {m?.prompt_type?.replace('_', ' ') || 'unknown'}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-3">
                          <div className="text-gray-400 text-xs mb-2 whitespace-pre-wrap">{m?.snippet || 'No content available'}</div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <span className="text-xs text-gray-500">
                              Score: {m?.weighted_score || 0}
                            </span>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                    {mentionsByTier.tier2.length === 0 && (
                      <div className="text-gray-500 text-center py-4 text-xs">No tier 2 mentions found</div>
                    )}
                  </Accordion>
                </TabsContent>
                
                {/* Tier3 mentions */}
                <TabsContent value="tier3">
                  <Accordion type="single" collapsible className="space-y-2">
                    {mentionsByTier.tier3.map((m, idx) => (
                      <AccordionItem key={idx} value={`tier3-${idx}`} className="border border-[#171717] rounded-sm">
                        <AccordionTrigger className="text-white px-3 py-2 text-xs">
                          <div className="flex justify-between w-full pr-4 text-left">
                            <span className="truncate max-w-[70%]">{m?.query || 'Unknown query'}</span>
                            <span className="text-xs px-2 py-0.5 bg-[#171717] rounded-sm">
                              {m?.prompt_type?.replace('_', ' ') || 'unknown'}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-3">
                          <div className="text-gray-400 text-xs mb-2 whitespace-pre-wrap">{m?.snippet || 'No content available'}</div>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <span className="text-xs text-gray-500">
                              Score: {m?.weighted_score || 0}
                            </span>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                    {mentionsByTier.tier3.length === 0 && (
                      <div className="text-gray-500 text-center py-4 text-xs">No tier 3 mentions found</div>
                    )}
                  </Accordion>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
          
          {/* ACTION PLAN TAB - Simplified */}
          <TabsContent value="action-plan" className="mt-2">
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-md p-4">
              <h3 className="text-xs text-gray-500 mb-3">Action Plan</h3>
              <div className="space-y-3">
                {result.action_plan.map((tip, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-[#171717] flex items-center justify-center text-xs text-white">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-300">{tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </main>
  )
}
