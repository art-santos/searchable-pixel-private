import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Documentation - Split Analytics',
  description: 'Complete documentation for Split Analytics - AI crawler tracking for any website.',
}

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 