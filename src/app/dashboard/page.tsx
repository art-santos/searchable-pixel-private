'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageViewCard } from './components/page-view-card'
import { AEOScorecard } from './components/aeo-scorecard/aeo-scorecard'
import { TopicVisibilityCard } from './components/topic-visibility-card'
import { CompetitorBenchmarkingCard } from './components/competitor-benchmarking-card'

export default function Dashboard() {
  const { user, supabase, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-[#0c0c0c]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-white" />
      </div>
    )
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 h-[calc(100vh-64px)]">
      <div className="grid xl:grid-cols-2 grid-cols-1 gap-3 flex-[1.2]">
        <div className="pl-4 pr-4 pt-4 h-full"><PageViewCard /></div>

        {/* AEO Scorecard */}
        <div className="pl-4 pr-4 pt-4 h-full">
          <Card className="h-full">
            <CardContent className="p-6">
              <AEOScorecard />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Row - 65/35 split */}
      <div className="grid xl:grid-cols-12 grid-cols-1 gap-3 xl:gap-4 flex-1">
        {/* Topic Visibility - 65% */}
        <div className="xl:col-span-8 h-full min-h-[520px] pl-4 pr-4 pb-4">
          <TopicVisibilityCard />
        </div>

        {/* Competitive Benchmarking - 35% */}
        <div className="xl:col-span-4 h-full min-h-[520px] pl-4 pr-4 pb-4">
          <CompetitorBenchmarkingCard />
        </div>
      </div>
    </main>
  )
}
 