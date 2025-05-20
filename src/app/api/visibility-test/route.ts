import { NextResponse } from 'next/server'

export async function GET() {
  const data = {
    overallScore: 72,
    scoreHistory: [
      { date: '2024-03-01', score: 60 },
      { date: '2024-04-01', score: 68 },
      { date: '2024-05-01', score: 72 },
    ],
    topics: [
      { topic: 'AI prospecting', score: 80 },
      { topic: 'sales automation', score: 64 },
      { topic: 'GTM tools', score: 55 },
    ],
    citations: {
      owned: 18,
      operated: 7,
      earned: 12,
    },
    competitors: [
      {
        name: 'salesforce.com',
        topicCount: 12,
        citationStrength: 88,
        domainAuthority: 93,
        mentionFrequency: 90,
      },
      {
        name: 'gong.io',
        topicCount: 10,
        citationStrength: 75,
        domainAuthority: 85,
        mentionFrequency: 70,
      },
    ],
    suggestions: [
      { topic: 'AI lead qualification' },
      { topic: 'automated outreach platforms' },
    ],
  }

  return NextResponse.json(data)
}
