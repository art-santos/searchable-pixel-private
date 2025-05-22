'use client'

import Link from 'next/link'

interface TagBadgeProps {
  tag: string
  count?: number
  clickable?: boolean
  className?: string
}

export function TagBadge({ tag, count, clickable = true, className = '' }: TagBadgeProps) {
  const Badge = () => (
    <span 
      className={`inline-flex items-center border border-[#2f2f2f] bg-[#161616] px-2.5 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-[#3f3f3f] hover:bg-[#1a1a1a] ${className}`}
    >
      {tag}
      {count !== undefined && (
        <span className="ml-1.5 text-gray-500">({count})</span>
      )}
    </span>
  )

  if (clickable) {
    return (
      <Link href={`/resources/tag/${encodeURIComponent(tag.toLowerCase())}`}>
        <Badge />
      </Link>
    )
  }

  return <Badge />
} 