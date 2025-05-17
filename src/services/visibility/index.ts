const PERPLEXITY_URL = 'https://api.perplexity.ai/chat/completions'

interface PerplexityCitation {
  url: string
  title: string
  snippet: string
}

interface PerplexityResponse {
  text?: string
  citations?: PerplexityCitation[]
  choices?: { message?: { content?: string } }[]
}

export interface Mention {
  source: 'Perplexity'
  query: string
  mention_type: 'direct' | 'indirect'
  snippet: string
}

export interface VisibilityCheckResult {
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

export interface VisibilityOptions {
  domain: string
  category: string
  custom_brand_terms?: string[]
  competitor_domains?: string[]
  maxQueries?: number
}

async function callPerplexity(query: string): Promise<PerplexityResponse> {
  const res = await fetch(PERPLEXITY_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'sonar-small-online',
      messages: [
        { role: 'system', content: 'You are a helpful research assistant.' },
        { role: 'user', content: query }
      ]
    })
  })

  if (!res.ok) {
    throw new Error(`Perplexity API error: ${res.status}`)
  }

  return (await res.json()) as PerplexityResponse
}

const DEFAULT_ACTION_PLAN = [
  'Publish more comparison articles that position your brand alongside top competitors.',
  'Add FAQ schema to pricing and product pages for improved answer engine indexing.',
  "Use consistent brand mentions like 'Origami Agents' across third-party sites.",
  'Submit to public rankings and directories relevant to AI sales tools.'
]

export async function checkVisibility(options: VisibilityOptions): Promise<VisibilityCheckResult> {
  const {
    domain,
    category,
    custom_brand_terms = [],
    competitor_domains = [],
    maxQueries = 1000
  } = options

  if (!domain || !category) {
    throw new Error('domain and category are required')
  }

  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error('Perplexity API key not configured')
  }

  const prompts = [
    `What are the top tools for ${category}?`,
    `Tell me about ${domain}`,
    `What are some alternatives to ${domain}?`,
    `What AI tools are helping companies with ${category}?`,
    `What companies are building ${category} tools in 2025?`
  ]

  const queries = prompts.slice(0, maxQueries)

  const mentions: Mention[] = []

  for (const query of queries) {
    try {
      const data = await callPerplexity(query)
      const snippet =
        data.citations?.[0]?.snippet ||
        data.text ||
        data.choices?.[0]?.message?.content ||
        ''
      const textLower = snippet.toLowerCase()
      const directTerms = [domain, ...custom_brand_terms]
      const directMention = directTerms.some(term =>
        textLower.includes(term.toLowerCase())
      )
      mentions.push({
        source: 'Perplexity',
        query,
        mention_type: directMention ? 'direct' : 'indirect',
        snippet
      })
    } catch (err: any) {
      mentions.push({
        source: 'Perplexity',
        query,
        mention_type: 'indirect',
        snippet: `Error: ${err.message || String(err)}`
      })
    }
  }

  const directCount = mentions.filter(m => m.mention_type === 'direct').length
  const citations_score = Math.round((directCount / queries.length) * 100)

  return {
    domain,
    citations_score,
    topic_authority_score: citations_score,
    brand_rank: Math.max(1, 100 - citations_score),
    rank_total: 100,
    top_ranked_companies: competitor_domains,
    mentions_found: mentions,
    last_rerolled: new Date().toISOString(),
    action_plan: DEFAULT_ACTION_PLAN
  }
}
