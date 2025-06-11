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
  // Handle "all" case specifically - don't fall back to first crawler
  const selectedOption = selectedCrawler === 'all' 
    ? null 
    : availableCrawlers.find(c => c.id === selectedCrawler)
  
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

  // Helper to get favicon URL for unknown crawlers
  const getFaviconForCrawler = (company: string) => {
    // Try to extract a domain from the company name
    const companyDomainMap: Record<string, string> = {
      'OpenAI': 'openai.com',
      'Anthropic': 'anthropic.com',
      'Google': 'google.com',
      'Perplexity': 'perplexity.ai',
      'Microsoft': 'microsoft.com',
      'Meta': 'meta.com',
      'X': 'x.com',
      'Twitter': 'twitter.com',
      'LinkedIn': 'linkedin.com',
      'Apple': 'apple.com',
      'Amazon': 'amazon.com',
      'TikTok': 'tiktok.com',
      'ByteDance': 'bytedance.com',
      'Slack': 'slack.com',
      'Discord': 'discord.com',
      'Reddit': 'reddit.com',
      'Pinterest': 'pinterest.com',
      'Snapchat': 'snapchat.com',
      'WhatsApp': 'whatsapp.com',
      'Telegram': 'telegram.org',
      'Shopify': 'shopify.com',
      'Salesforce': 'salesforce.com',
      'Adobe': 'adobe.com',
      'Atlassian': 'atlassian.com',
      'Zoom': 'zoom.us',
      'Dropbox': 'dropbox.com',
      'Spotify': 'spotify.com',
      'Netflix': 'netflix.com',
      'Uber': 'uber.com',
      'Airbnb': 'airbnb.com',
      'Stripe': 'stripe.com',
      'Square': 'squareup.com',
      'PayPal': 'paypal.com',
    }

    const domain = companyDomainMap[company]
    if (domain) {
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
    }
    
    // Fallback: try to construct domain from company name
    const constructedDomain = `${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`
    return `https://www.google.com/s2/favicons?domain=${constructedDomain}&sz=128`
  }
  
  return (
    <div className="flex items-start relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            className="w-fit min-w-[160px] border border-gray-300 dark:border-[#333333] bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-[#1a1a1a] px-4 rounded-none"
          >
            <div className="flex items-center gap-2">
              {selectedOption ? (
                // Individual crawler selected
                <>
                  {selectedOption.icon || getCrawlerIcon(selectedOption.company) ? (
                    <Image 
                      src={selectedOption.icon || getCrawlerIcon(selectedOption.company) || ''} 
                      alt={selectedOption.name} 
                      width={16} 
                      height={16} 
                    />
                  ) : (
                    <img 
                      src={getFaviconForCrawler(selectedOption.company)}
                      alt={selectedOption.name}
                      width={16}
                      height={16}
                      className="w-4 h-4 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        // Show fallback dot instead
                        const fallback = target.nextElementSibling as HTMLElement
                        if (fallback) fallback.style.display = 'block'
                      }}
                    />
                  )}
                  <span className="font-geist-semi text-black dark:text-white truncate">{selectedOption.name}</span>
                </>
              ) : (
                // "All Crawlers" selected
                <>
                  <Sparkles className="w-4 h-4 text-gray-500 dark:text-[#888]" />
                  <span className="font-geist-semi text-black dark:text-white truncate">All Crawlers</span>
                </>
              )}
              <ChevronDown className="h-4 w-4 text-gray-500 dark:text-[#666666] ml-auto" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333333] text-black dark:text-white rounded-none max-h-[300px] overflow-y-auto"
          align="start"
          alignOffset={-1}
          sideOffset={4}
        >
          {/* All Crawlers option */}
          <DropdownMenuItem 
            className="hover:bg-gray-100 dark:hover:bg-[#222222] rounded-none"
            onClick={() => onCrawlerChange('all')}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gray-500 dark:text-[#888]" />
              <span className="text-sm">All Crawlers</span>
            </div>
          </DropdownMenuItem>
          
          {/* Individual crawler options */}
          {availableCrawlers.map((crawler) => (
            <DropdownMenuItem 
              key={crawler.id}
              className="hover:bg-gray-100 dark:hover:bg-[#222222] rounded-none"
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
                  <div className="relative">
                    <img 
                      src={getFaviconForCrawler(crawler.company)}
                      alt={crawler.name}
                      width={16}
                      height={16}
                      className="w-4 h-4 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        // Show fallback dot instead
                        const fallback = target.nextElementSibling as HTMLElement
                        if (fallback) fallback.style.display = 'block'
                      }}
                    />
                    <div className="w-4 h-4 rounded-full bg-gray-400 dark:bg-[#666] hidden" />
                  </div>
                )}
                <span className="text-sm">{crawler.name}</span>
                {crawler.company && (
                  <span className="text-xs text-gray-500 dark:text-[#666] ml-auto">({crawler.company})</span>
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
} 