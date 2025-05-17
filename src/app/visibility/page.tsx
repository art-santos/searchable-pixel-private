'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

interface Mention {
  source: string
  query: string
  mention_type: string
  snippet: string
}

interface VisibilityResult {
  domain: string
  citations_score: number
  topic_authority_score: number
  brand_rank: number
  rank_total: number
  top_ranked_companies: string[]
  mentions_found: Mention[]
  last_rerolled: string
  action_plan: string[]
}

export default function VisibilityPage() {
  const [domain, setDomain] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<VisibilityResult | null>(null)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    const stored = localStorage.getItem('visibilityLastRerolled')
    if (stored) {
      const diff = 24 * 60 * 60 * 1000 - (Date.now() - Number(stored))
      if (diff > 0) setCooldown(Math.floor(diff / 1000))
    }
  }, [])

  useEffect(() => {
    if (!cooldown) return
    const interval = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [cooldown])

  const runCheck = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, category })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error fetching visibility')
      setResult(data)
      setCooldown(24 * 60 * 60)
      localStorage.setItem('visibilityLastRerolled', Date.now().toString())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    return `${h}h ${m}m`
  }

  return (
    <main className="flex flex-1 flex-col gap-8 p-8 overflow-auto bg-[#0c0c0c] bg-[radial-gradient(#222222_0.7px,transparent_0.7px)] bg-[size:24px_24px]">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">LLM Visibility</h1>
      </div>

      <Card className="bg-[#101010] border-[#222222] border shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-white">Check Visibility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Domain"
            value={domain}
            onChange={e => setDomain(e.target.value)}
            className="bg-[#171717] border-[#222222] text-white"
          />
          <Input
            placeholder="Category"
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="bg-[#171717] border-[#222222] text-white"
          />
          <Button
            onClick={runCheck}
            disabled={loading || cooldown > 0}
            className="border border-[#333333] bg-gradient-to-r from-[#222222] to-[#2a2a2a] text-white hover:from-[#282828] hover:to-[#333333]"
          >
            {loading ? 'Checking...' : cooldown > 0 ? `Reroll in ${formatTime(cooldown)}` : 'Check Visibility'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-[#101010] border-[#222222] border shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-white">Visibility Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-5xl font-bold text-white">
                {result.citations_score}
              </div>
              <Badge className="bg-[#222222] text-gray-400 border-[#333333]/30 h-7 px-3">
                {result.brand_rank ? `#${result.brand_rank} of ${result.rank_total}` : 'No Rank'}
              </Badge>
            </CardContent>
          </Card>
          <Card className="bg-[#101010] border-[#222222] border shadow-md">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-white">Mentions</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                {result.mentions_found.map((m, idx) => (
                  <AccordionItem key={idx} value={`item-${idx}`} className="border-[#222222]">
                    <AccordionTrigger className="text-white">
                      {m.source} – {m.query}
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-gray-400 text-sm mb-2">{m.snippet}</p>
                      <Badge variant="outline" className="text-xs">
                        {m.mention_type}
                      </Badge>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
          <Card className="bg-[#101010] border-[#222222] border shadow-md md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-white">Action Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {result.action_plan.map((tip, index) => (
                <div key={index} className="text-sm text-gray-300">
                  • {tip}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  )
}
