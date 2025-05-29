'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CitationData { owned: number; operated: number; earned: number }

export function DirectCitationCard({ data }: { data: CitationData }) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-white">Direct Citation Mapping</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 flex-1">
        <div className="flex justify-around text-white text-sm">
          <div>Owned: {data.owned}</div>
          <div>Operated: {data.operated}</div>
          <div>Earned: {data.earned}</div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <svg width={220} height={120} className="border border-[#333] bg-[#1a1a1a]">
            <circle cx="40" cy="60" r="10" fill="#666" />
            <circle cx="110" cy="30" r="10" fill="#666" />
            <circle cx="180" cy="80" r="10" fill="#666" />
            <line x1="40" y1="60" x2="110" y2="30" stroke="#444" />
            <line x1="110" y1="30" x2="180" y2="80" stroke="#444" />
          </svg>
        </div>
      </CardContent>
    </Card>
  )
}
