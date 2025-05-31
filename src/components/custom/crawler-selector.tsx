import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState, useEffect } from "react"
import { Sparkles } from "lucide-react"

interface CrawlerOption {
  id: string
  name: string
  company: string
  icon?: string
}

interface CrawlerSelectorProps {
  onCrawlerChange: (crawler: string) => void
  selectedCrawler: string
  availableCrawlers: CrawlerOption[]
}

export function CrawlerSelector({ onCrawlerChange, selectedCrawler, availableCrawlers }: CrawlerSelectorProps) {
  const selectedOption = availableCrawlers.find(c => c.id === selectedCrawler) || availableCrawlers[0]
  
  // Helper to get crawler icon
  const getCrawlerIcon = (company: string) => {
    const iconMap: Record<string, string> = {
      'OpenAI': '/images/chatgpt.svg',
      'Anthropic': '/images/claude.svg',
      'Google': '/images/gemini.svg',
      'Perplexity': '/images/perplexity.svg',
      'Microsoft': '/images/bing.svg',
      'Meta': '/images/meta.svg',
    }
    return iconMap[company]
  }
  
  return (
    <div className="flex items-start relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="w-fit min-w-[160px] border border-[#333333] bg-transparent hover:bg-[#1a1a1a] px-4 rounded-none"
          >
            <div className="flex items-center gap-2">
              {selectedOption?.icon || getCrawlerIcon(selectedOption?.company || '') ? (
                <Image 
                  src={selectedOption?.icon || getCrawlerIcon(selectedOption?.company || '') || ''} 
                  alt={selectedOption?.name || 'All Crawlers'} 
                  width={16} 
                  height={16} 
                />
              ) : (
                <Sparkles className="w-4 h-4 text-[#888]" />
              )}
              <span className="font-geist-semi text-white truncate">{selectedOption?.name || 'All Crawlers'}</span>
              <ChevronDown className="h-4 w-4 text-[#666666] ml-auto" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="bg-[#1a1a1a] border border-[#333333] text-white rounded-none max-h-[300px] overflow-y-auto"
          align="start"
          alignOffset={-1}
          sideOffset={4}
        >
          {/* All Crawlers option */}
          <DropdownMenuItem 
            className="hover:bg-[#222222] rounded-none"
            onClick={() => onCrawlerChange('all')}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#888]" />
              <span className="text-sm">All Crawlers</span>
            </div>
          </DropdownMenuItem>
          
          {/* Individual crawler options */}
          {availableCrawlers.map((crawler) => (
            <DropdownMenuItem 
              key={crawler.id}
              className="hover:bg-[#222222] rounded-none"
              onClick={() => onCrawlerChange(crawler.id)}
            >
              <div className="flex items-center gap-2">
                {crawler.icon || getCrawlerIcon(crawler.company) ? (
                  <Image 
                    src={crawler.icon || getCrawlerIcon(crawler.company) || ''} 
                    alt={crawler.name} 
                    width={16} 
                    height={16} 
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-[#666]" />
                )}
                <span className="text-sm">{crawler.name}</span>
                {crawler.company && (
                  <span className="text-xs text-[#666] ml-auto">({crawler.company})</span>
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
} 