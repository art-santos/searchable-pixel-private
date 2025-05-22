'use client'

import { Info, AlertTriangle, Lightbulb, BarChart } from 'lucide-react'

type InfoBoxType = 'info' | 'warning' | 'tip' | 'stat'

interface InfoBoxProps {
  children: React.ReactNode
  type?: InfoBoxType
  title?: string
}

export function InfoBox({ children, type = 'info', title }: InfoBoxProps) {
  const getIcon = () => {
    switch (type) {
      case 'info':
        return <Info className="h-5 w-5 text-blue-400 shrink-0" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
      case 'tip':
        return <Lightbulb className="h-5 w-5 text-green-400 shrink-0" />
      case 'stat':
        return <BarChart className="h-5 w-5 text-purple-400 shrink-0" />
    }
  }

  const getBorder = () => {
    switch (type) {
      case 'info':
        return 'border-blue-800'
      case 'warning':
        return 'border-amber-800'
      case 'tip':
        return 'border-green-800'
      case 'stat':
        return 'border-purple-800'
    }
  }

  return (
    <div className={`my-6 p-4 border ${getBorder()} bg-[#161616]`}>
      <div className="flex gap-3">
        {getIcon()}
        <div>
          {title && <div className="font-semibold text-white mb-1">{title}</div>}
          <div className="text-gray-300">{children}</div>
        </div>
      </div>
    </div>
  )
} 