'use client'
import { Card, CardContent } from "@/components/ui/card"
import { motion, useReducedMotion } from "framer-motion"
import { TimeframeSelector, TimeframeOption } from "@/components/custom/timeframe-selector"
import { useState } from "react"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { Loader2 } from "lucide-react"

interface CrawlerLog {
  id: number
  date: string
  time: string
  method: string
  domain: string
  path: string
  provider: string
  crawler: string
}

const crawlerLogs: CrawlerLog[] = [
  {
    id: 1,
    date: 'MAY 23',
    time: '22:02:35',
    method: 'GET',
    domain: 'www.origamiagents.com',
    path: '/company',
    provider: 'OPENAI',
    crawler: 'ChatGPT-User'
  },
  {
    id: 2,
    date: 'MAY 23',
    time: '22:02:34',
    method: 'GET',
    domain: 'www.origamiagents.com',
    path: '/features/ai-research-agents',
    provider: 'PERPLEXITY',
    crawler: 'PerplexityBot'
  },
  {
    id: 3,
    date: 'MAY 23',
    time: '22:02:33',
    method: 'GET',
    domain: 'www.origamiagents.com',
    path: '/pricing',
    provider: 'GOOGLE',
    crawler: 'Google-Extended'
  },
  {
    id: 4,
    date: 'MAY 23',
    time: '22:02:32',
    method: 'GET',
    domain: 'www.origamiagents.com',
    path: '/blog/ai-sales-automation-guide',
    provider: 'OPENAI',
    crawler: 'GPTBot'
  },
  {
    id: 5,
    date: 'MAY 23',
    time: '22:02:31',
    method: 'GET',
    domain: 'www.origamiagents.com',
    path: '/use-cases',
    provider: 'ANTHROPIC',
    crawler: 'ClaudeBot'
  },
  {
    id: 6,
    date: 'MAY 23',
    time: '22:02:30',
    method: 'GET',
    domain: 'www.origamiagents.com',
    path: '/api/health',
    provider: 'PERPLEXITY',
    crawler: 'PerplexityBot'
  },
  {
    id: 7,
    date: 'MAY 23',
    time: '22:02:29',
    method: 'GET',
    domain: 'www.origamiagents.com',
    path: '/demo/request',
    provider: 'OPENAI',
    crawler: 'ChatGPT-User'
  },
  {
    id: 8,
    date: 'MAY 23',
    time: '22:02:28',
    method: 'GET',
    domain: 'www.origamiagents.com',
    path: '/about/team',
    provider: 'GOOGLE',
    crawler: 'Gemini-Pro'
  }
]

export function CrawlerActivityCard() {
  const shouldReduceMotion = useReducedMotion()
  const [timeframe, setTimeframe] = useState<TimeframeOption>('Last 24 hours')
  const { currentWorkspace, switching } = useWorkspace()
  const [isLoading, setIsLoading] = useState(false)

  const cardVariants = shouldReduceMotion 
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
      }

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
      `}</style>
      <Card className="h-full bg-[#0c0c0c] border-[#1a1a1a] flex flex-col">
        <CardContent className="p-0 h-full flex flex-col">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="flex flex-col h-full"
          >
            {/* Header */}
            <div className="pb-4 pt-4 pl-6 border-b border-[#1a1a1a] flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Crawler Activity</h3>
                </div>
                <TimeframeSelector 
                  title=""
                  timeframe={timeframe}
                  onTimeframeChange={setTimeframe}
                  titleColor="text-white"
                  selectorColor="text-[#A7A7A7]"
                />
              </div>
            </div>

            {/* Log Entries */}
            <div className="flex-1 overflow-hidden bg-[#0c0c0c] relative min-h-0 group">
              {switching ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-8 h-8 mx-auto mb-3">
                      <img 
                        src="/images/split-icon-white.svg" 
                        alt="Split" 
                        className="w-full h-full animate-spin"
                        style={{ animation: 'spin 1s linear infinite' }}
                      />
                    </div>
                    <p className="text-[#666] text-sm">Switching workspace...</p>
                  </div>
                </div>
              ) : (
                <>
                  <div 
                    className="overflow-y-auto h-full px-6 py-3 custom-scrollbar"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#333 transparent'
                    }}
                  >
                    <div className="space-y-3">
                      {isLoading ? (
                        <div className="flex justify-center items-center h-full">
                          <Loader2 className="animate-spin h-8 w-8 text-white" />
                        </div>
                      ) : (
                        crawlerLogs.map((log, index) => (
                          <div key={log.id} className="group/item">
                            <div className="flex items-center justify-between py-2 px-0 rounded-lg hover:bg-[#0f0f0f] transition-all duration-200">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1.5">
                                  <span className="text-xs text-[#888] font-mono">{log.time}</span>
                                  <span className="px-2 py-0.5 text-xs font-medium bg-green-400/10 text-green-400 rounded">
                                    {log.method}
                                  </span>
                                  <span className="px-2 py-0.5 text-xs font-medium bg-orange-400/10 text-orange-400 rounded">
                                    {log.provider}
                                  </span>
                                </div>
                                <div className="text-sm text-[#ccc] truncate mb-1">
                                  {log.domain}<span className="text-[#777]">{log.path}</span>
                                </div>
                                <div className="text-xs text-[#777]">
                                  {log.crawler}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  
                  {/* View More Section - Only on Hover */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0c0c0c] via-[#0c0c0c]/95 to-transparent pt-6 pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="flex justify-center">
                      <button className="text-sm text-[#888] hover:text-white transition-colors font-medium px-4 py-2 rounded-lg border border-[#2a2a2a] hover:border-[#444] bg-[#111] hover:bg-[#1a1a1a]">
                        View all activity
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </>
  )
} 
                                <div className="text-xs text-[#777]">
                                  {log.crawler}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  
                  {/* View More Section - Only on Hover */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0c0c0c] via-[#0c0c0c]/95 to-transparent pt-6 pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="flex justify-center">
                      <button className="text-sm text-[#888] hover:text-white transition-colors font-medium px-4 py-2 rounded-lg border border-[#2a2a2a] hover:border-[#444] bg-[#111] hover:bg-[#1a1a1a]">
                        View all activity
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </>
  )
} 