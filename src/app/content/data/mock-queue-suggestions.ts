export interface QueueSuggestion {
  id: number
  title: string
  keyword: string
  wordCount: number
  priority: string
  reason: string
  status: 'pending' | 'accepted'
  order?: number
  description: string
  keywords: string[]
}

export const mockQueueSuggestions: QueueSuggestion[] = [
  {
    id: 1,
    title: "The Complete Guide to AI-Powered Sales Outreach",
    keyword: "ai sales outreach",
    wordCount: 2500,
    priority: "High Priority",
    reason: "Trending topic with 45% increase in search volume. Competitors lack comprehensive coverage.",
    status: "accepted",
    order: 1,
    description: "A comprehensive guide covering AI tools for prospecting, automated email sequences, personalization at scale, and measuring ROI. Includes case studies from successful B2B companies and step-by-step implementation frameworks.",
    keywords: ["ai sales tools", "automated prospecting", "sales automation", "email personalization", "b2b outreach", "sales roi"]
  },
  {
    id: 2,
    title: "Building Your First Revenue Operations Dashboard",
    keyword: "revops dashboard",
    wordCount: 1800,
    priority: "Medium Priority",
    reason: "Knowledge gap identified: No existing content on dashboard implementation.",
    status: "accepted",
    order: 2,
    description: "Step-by-step tutorial for creating a RevOps dashboard that tracks key metrics across sales, marketing, and customer success. Covers tool selection, data integration, and actionable insights.",
    keywords: ["revenue operations", "sales dashboard", "marketing metrics", "data visualization", "kpi tracking", "business intelligence"]
  },
  {
    id: 3,
    title: "Email Deliverability Best Practices for 2024",
    keyword: "email deliverability",
    wordCount: 2200,
    priority: "High Priority",
    reason: "Core topic for audience. Recent algorithm changes require updated guidance.",
    status: "pending",
    description: "Updated guide covering the latest email deliverability standards, authentication protocols (SPF, DKIM, DMARC), reputation management, and avoiding spam filters. Includes 2024 updates from major email providers.",
    keywords: ["email deliverability", "spam prevention", "email authentication", "sender reputation", "inbox placement", "email marketing"]
  },
  {
    id: 4,
    title: "Scaling Customer Success with Automation",
    keyword: "customer success automation",
    wordCount: 3000,
    priority: "Medium Priority",
    reason: "Expanding into CS market. Strategic content for new segment.",
    status: "pending",
    description: "Comprehensive playbook for automating customer success workflows including onboarding sequences, health score monitoring, churn prediction, and expansion opportunities. Features real-world automation examples.",
    keywords: ["customer success", "cs automation", "customer onboarding", "churn prevention", "customer health", "expansion revenue"]
  },
  {
    id: 5,
    title: "B2B Buyer Intent Signals: A Data-Driven Approach",
    keyword: "buyer intent signals",
    wordCount: 2400,
    priority: "High Priority",
    reason: "High commercial intent keyword. Direct product tie-in opportunity.",
    status: "accepted",
    order: 3,
    description: "Deep dive into identifying and acting on buyer intent signals using first-party and third-party data. Covers intent scoring models, timing optimization, and converting intent into pipeline.",
    keywords: ["buyer intent", "intent data", "sales intelligence", "lead scoring", "prospect research", "sales timing"]
  },
  {
    id: 6,
    title: "Sales Enablement Content Strategy",
    keyword: "sales enablement content",
    wordCount: 2000,
    priority: "Medium Priority",
    reason: "Supports product positioning in sales enablement category.",
    status: "pending",
    description: "Framework for creating and organizing sales enablement content that actually gets used. Includes content audit methodology, buyer journey mapping, and measuring content effectiveness.",
    keywords: ["sales enablement", "sales content", "buyer journey", "sales materials", "content strategy", "sales productivity"]
  }
] 