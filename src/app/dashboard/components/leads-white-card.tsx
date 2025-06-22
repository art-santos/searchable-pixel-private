'use client'
import { Card, CardContent } from "@/components/ui/card"
import { motion, useReducedMotion } from "framer-motion"
import { useState, useEffect } from "react"
import { ArrowUpRight, User } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useWorkspace } from "@/contexts/WorkspaceContext"

interface Lead {
  id: string
  timestamp: string
  model: string
  pageVisited: string
  email: string
  fullName: string
  company: string
  jobTitle: string
  location: string
  linkedinUrl: string
  confidence: string
  picture_url?: string
  company_domain?: string
  company_city?: string
  company_country?: string
  ai_source?: string
  lead_source?: string
  attribution_source?: string
}

// White Skeleton for loading state
function LeadsSkeleton() {
  const shouldReduceMotion = useReducedMotion()

  const WhiteSkeleton = ({ className }: { className?: string }) => (
    <motion.div
      className={`bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-sm bg-[length:200%_100%] ${className}`}
      style={{ backgroundPosition: '-200% 0' }}
      animate={shouldReduceMotion ? {} : {
        backgroundPosition: ['200% 0', '-200% 0']
      }}
      transition={{
        duration: 2.5,
        repeat: Infinity,
        ease: [0.25, 0.1, 0.25, 1],
        repeatType: "loop"
      }}
    />
  )

  return (
    <div className="h-full flex flex-col justify-around space-y-4">
      {/* First Lead Skeleton */}
      <div className="space-y-2">
        {/* Contact info with whiskers - matches new layout */}
        <div className="relative">
          {/* Whiskers and Contact Box */}
          <div className="flex items-center -mx-3 sm:-mx-6">
            {/* Left whisker */}
            <div className="w-8 border-t border-gray-300"></div>
            
            {/* Contact Box */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg p-2">
              <WhiteSkeleton className="w-8 h-8 rounded-full" />
              <div className="min-w-0 space-y-1">
                <WhiteSkeleton className="h-3 w-24" />
                <WhiteSkeleton className="h-3 w-20" />
              </div>
            </div>
            
            {/* Right whisker with timestamp */}
            <div className="flex-1 flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <WhiteSkeleton className="h-3 w-12 mx-2" />
              <div className="flex-1 border-t border-gray-300"></div>
            </div>
          </div>
        </div>
        
        {/* Sub cards with ml-2 alignment */}
        <div className="grid grid-cols-2 gap-2 ml-2">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 space-y-1">
            <WhiteSkeleton className="h-3 w-16" />
            <WhiteSkeleton className="h-3 w-20" />
            <WhiteSkeleton className="h-3 w-24" />
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 space-y-1">
            <WhiteSkeleton className="h-3 w-20" />
            <WhiteSkeleton className="h-3 w-18" />
            <WhiteSkeleton className="h-3 w-16" />
          </div>
        </div>
      </div>

      {/* Second Lead Skeleton */}
      <div className="space-y-2">
        {/* Contact info with whiskers - matches new layout */}
        <div className="relative">
          {/* Whiskers and Contact Box */}
          <div className="flex items-center -mx-3 sm:-mx-6">
            {/* Left whisker */}
            <div className="w-8 border-t border-gray-300"></div>
            
            {/* Contact Box */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg p-2">
              <WhiteSkeleton className="w-8 h-8 rounded-full" />
              <div className="min-w-0 space-y-1">
                <WhiteSkeleton className="h-3 w-28" />
                <WhiteSkeleton className="h-3 w-18" />
              </div>
            </div>
            
            {/* Right whisker with timestamp */}
            <div className="flex-1 flex items-center">
              <div className="flex-1 border-t border-gray-300"></div>
              <WhiteSkeleton className="h-3 w-14 mx-2" />
              <div className="flex-1 border-t border-gray-300"></div>
            </div>
          </div>
        </div>
        
        {/* Sub cards with ml-2 alignment */}
        <div className="grid grid-cols-2 gap-2 ml-2">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 space-y-1">
            <WhiteSkeleton className="h-3 w-14" />
            <WhiteSkeleton className="h-3 w-22" />
            <WhiteSkeleton className="h-3 w-20" />
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 space-y-1">
            <WhiteSkeleton className="h-3 w-18" />
            <WhiteSkeleton className="h-3 w-16" />
            <WhiteSkeleton className="h-3 w-14" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Lead Item Component
function LeadItem({ lead, index }: { lead: Lead; index: number }) {
  const shouldReduceMotion = useReducedMotion()

  // Get company favicon
  const getCompanyFavicon = (domain: string) => {
    if (!domain) return null
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  }

  // Get AI source logo
  const getSourceLogo = (source: string) => {
    const sourceMap: Record<string, string> = {
      'chatgpt': '/images/chatgpt.svg',
      'claude': '/images/claude.svg', 
      'perplexity': '/images/perplexity.svg',
      'google': '/images/gemini.svg',
      'gemini': '/images/gemini.svg'
    }
    return sourceMap[source?.toLowerCase()] || '/images/chatgpt.svg'
  }

  // Format time ago
  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes} mins ago`
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours} hours ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} days ago`
  }

  return (
         <motion.div
       initial={{ opacity: 0, y: 10 }}
       animate={{ opacity: 1, y: 0 }}
       transition={{ delay: index * 0.1, duration: 0.3 }}
       className="space-y-2"
     >
             {/* Contact Info with Whiskers */}
       <div className="relative">
         {/* Whiskers and Contact Box */}
         <div className="flex items-center -mx-3 sm:-mx-6">
           {/* Left whisker - extends to card edge */}
           <div className="w-8 border-t border-gray-400"></div>
           
           {/* Contact Box */}
           <div className="flex items-center gap-2 bg-white border border-gray-400 rounded-lg p-2">
             {/* Profile Image */}
             {lead.picture_url ? (
               <img 
                 src={lead.picture_url}
                 alt={lead.fullName}
                 className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                 onError={(e) => {
                   e.currentTarget.style.display = 'none'
                   const fallback = e.currentTarget.nextElementSibling as HTMLElement
                   if (fallback) fallback.style.display = 'flex'
                 }}
               />
             ) : null}
             <div className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 ${lead.picture_url ? 'hidden' : ''}`}>
               <User className="w-4 h-4 text-gray-400" />
             </div>
   
             {/* Contact Details */}
             <div className="min-w-0">
               <div className="flex items-center gap-2">
                 <h4 className="text-sm font-medium text-gray-900 truncate">
                   {lead.fullName || 'Unknown Contact'}
                 </h4>
                 {lead.ai_source && (
                   <img 
                     src={getSourceLogo(lead.ai_source)}
                     alt={lead.ai_source}
                     className="w-3 h-3 opacity-60 flex-shrink-0"
                   />
                 )}
               </div>
               <p className="text-xs text-gray-500 truncate">
                 {lead.jobTitle || 'Unknown Title'}
               </p>
             </div>
           </div>
           
           {/* Right whisker with timestamp in middle */}
           <div className="flex-1 flex items-center">
             <div className="flex-1 border-t border-gray-400"></div>
             <span className="text-xs text-gray-400 mx-2">
               {getTimeAgo(lead.timestamp)}
             </span>
             <div className="flex-1 border-t border-gray-400"></div>
           </div>
         </div>
       </div>

                    {/* Attribution and Company Data Cards */}
       <div className="grid grid-cols-2 gap-2 ml-2">
         {/* Attribution Card */}
         <div className="bg-white rounded-lg p-2">
           <h5 className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">
             Attribution
           </h5>
           <div className="space-y-1">
             <div className="flex items-center gap-1 flex-wrap">
               <span className="text-xs text-gray-600">Found you through</span>
               {lead.ai_source && (
                 <img 
                   src={getSourceLogo(lead.ai_source)}
                   alt={lead.ai_source}
                   className="w-3 h-3"
                 />
               )}
               <span className="text-xs font-medium text-gray-900 capitalize">
                 {lead.ai_source || lead.model || 'Direct'}
               </span>
             </div>
             <div className="bg-gray-50 rounded px-2 py-1 text-xs text-gray-600 truncate">
               "{lead.pageVisited || '/'}"
             </div>
           </div>
         </div>

         {/* Company Data Card */}
         <div className="bg-white rounded-lg p-2">
           <h5 className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">
             Company Data
           </h5>
           <div className="space-y-1">
             <div className="flex items-center gap-1">
               {lead.company_domain && (
                 <img 
                   src={getCompanyFavicon(lead.company_domain)}
                   alt={lead.company}
                   className="w-3 h-3 rounded flex-shrink-0"
                 />
               )}
               <span className="text-xs font-medium text-gray-900 truncate">
                 {lead.company || 'Unknown Company'}
               </span>
             </div>
             <p className="text-xs text-gray-600 leading-relaxed">
               {lead.location && lead.location !== 'Unknown' 
                 ? lead.location 
                 : [lead.company_city, lead.company_country].filter(Boolean).join(', ') || 'Location unknown'
               }
             </p>
           </div>
         </div>
       </div>
    </motion.div>
  )
}

export function LeadsWhiteCard() {
  const shouldReduceMotion = useReducedMotion()
  const { session } = useAuth()
  const { currentWorkspace, switching } = useWorkspace()
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch latest leads
  useEffect(() => {
    const fetchLeads = async () => {
      if (!currentWorkspace || !session) {
        setIsLoading(false)
        return
      }

      try {
        const apiUrl = `/api/leads?workspaceId=${currentWorkspace.id}`
        console.log('Fetching leads from:', apiUrl)
        console.log('Current workspace ID:', currentWorkspace.id)
        
        const response = await fetch(apiUrl)
        console.log('Response status:', response.status)
        
        if (!response.ok) {
          if (response.status === 403) {
            console.log('Admin access required for leads')
            setLeads([])
            setIsLoading(false)
            return
          }
          console.error(`API request failed with status: ${response.status}`)
          const errorText = await response.text()
          console.error('Error response:', errorText)
          throw new Error(`API request failed: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('Leads API response:', data)
        console.log('Number of leads:', data.leads?.length || 0)
        console.log('Current workspace:', currentWorkspace)
        console.log('Raw leads data:', data.leads)
        
        // Get the 2 most recent leads
        const recentLeads = (data.leads || []).slice(0, 2)
        console.log('Setting leads to:', recentLeads)
        setLeads(recentLeads)
      } catch (err) {
        console.error('Error fetching leads:', err)
        setLeads([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeads()
  }, [currentWorkspace, session])

  const cardVariants = shouldReduceMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } }
      }

  return (
    <Card className="h-full bg-white border-0">
      <CardContent className="p-0 h-full flex flex-col">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="flex flex-col h-full"
        >
          {/* Header */}
          <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-lg font-medium text-black">Website Leads</h3>
              </div>
              <a 
                href="/dashboard/leads" 
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors flex-shrink-0 hidden sm:flex"
              >
                View all leads
                <ArrowUpRight className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 px-3 sm:px-6 py-3 sm:py-4 min-h-0">
            {switching ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto mb-3">
                    <img 
                      src="/images/split-icon-black.svg" 
                      alt="Split" 
                      className="w-full h-full animate-spin"
                      style={{ animation: 'spin 1s linear infinite' }}
                    />
                  </div>
                  <p className="text-gray-500 text-sm">Switching workspace...</p>
                </div>
              </div>
            ) : isLoading ? (
              <LeadsSkeleton />
                         ) : leads.length > 0 ? (
               <div className="h-full flex flex-col justify-around space-y-4">
                 {leads.map((lead, index) => (
                   <LeadItem key={lead.id} lead={lead} index={index} />
                 ))}
               </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-gray-500 text-sm">No recent leads</p>
                  <p className="text-gray-400 text-xs mt-1">Leads will appear here when visitors are identified</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </CardContent>
    </Card>
  )
} 