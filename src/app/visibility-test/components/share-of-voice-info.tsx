'use client'

import { useState } from 'react'

export function ShareOfVoiceInfo() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-blue-400 hover:text-blue-300 text-sm ml-2"
        title="Learn about Share of Voice"
      >
        ℹ️
      </button>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setIsOpen(false)}>
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-white text-lg font-bold">Share of Voice Explained</h3>
              <button onClick={() => setIsOpen(false)} className="text-[#999] hover:text-white">✕</button>
            </div>
            
            <div className="space-y-4 text-[#ccc]">
              <div>
                <h4 className="text-white font-semibold mb-2">What is Share of Voice?</h4>
                <p className="text-sm">
                  Share of Voice measures how much "search real estate" your brand controls across all search results, 
                  weighted by position importance.
                </p>
              </div>
              
              <div>
                <h4 className="text-white font-semibold mb-2">How it's Calculated</h4>
                <div className="bg-[#222] p-3 rounded text-sm">
                  <div className="font-mono">
                    <div>Your Voice = Sum of (1/position) for your URLs</div>
                    <div>Total Voice = Sum of (1/position) for all URLs</div>
                    <div className="mt-2 text-blue-400">Share = Your Voice / Total Voice × 100%</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-white font-semibold mb-2">Position Values</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div>Position 1: <span className="text-green-400">1.000 points</span></div>
                    <div>Position 2: <span className="text-yellow-400">0.500 points</span></div>
                    <div>Position 3: <span className="text-orange-400">0.333 points</span></div>
                    <div>Position 4: <span className="text-red-400">0.250 points</span></div>
                  </div>
                  <div className="space-y-1">
                    <div>Position 5: <span className="text-[#999]">0.200 points</span></div>
                    <div>Position 6: <span className="text-[#999]">0.167 points</span></div>
                    <div>Position 7: <span className="text-[#999]">0.143 points</span></div>
                    <div>Position 8+: <span className="text-[#666]">0.125 points</span></div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-white font-semibold mb-2">Example Calculation</h4>
                <div className="bg-[#222] p-3 rounded text-sm space-y-2">
                  <div>For question "What is AI automation?":</div>
                  <div className="ml-4 space-y-1">
                    <div>• Your site at position 1: <span className="text-green-400">1.000 points</span></div>
                    <div>• Your LinkedIn at position 4: <span className="text-orange-400">0.250 points</span></div>
                    <div>• Total possible voice: <span className="text-blue-400">~2.928 points (positions 1-10)</span></div>
                  </div>
                  <div className="border-t border-[#333] pt-2 mt-2">
                    <div>Your Share = (1.000 + 0.250) / 2.928 = <span className="text-green-400">42.7%</span></div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-white font-semibold mb-2">Why It Matters</h4>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Higher positions get exponentially more attention</li>
                  <li>Position 1 gets ~28% of all clicks, Position 2 gets ~15%</li>
                  <li>Share of Voice correlates with brand awareness and conversions</li>
                  <li>Tracks competitive landscape - who's winning the search battle</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 