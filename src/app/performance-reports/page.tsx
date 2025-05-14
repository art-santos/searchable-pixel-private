'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  PieChart,
  BarChart3,
  LineChart,
  ArrowUpRight,
  Download
} from 'lucide-react'

export default function PerformanceReports() {
  // CSS styles for custom badges to match the dashboard
  const customBadgeClass = "bg-transparent border border-[#FF914D] text-white h-7 px-3";
  const customBadgeStyle = {
    background: "linear-gradient(to bottom, rgba(255, 145, 77, 0.3), rgba(255, 236, 159, 0.3))"
  };
  
  return (
    <main className="flex flex-1 flex-col gap-8 p-8 overflow-auto bg-[#0c0c0c] bg-[radial-gradient(#222222_0.7px,transparent_0.7px)] bg-[size:24px_24px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Visibility</h1>
        
        <Button 
          className="bg-gradient-to-r from-[#222222] to-[#2a2a2a] text-white hover:from-[#282828] hover:to-[#333333] border border-[#333333]"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        {/* AI Visibility Score */}
        <Card className="bg-[#101010] border-[#222222] border shadow-md">
          <CardContent className="pt-6 px-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-400">AI Visibility Score</p>
                <h2 className="text-2xl font-bold text-white mt-1">-</h2>
              </div>
              <div className="rounded-full bg-[#1a1a1a] p-2 border border-[#222222]">
                <PieChart className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <Badge className="bg-[#222222] text-gray-400 border-[#333333]/30 h-6 px-2">
                No Data
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        {/* Content Performance */}
        <Card className="bg-[#101010] border-[#222222] border shadow-md">
          <CardContent className="pt-6 px-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-400">Content Performance</p>
                <h2 className="text-2xl font-bold text-white mt-1">-</h2>
              </div>
              <div className="rounded-full bg-[#1a1a1a] p-2 border border-[#222222]">
                <BarChart3 className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <Badge className="bg-[#222222] text-gray-400 border-[#333333]/30 h-6 px-2">
                No Data
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        {/* Content Growth */}
        <Card className="bg-[#101010] border-[#222222] border shadow-md">
          <CardContent className="pt-6 px-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-400">Content Growth</p>
                <h2 className="text-2xl font-bold text-white mt-1">-</h2>
              </div>
              <div className="rounded-full bg-[#1a1a1a] p-2 border border-[#222222]">
                <LineChart className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <Badge className="bg-[#222222] text-gray-400 border-[#333333]/30 h-6 px-2">
                No Data
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Report Card */}
      <Card className="bg-[#101010] border-[#222222] border shadow-md">
        <CardHeader className="border-b border-[#222222]/50 pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium text-white">Performance Overview</CardTitle>
            <Badge className="bg-[#222222] text-gray-400 border-[#333333]/30 h-7 px-3">
              No Data
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center py-16">
            <div className="h-16 w-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4 border border-[#222222]">
              <BarChart3 className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No performance data available</h3>
            <p className="text-sm text-gray-400 max-w-md mb-6">
              Connect your site and publish content to start tracking performance across AI engines
            </p>
            <Button 
              className="border border-[#333333] bg-gradient-to-r from-[#222222] to-[#2a2a2a] text-white hover:from-[#282828] hover:to-[#333333]"
            >
              Connect Site
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Platform Breakdown */}
      <Card className="bg-[#101010] border-[#222222] border shadow-md">
        <CardHeader className="border-b border-[#222222]/50 pb-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium text-white">Platform Breakdown</CardTitle>
            <Badge className="bg-[#222222] text-gray-400 border-[#333333]/30 h-7 px-3">
              No Data
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['Google', 'Perplexity', 'ChatGPT'].map((platform) => (
              <div key={platform} className="border border-[#222222] rounded-lg p-5">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-md font-medium text-white">{platform}</h3>
                  <ArrowUpRight className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold text-white">-</div>
                  <div className="text-xs text-gray-400">No Data</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  )
} 