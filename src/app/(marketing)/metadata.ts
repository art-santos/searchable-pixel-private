import { Metadata } from 'next'
import { buildOg } from '@/lib/og'

export const metadata: Metadata = {
  title: 'Split | Agentic AEO for LLM Visibility',
  description: 'Automate your content strategy for LLM visibility with Split.',
  other: buildOg(
    'Split | Agentic AEO for LLM Visibility',
    'Automate your content strategy for LLM visibility with Split.'
  ),
}
