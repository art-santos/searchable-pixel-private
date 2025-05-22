'use client'

import React from 'react'
import { Schema } from '../Schema'

interface QA {
  question: string
  answer: string
}

interface FAQProps {
  items: QA[]
  title?: string
}

export function FAQ({ items, title = "Frequently Asked Questions" }: FAQProps) {
  // Create schema.org JSON-LD for FAQPage
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': items.map(item => ({
      '@type': 'Question',
      'name': item.question,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.answer
      }
    }))
  }

  return (
    <section aria-labelledby="faq-heading" className="my-12 border border-[#2f2f2f] bg-[#161616] p-6">
      <Schema json={faqSchema} />
      
      <h2 id="faq-heading" className="text-xl font-semibold mb-6">{title}</h2>
      
      <div className="space-y-6">
        {items.map((item, index) => (
          <div key={index} className="border-b border-[#2f2f2f] pb-4 last:border-0">
            <h3 className="text-lg font-medium mb-2">{item.question}</h3>
            <p className="text-gray-300">{item.answer}</p>
          </div>
        ))}
      </div>
    </section>
  )
} 