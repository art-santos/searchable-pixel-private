'use client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Suggestion { topic: string }
export function SuggestionsCard({ suggestions }: { suggestions: Suggestion[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-white">Suggestions & Gaps</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc pl-6 space-y-1 text-sm text-white">
          {suggestions.map((s, i) => (
            <li key={i}>{s.topic}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
