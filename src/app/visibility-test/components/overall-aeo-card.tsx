'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AEOScorecard } from '@/app/dashboard/components/aeo-scorecard/aeo-scorecard'
import { ScoreHistoryChart } from './score-history-chart'

interface Point { date: string; score: number }
export function OverallAEOCard({ history }: { history: Point[] }) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-white">Overall AEO Score</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 flex-1">
        <AEOScorecard />
        <ScoreHistoryChart data={history} />
      </CardContent>
    </Card>
  )
}
