'use client'

import React, { useState } from 'react'
import { Check, Copy } from 'lucide-react'

interface CodeBlockProps {
  children: React.ReactNode
  language?: string
  filename?: string
}

export function CodeBlock({ children, language, filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    // Get text content from children if it's a string
    let code = ''
    if (typeof children === 'string') {
      code = children
    } else if (React.isValidElement(children)) {
      // If it's a React element, try to get the text content
      const childElement = children as React.ReactElement
      if (childElement.props && childElement.props.children) {
        code = childElement.props.children.toString()
      }
    }

    if (code) {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="relative my-6 overflow-hidden rounded-none border border-[#2f2f2f] bg-[#161616]">
      {filename && (
        <div className="border-b border-[#2f2f2f] bg-[#1a1a1a] px-4 py-2">
          <span className="text-sm font-mono text-gray-400">{filename}</span>
        </div>
      )}
      <div className="relative">
        <pre className={`language-${language || 'text'} p-4 overflow-x-auto`}>
          <code className="text-sm text-gray-300 font-mono">{children}</code>
        </pre>
        <button
          onClick={copyToClipboard}
          className="absolute right-2 top-2 rounded-sm bg-[#222] p-1.5 text-gray-400 hover:bg-[#333] hover:text-white transition-colors"
          aria-label="Copy code"
          type="button"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
      {language && (
        <div className="absolute right-3 bottom-1">
          <span className="text-xs text-gray-500 font-mono">{language}</span>
        </div>
      )}
    </div>
  )
} 