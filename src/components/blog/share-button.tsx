'use client'

import { useState } from 'react'
import { Copy, Check, Share } from 'lucide-react'

interface ShareButtonProps {
  url: string
  title: string
}

export function ShareButton({ url, title }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        })
      } catch (err) {
        console.error('Failed to share: ', err)
        // Fallback to copy
        handleCopy()
      }
    } else {
      // Fallback to copy for browsers that don't support Web Share API
      handleCopy()
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 bg-[#1a1a1a] border border-[#2f2f2f] hover:border-[#3f3f3f] hover:bg-[#222] transition-colors"
        disabled={copied}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-green-400" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            Copy Link
          </>
        )}
      </button>
      
      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 bg-[#1a1a1a] border border-[#2f2f2f] hover:border-[#3f3f3f] hover:bg-[#222] transition-colors"
      >
        <Share className="w-4 h-4" />
        Share
      </button>
    </div>
  )
} 