'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { OverallAEOCard } from './components/overall-aeo-card'
import { DirectCitationCard } from './components/direct-citation-card'
import { TopicVisibilityCard } from '@/app/dashboard/components/topic-visibility-card'
import { CompetitorBenchmarkingCard } from '@/app/dashboard/components/competitor-benchmarking-card'
import { SuggestionsCard } from './components/suggestions-card'

interface VisibilityData {
  overallScore: number
  scoreHistory: { date: string; score: number }[]
  topics: { topic: string; score: number }[]
  citations: { owned: number; operated: number; earned: number }
  competitors: any[]
  suggestions: { topic: string }[]
}

export default function VisibilityTestPage() {
  const { loading } = useAuth()
  const [data, setData] = useState<VisibilityData | null>(null)

  useEffect(() => {
    fetch('/api/visibility-test')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load')
        return r.json()
      })
      .then(setData)
      .catch((err) => console.error(err))
  }, [])

  if (loading || !data) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-[#0c0c0c]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-white" />
      </div>
    )
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 h-[calc(100vh-64px)] bg-[#0c0c0c] overflow-y-auto">
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
          <TopicVisibilityCard />
        </div>
        <div className="xl:col-span-4 h-full min-h-[520px] pl-4 pr-4 pb-4">
          <CompetitorBenchmarkingCard />
        </div>
      </div>
      <div className="pl-4 pr-4 pb-4">
        <SuggestionsCard suggestions={data.suggestions} />
      </div>
    </main>
  )
}
