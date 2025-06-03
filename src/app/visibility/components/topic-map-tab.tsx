'use client'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NetworkIcon, ZoomInIcon, ZoomOutIcon, RotateCcwIcon } from 'lucide-react'

// Mock topic data
const topicNodes = [
  { 
    id: 'center', 
    label: 'Your Domain', 
    x: 250, 
    y: 200, 
    size: 60, 
    type: 'center',
    citations: 86,
    color: '#3b82f6'
  },
  { 
    id: 'ai-sales', 
    label: 'AI Sales', 
    x: 150, 
    y: 100, 
    size: 45, 
    type: 'topic',
    citations: 32,
    color: '#10b981'
  },
  { 
    id: 'cold-outreach', 
    label: 'Cold Outreach', 
    x: 350, 
    y: 120, 
    size: 38, 
    type: 'topic',
    citations: 24,
    color: '#f59e0b'
  },
  { 
    id: 'sdrs', 
    label: 'SDRs', 
    x: 180, 
    y: 280, 
    size: 35, 
    type: 'topic',
    citations: 18,
    color: '#ef4444'
  },
  { 
    id: 'automation', 
    label: 'Sales Automation', 
    x: 320, 
    y: 300, 
    size: 42, 
    type: 'topic',
    citations: 28,
    color: '#8b5cf6'
  },
  { 
    id: 'prospecting', 
    label: 'Prospecting', 
    x: 100, 
    y: 220, 
    size: 30, 
    type: 'topic',
    citations: 12,
    color: '#06b6d4'
  }
]

const connections = [
  { from: 'center', to: 'ai-sales', strength: 32 },
  { from: 'center', to: 'cold-outreach', strength: 24 },
  { from: 'center', to: 'sdrs', strength: 18 },
  { from: 'center', to: 'automation', strength: 28 },
  { from: 'center', to: 'prospecting', strength: 12 },
  { from: 'ai-sales', to: 'automation', strength: 8 },
  { from: 'cold-outreach', to: 'sdrs', strength: 6 }
]

export function TopicMapTab() {
  const [selectedNode, setSelectedNode] = useState<typeof topicNodes[0] | null>(null)
  const [zoom, setZoom] = useState(1)

  const handleNodeClick = (node: typeof topicNodes[0]) => {
    setSelectedNode(node)
  }

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5))
  const handleReset = () => {
    setZoom(1)
    setSelectedNode(null)
  }

  const viewCitations = (nodeId: string) => {
    console.log(`Viewing citations for ${nodeId}`)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Interactive Map */}
      <Card className="lg:col-span-2 bg-[#111] border-[#222]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg flex items-center gap-2">
              <NetworkIcon className="h-5 w-5" />
              Topic Visibility Map
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleZoomIn}
                className="bg-[#1a1a1a] border-[#333] text-white hover:bg-[#222]"
              >
                <ZoomInIcon className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleZoomOut}
                className="bg-[#1a1a1a] border-[#333] text-white hover:bg-[#222]"
              >
                <ZoomOutIcon className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleReset}
                className="bg-[#1a1a1a] border-[#333] text-white hover:bg-[#222]"
              >
                <RotateCcwIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative h-[500px] bg-[#0a0a0a] rounded border border-[#222] overflow-hidden">
            <svg 
              className="w-full h-full cursor-pointer"
              style={{ transform: `scale(${zoom})` }}
              viewBox="0 0 500 400"
            >
              {/* Connections */}
              {connections.map((connection, index) => {
                const fromNode = topicNodes.find(n => n.id === connection.from)
                const toNode = topicNodes.find(n => n.id === connection.to)
                if (!fromNode || !toNode) return null

                return (
                  <line
                    key={index}
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke="#333"
                    strokeWidth={Math.max(1, connection.strength / 8)}
                    opacity={0.6}
                  />
                )
              })}

              {/* Nodes */}
              {topicNodes.map((node) => (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.size}
                    fill={node.color}
                    stroke={selectedNode?.id === node.id ? '#fff' : 'transparent'}
                    strokeWidth={selectedNode?.id === node.id ? 3 : 0}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleNodeClick(node)}
                  />
                  <text
                    x={node.x}
                    y={node.y + 5}
                    textAnchor="middle"
                    className="fill-white text-xs font-medium pointer-events-none"
                    style={{ fontSize: node.type === 'center' ? '14px' : '12px' }}
                  >
                    {node.label}
                  </text>
                  <text
                    x={node.x}
                    y={node.y + node.size + 15}
                    textAnchor="middle"
                    className="fill-gray-400 text-xs pointer-events-none"
                  >
                    {node.citations} citations
                  </text>
                </g>
              ))}
            </svg>
            
            {/* Legend */}
            <div className="absolute top-4 left-4 bg-[#111] border border-[#333] rounded p-3">
              <div className="text-white text-sm font-medium mb-2">Legend</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-[#ccc]">Your Domain</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-[#ccc]">Topic Clusters</span>
                </div>
                <div className="text-xs text-[#666] mt-2">
                  Node size = citation frequency
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Node Details */}
      <Card className="bg-[#111] border-[#222]">
        <CardHeader>
          <CardTitle className="text-white text-lg">
            {selectedNode ? 'Topic Details' : 'Click a Node'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedNode ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: selectedNode.color }}
                  ></div>
                  <h3 className="text-white font-semibold">{selectedNode.label}</h3>
                </div>
                <Badge variant="outline" className="border-[#333] text-[#666]">
                  {selectedNode.type === 'center' ? 'Domain' : 'Topic Cluster'}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#666]">Total Citations:</span>
                  <span className="text-white font-semibold">{selectedNode.citations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#666]">Connected Topics:</span>
                  <span className="text-white font-semibold">
                    {connections.filter(c => c.from === selectedNode.id || c.to === selectedNode.id).length}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#222]">
                <h4 className="text-white text-sm font-semibold mb-2">Sample Queries:</h4>
                <div className="space-y-2">
                  {selectedNode.id === 'ai-sales' && (
                    <>
                      <div className="text-xs text-[#ccc]">"Best AI sales tools 2025"</div>
                      <div className="text-xs text-[#ccc]">"AI for sales automation"</div>
                    </>
                  )}
                  {selectedNode.id === 'cold-outreach' && (
                    <>
                      <div className="text-xs text-[#ccc]">"Cold email automation tools"</div>
                      <div className="text-xs text-[#ccc]">"How to personalize cold outreach"</div>
                    </>
                  )}
                  {selectedNode.id === 'center' && (
                    <>
                      <div className="text-xs text-[#ccc]">"What are the best AI platforms?"</div>
                      <div className="text-xs text-[#ccc]">"Your platform vs competitors"</div>
                    </>
                  )}
                  {(!['ai-sales', 'cold-outreach', 'center'].includes(selectedNode.id)) && (
                    <>
                      <div className="text-xs text-[#ccc]">"{selectedNode.label} tools comparison"</div>
                      <div className="text-xs text-[#ccc]">"Best {selectedNode.label.toLowerCase()} solutions"</div>
                    </>
                  )}
                </div>
              </div>

              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => viewCitations(selectedNode.id)}
              >
                View All Citations
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-[#666] mb-4">
                Click on any node in the map to view detailed citation information and related queries.
              </div>
              <div className="text-xs text-[#555]">
                Larger nodes indicate higher citation frequency across AI engines.
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 