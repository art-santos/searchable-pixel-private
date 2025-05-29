'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { OverallAEOCard } from './components/overall-aeo-card'
import { DirectCitationCard } from './components/direct-citation-card'
import { TopicVisibilityCard } from '@/app/dashboard/components/topic-visibility-card'
import { CompetitorBenchmarkingCard } from '@/app/dashboard/components/competitor-benchmarking-card'
import { SuggestionsCard } from './components/suggestions-card'
import { AEOPipeline } from './components/aeo-pipeline'
import { AEOScoreCard } from './components/aeo-score-card'

interface VisibilityData {
  overallScore: number
  scoreHistory: { date: string; score: number }[]
  topics: { topic: string; score: number }[]
  citations: { owned: number; operated: number; earned: number }
  competitors: any[]
  suggestions: { topic: string; suggestion: string }[]
  // AEO specific data
  aeoData?: {
    aeo_score: number
    coverage_owned: number
    coverage_operated: number
    coverage_total: number
    share_of_voice: number
    metrics: {
      questions_analyzed: number
      total_results: number
      owned_appearances: number
      operated_appearances: number
      earned_appearances: number
      avg_owned_position: number
      avg_operated_position: number
      top_3_presence: number
    }
  }
}

export default function VisibilityTestPage() {
  const { loading, session } = useAuth()
  const [data, setData] = useState<VisibilityData | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Test form state
  const [testUrl, setTestUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [crawlStatus, setCrawlStatus] = useState<{ id?: string; status: string; message?: string } | null>(null)
  
  // AEO pipeline state
  const [isAnalyzerOpen, setIsAnalyzerOpen] = useState(false)
  const [urlToAnalyze, setUrlToAnalyze] = useState('')

  // Use real AEO pipeline data (no dummy data)
  const useLocalData = false
  
  const runTest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testUrl || isSubmitting) return
    
    // Format URL properly - add https:// prefix if missing
    let urlToTest = testUrl
    if (!/^https?:\/\//i.test(urlToTest)) {
      urlToTest = 'https://' + urlToTest
    }
    
    setIsSubmitting(true)
    setCrawlStatus({ status: 'processing', message: 'Starting analysis...' })
    
    // Open the AEO pipeline modal with the formatted URL
    setUrlToAnalyze(urlToTest)
    setIsAnalyzerOpen(true)
  }
  
  const handleAnalysisComplete = (analysisData: VisibilityData) => {
    setData(analysisData)
    setCrawlStatus({ 
      status: 'complete', 
      id: 'gpt-analysis-' + Date.now(), 
      message: 'Analysis complete!' 
    })
    setIsSubmitting(false)
    // Keep the analyzer open - user will close it manually
  }
  
  const closeAnalyzer = () => {
    setIsAnalyzerOpen(false)
  }

  useEffect(() => {
    if (useLocalData) return
    
    if (!session) return

    fetch('/api/visibility-test', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    })
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load visibility data')
        return r.json()
      })
      .then(setData)
      .catch((err) => {
        console.error(err)
        setError(err.message)
      })
  }, [session, useLocalData])

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-[#0c0c0c]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-white" />
      </div>
    )
  }

  // Show test form if we have an error or no data
  if (error || !data) {
    return (
      <div className="flex flex-col h-[calc(100vh-64px)] items-center justify-center bg-[#0c0c0c]">
        <div className="text-white text-center p-8 max-w-md bg-[#1a1a1a] rounded border border-[#333]">
          {error && (
            <>
              <h2 className="text-lg font-bold mb-4">Error loading visibility data</h2>
              <p className="mb-4">{error}</p>
            </>
          )}
          {!error && (
            <>
              <h2 className="text-lg font-bold mb-4">No visibility data available</h2>
              <p className="mb-4">
                You haven't analyzed any websites yet.
              </p>
            </>
          )}
          
          <form onSubmit={runTest} className="mt-6 mb-4">
            <h3 className="text-left mb-2 text-sm font-bold">Analyze Website Visibility</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter website URL (e.g., thinair.dev or https://example.com)"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                className="flex-1 px-3 py-2 bg-[#222] border border-[#444] rounded text-white"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#333] hover:bg-[#444] text-white rounded disabled:opacity-50"
              >
                {isSubmitting ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
            
            {crawlStatus && (
              <div className="mt-4 p-3 bg-[#222] text-sm border border-[#444] rounded">
                <div className="flex items-center gap-2">
                  <span className="text-[#ccc]">Status:</span>
                  <span className={`font-bold ${
                    crawlStatus.status === 'complete' ? 'text-green-400' : 
                    crawlStatus.status === 'error' ? 'text-red-400' : 
                    'text-blue-400'
                  }`}>
                    {crawlStatus.status === 'complete' ? 'Complete' : 
                     crawlStatus.status === 'error' ? 'Error' : 
                     'Processing'}
                  </span>
                </div>
                {crawlStatus.message && (
                  <div className="mt-1 text-[#bbb]">{crawlStatus.message}</div>
                )}
                {crawlStatus.id && (
                  <div className="mt-1 text-[#999]">Job ID: {crawlStatus.id}</div>
                )}
              </div>
            )}
          </form>
          
          <p className="text-sm opacity-70">
            Our AI will analyze the website content and generate visibility metrics.
          </p>
        </div>
        
        {/* AEO Pipeline Modal */}
        <AEOPipeline 
          isOpen={isAnalyzerOpen}
          crawlUrl={urlToAnalyze}
          onClose={closeAnalyzer}
          onAnalysisComplete={handleAnalysisComplete}
        />
      </div>
    )
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 h-[calc(100vh-64px)] bg-[#0c0c0c] overflow-y-auto">
      <div className="flex justify-between items-center px-4">
        <div>
          <h1 className="text-white text-xl font-bold">Visibility Analysis</h1>
          {data.aeoData && (
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-green-400 text-sm">Real-time AEO Analysis</span>
            </div>
          )}
        </div>
        
        {/* Add test form in the header */}
        <form onSubmit={runTest} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Enter domain or URL (e.g., thinair.dev)"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            className="w-72 px-3 py-1 bg-[#222] border border-[#444] rounded text-white text-sm"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-3 py-1 bg-[#333] hover:bg-[#444] text-white rounded text-sm disabled:opacity-50"
          >
            {isSubmitting ? 'Analyzing...' : 'Run Analysis'}
          </button>
          
          {crawlStatus && crawlStatus.status !== 'complete' && (
            <div className="text-sm text-blue-400">
              {crawlStatus.message}
            </div>
          )}
        </form>
      </div>
      
      {/* AEO Score Card - Full width when available */}
      {data.aeoData && (
        <div className="pl-4 pr-4 pt-4">
          <AEOScoreCard data={data.aeoData} />
        </div>
      )}
      
      <div className="grid xl:grid-cols-2 grid-cols-1 gap-3">
        <div className="pl-4 pr-4 pt-4">
          <OverallAEOCard history={data.scoreHistory} />
        </div>
        <div className="pl-4 pr-4 pt-4">
          <DirectCitationCard data={data.citations} />
        </div>
      </div>
      <div className="grid xl:grid-cols-12 grid-cols-1 gap-3 xl:gap-4 flex-1">
        <div className="xl:col-span-8 h-full min-h-[520px] pl-4 pr-4 pb-4">
          <TopicVisibilityCard customTopics={data.topics} />
        </div>
        <div className="xl:col-span-4 h-full min-h-[520px] pl-4 pr-4 pb-4">
          <CompetitorBenchmarkingCard />
        </div>
      </div>
      <div className="pl-4 pr-4 pb-4">
        <SuggestionsCard suggestions={data.suggestions} />
      </div>
      
      {/* AEO Pipeline Modal */}
      <AEOPipeline 
        isOpen={isAnalyzerOpen}
        crawlUrl={urlToAnalyze}
        onClose={closeAnalyzer}
        onAnalysisComplete={handleAnalysisComplete}
      />
    </main>
  )
}
