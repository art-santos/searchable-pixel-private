'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import ReactMarkdown from 'react-markdown'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  MessageSquare, 
  ArrowUpRight,
  FileText,
  Rocket,
  Bot,
  Download,
  Globe,
  BarChart3,
  Link,
  ExternalLink,
  LayoutGrid,
  Clock,
  Zap,
  FileWarning,
  Slash,
  Image,
  FileDown,
  Settings,
  ScreenShare,
  ArrowRight,
  ChevronDown
} from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from 'framer-motion'

// Interface for historical crawl data
interface HistoricalCrawl {
  crawl_id: string;
  site_url: string;
  created_at: string;
  status: string;
  ai_visibility_score: number;
  critical_issues: number;
  warning_issues: number;
}

// Interface for individual issue details
interface IssueItem {
  type: 'critical' | 'warning' | 'info';
  message: string;
  context?: string; // Or a more specific type if context has a known structure
  fixSuggestion?: string;
  url?: string; // resource_url for the issue
}

// Interface for page data within a crawlData object
interface PageDataInCrawl {
  id: string; // or number, depending on your DB schema
  url: string;
  status_code: number;
  title?: string;
  ai_visibility_score?: number;
  meta_description?: string; // Added based on previous discussions
  is_document?: boolean;
  issues?: IssueItem[];
  has_schema?: boolean;
  // Add other fields from your 'pages' table as needed
}

// Interface for the main crawlData object
interface CrawlData {
  siteUrl: string;
  status: string;
  completed_at?: string; // Or Date
  started_at: string; // Or Date
  totalPages: number;
  crawledPages?: number; // from live results
  issues: { critical: number; warning: number; info: number };
  metricScores: {
    aiVisibility: number;
    contentQuality?: number;
    technical?: number;
    performance?: number;
    mediaAccessibility?: number; // Added based on previous discussions
  };
  pages?: PageDataInCrawl[];
  screenshots?: { url: string; screenshot_url: string }[];
  ai_summary_markdown?: string; // Added based on previous discussions
  // Add other top-level fields from your crawl results as needed
}

// Re-define a simpler ScoreWheel component (or adapt from the old ScoreWheelCard)
interface ScoreWheelProps {
  score: number;
  size?: number; // e.g., 120 for a 120px wheel
  strokeWidth?: number;
}

const ScoreWheel = ({ score, size = 100, strokeWidth = 10 }: ScoreWheelProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const viewBoxSize = size;

  return (
    <div className={`relative`} style={{ width: size, height: size }}>
      <svg className="w-full h-full" viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
        {/* Background circle */}
        <circle
          className="text-gray-700" // Darker background for the track
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={viewBoxSize / 2}
          cy={viewBoxSize / 2}
        />
        {/* Progress circle */}
        <circle
          className="text-[#FF914D]" // Orange accent for progress
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={viewBoxSize / 2}
          cy={viewBoxSize / 2}
          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white" style={{ fontSize: Math.max(16, size * 0.25) }}>{score}</span>
        <span className="text-xs text-gray-400" style={{ fontSize: Math.max(10, size * 0.1) }}>Visibility</span>
      </div>
    </div>
  );
};

export default function SiteAudit() {
  const [siteUrl, setSiteUrl] = useState('')
  const [isCrawling, setIsCrawling] = useState(false)
  const [crawlProgress, setCrawlProgress] = useState(0)
  const [crawlComplete, setCrawlComplete] = useState(false)
  const [crawlData, setCrawlData] = useState<CrawlData | null>(null)
  const [crawlId, setCrawlId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  
  // Add options for enhanced features
  const [maxPages, setMaxPages] = useState(100)
  const [includeDocuments, setIncludeDocuments] = useState(true)
  const [checkMediaAccessibility, setCheckMediaAccessibility] = useState(true)
  const [performInteractiveActions, setPerformInteractiveActions] = useState(false)
  
  // Add a timeout state to detect issues with long-running crawls
  const [crawlStartTime, setCrawlStartTime] = useState<number | null>(null)
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)
  
  // Add page filter state
  const [pageFilter, setPageFilter] = useState<string | null>(null)
  
  // State for AI Recommendations
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [lastCrawlIdForAiRec, setLastCrawlIdForAiRec] = useState<string | null>(null);
  
  // State for crawl history
  const [crawlHistory, setCrawlHistory] = useState<HistoricalCrawl[] | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  
  // In SiteAudit component, add state for the typewriter effect
  const [displayedAiRecommendations, setDisplayedAiRecommendations] = useState<string>("");
  const [isAiSummaryExpanded, setIsAiSummaryExpanded] = useState<boolean>(false);
  
  // Add new state for AI summary source
  const [aiSummarySource, setAiSummarySource] = useState<'generated' | 'loaded' | null>(null);
  
  // Find the fetchHistory function (around line 656) and add the useEffect right after it
  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch('/api/site-audit/history');
      if (!response.ok) {
        throw new Error('Failed to fetch audit history');
      }
      const data = await response.json();
      console.log('[fetchHistory] History data:', data);
      setCrawlHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
      // Don't show a toast for this background operation
    } finally {
      setIsLoadingHistory(false);
    }
  };
  
  // Add the useEffect hook here
  useEffect(() => {
    fetchHistory();
  }, []); // Empty dependency array to run only on mount
  
  // Poll for crawl status updates
  useEffect(() => {
    if (!crawlId || crawlComplete) return;
    
    // Set the start time when polling begins
    if (!crawlStartTime) {
      setCrawlStartTime(Date.now());
    }
    
    console.log('Setting up polling for crawl ID:', crawlId);
    
    // Show initial activity
    toast({
      title: "Crawl processing",
      description: "The crawler is initializing. This may take a moment.",
    });
    
    // Check for timeout after 2 minutes
    if (crawlStartTime && Date.now() - crawlStartTime > 120000 && !showTimeoutWarning) {
      setShowTimeoutWarning(true);
      toast({
        title: "Crawl taking longer than expected",
        description: "The website may be blocking our crawler or is very slow to respond. You may want to try a different site.",
        variant: "destructive",
        duration: 10000
      });
    }
    
    // Auto-increment progress slightly to show activity
    const minProgressInterval = setInterval(() => {
      setCrawlProgress(prev => {
        // Only auto-increment if below 90% and no significant change in last 10 seconds
        if (prev < 90) {
          return prev + 0.1;
        }
        return prev;
      });
    }, 1000);
    
    // Poll for status updates
    const statusInterval = setInterval(async () => {
      try {
        console.log("Polling status for crawl ID:", crawlId);
        
        const response = await fetch(`/api/site-audit/status/${crawlId}`);
        console.log("Status response status:", response.status);
        
        if (!response.ok) {
          console.error("Status API returned error:", response.status);
          throw new Error('Failed to get crawl status');
        }
        
        const data = await response.json();
        console.log("Crawl status data:", data);
        
        // Only update if the returned progress is higher than current
        if (data.progress > crawlProgress) {
          console.log(`Updating progress: ${crawlProgress} -> ${data.progress}`);
          setCrawlProgress(data.progress || 0);
        }
        
        // Fetch partial results if crawl is in progress
        if (data.status === 'started' || data.status === 'processing') {
          console.log("Fetching partial results for crawl in progress");
          fetchPartialResults();
        }
        
        if (data.status === 'completed') {
          console.log("Crawl completed, fetching final results");
          clearInterval(statusInterval);
          clearInterval(minProgressInterval);
          setCrawlProgress(100); // Ensure 100% when complete
          fetchCrawlResults();
        }
      } catch (error) {
        console.error('Error checking crawl status:', error);
        
        // Don't stop polling on errors
        if (error instanceof Error && error.message === 'Failed to get crawl status' && (error as any).response?.status === 404) {
          clearInterval(statusInterval);
          clearInterval(minProgressInterval);
          setError('Crawl not found');
        }
      }
    }, 3000);
    
    return () => {
      console.log("Clearing polling intervals");
      clearInterval(statusInterval);
      clearInterval(minProgressInterval);
    };
  }, [crawlId, crawlComplete]);
  
  // Function to fetch partial results
  const fetchPartialResults = async () => {
    if (!crawlId) return;
    
    try {
      console.log(`Fetching partial results for crawl ${crawlId}`);
      const response = await fetch(`/api/site-audit/partial-results/${crawlId}`);
      
      if (!response.ok) {
        console.log("Partial results not available yet, status:", response.status);
        // Create a minimal placeholder data structure if we don't have real data yet
        if (!crawlData) {
          setCrawlData({
            status: 'processing',
            siteUrl: crawlId ? 'Loading site URL...' : siteUrl, // Placeholder until full data or use current input
            totalPages: 0,
            issues: { critical: 0, warning: 0, info: 0 },
            pages: [],
            metricScores: {
              aiVisibility: 0,
              contentQuality: 0,
              technical: 0,
              performance: 0
            },
            started_at: new Date().toISOString(),
          });
        }
        return;
      }
      
      const data = await response.json();
      console.log("Partial crawl results:", data);
      
      if (data.pages && data.pages.length > 0) {
        console.log(`Received ${data.pages.length} pages in partial results`);
      }
      
      // Update the UI with partial results, ensuring it conforms to CrawlData
      const partialCrawlData: CrawlData = {
        siteUrl: data.siteUrl || siteUrl, // Prioritize API, fallback to current input
        status: data.status || 'processing',
        totalPages: data.totalPages || 0,
        crawledPages: data.crawledPages || (data.pages?.length || 0),
        issues: data.issues || { critical: 0, warning: 0, info: 0 },
        metricScores: data.metricScores || { aiVisibility: 0 },
        pages: data.pages || [],
        screenshots: data.screenshots || [],
        started_at: data.started_at || crawlData?.started_at || new Date().toISOString(),
        completed_at: data.completed_at,
        // Ensure all required fields of CrawlData are present
      };
      setCrawlData(partialCrawlData);
    } catch (err: any) { // Typed error
      console.error('Error fetching partial results:', err);
      // Don't show error to user as this is a background update
      // Create fallback data if we don't have any yet
      if (!crawlData) {
        setCrawlData({
          status: 'processing',
          siteUrl: siteUrl, // Use current input siteUrl as fallback
          totalPages: 0,
          issues: { critical: 0, warning: 0, info: 0 },
          pages: [],
          metricScores: {
            aiVisibility: 0,
            contentQuality: 0,
            technical: 0,
            performance: 0
          },
          started_at: new Date().toISOString(),
        });
      }
    }
  };
  
  // Function to start a crawl
  const startCrawl = async () => {
    if (!siteUrl) return;
    
    // Clear previous errors
    setError(null);
    
    // Validate URL format
    if (!validateUrl(siteUrl)) {
      setError('Please enter a valid website URL (e.g., example.com)');
      return;
    }
    
    try {
      console.log('Starting crawl for URL:', siteUrl);
      setIsCrawling(true);
      setCrawlProgress(0);
      setCrawlComplete(false);
      setCrawlData(null);
      setCrawlId(null);
      setCrawlStartTime(Date.now());
      setShowTimeoutWarning(false);
      
      console.log('Sending request to /api/site-audit/start with options:', {
        siteUrl,
        maxPages,
        includeDocuments,
        checkMediaAccessibility,
        performInteractiveActions
      });
      
      const response = await fetch('/api/site-audit/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteUrl,
          maxPages,
          includeDocuments,
          checkMediaAccessibility,
          performInteractiveActions
        }),
      });
      
      console.log('Response status:', response.status);
      
      // Get detailed error message if response is not ok
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error response:', errorData);
        const errorMessage = errorData.error || 'Failed to start crawl';
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Crawl started successfully with ID:', data.crawlId);
      setCrawlId(data.crawlId);
      
      toast({
        title: "Crawl started",
        description: "Your site is being crawled with Firecrawl. This may take a few minutes.",
      });
      
    } catch (err: any) { // Typed error for startCrawl
      console.error('Error starting crawl:', err);
      setError(err.message || 'Failed to start the site audit. Please try again.');
      setIsCrawling(false);
      
      toast({
        title: "Crawl failed",
        description: err.message || "There was an error starting the crawl.",
        variant: "destructive",
      });
    }
  };
  
  // Function to fetch crawl results
  const fetchCrawlResults = async () => {
    try {
      console.log(`Fetching final results for crawl ${crawlId}`);
      const response = await fetch(`/api/site-audit/results/${crawlId}`);
      
      if (!response.ok) {
        console.error("Error getting final results, status:", response.status);
        throw new Error('Failed to get crawl results');
      }
      
      const data = await response.json();
      console.log("Final crawl results (with potential AI summary):", data);
      
      if (data.status === 'completed') {
        console.log("Setting crawl as complete with data");
        setCrawlComplete(true);
        const finalData: CrawlData = {
            siteUrl: data.siteUrl || siteUrl, 
            status: data.status || 'completed',
            totalPages: data.totalPages || 0,
            issues: data.issues || { critical: 0, warning: 0, info: 0 },
            metricScores: data.metricScores || { aiVisibility: 0 },
            pages: data.pages || [],
            screenshots: data.screenshots || [],
            started_at: data.started_at || new Date().toISOString(), 
            completed_at: data.completed_at || new Date().toISOString(), 
            crawledPages: data.crawledPages || (data.pages?.length || 0),
            ai_summary_markdown: data.ai_summary_markdown,
            ...(data as Partial<CrawlData>)
        };
        setCrawlData(finalData);
        setIsCrawling(false);
        
        if (finalData.ai_summary_markdown) {
          setAiRecommendations(finalData.ai_summary_markdown);
          setAiSummarySource('loaded');
          setLastCrawlIdForAiRec(crawlId);
        } else {
          console.log('[fetchCrawlResults] No summary in DB for completed crawl, triggering generation for crawlId:', crawlId);
          handleGenerateRecommendations(crawlId);
        }
        toast({
          title: "Crawl completed",
          description: "Your site audit is complete.",
        });
      } else {
        // Keep waiting if status is still processing
        console.log("Results not complete yet, trying again in 3s");
        setTimeout(fetchCrawlResults, 3000);
      }
    } catch (err: any) {
      console.error('Error fetching crawl results:', err);
      setError('Failed to fetch the audit results. Please try again later.');
      setIsCrawling(false);
      
      toast({
        title: "Error fetching results",
        description: err.message || "There was an error retrieving the crawl results.",
        variant: "destructive",
      });
    }
  };
  
  // Helper function to get issue badge color
  const getIssueBadgeClass = (type: string) => {
    switch(type) {
      case 'critical':
        return 'bg-red-900/30 text-red-400 border-red-900/50';
      case 'warning':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-900/50';
      case 'info':
      default:
        return 'bg-blue-900/30 text-blue-400 border-blue-900/50';
    }
  };
  
  // Helper function to get status code badge color
  const getStatusBadgeClass = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return 'bg-green-900/30 text-green-400 border-green-900/50';
    } else if (statusCode >= 300 && statusCode < 400) {
      return 'bg-yellow-900/30 text-yellow-400 border-yellow-900/50';
    } else {
      return 'bg-red-900/30 text-red-400 border-red-900/50';
    }
  };
  
  // Helper function to get visibility badge
  const getVisibilityBadge = (score: number) => {
    if (score >= 80) {
      return <Badge className="bg-green-900/30 text-green-400 border-green-900/50">Good</Badge>;
    } else if (score >= 50) {
      return <Badge className="bg-yellow-900/30 text-yellow-400 border-yellow-900/50">Moderate</Badge>;
    } else if (score > 0) {
      return <Badge className="bg-red-900/30 text-red-400 border-red-900/50">Poor</Badge>;
    } else {
      return <Badge className="bg-[#222222] text-gray-400 border-[#333333]/30">None</Badge>;
    }
  };
  
  // Function to validate URL
  const validateUrl = (url: string) => {
    if (!url) return false;
    
    // Remove protocol for basic validation
    const cleanUrl = url.replace(/^https?:\/\//, '');
    
    // Check for valid domain format (basic check)
    return /^[a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(cleanUrl);
  };
  
  // Add a cancel function
  const cancelCrawl = () => {
    if (!crawlId) return;
    
    // Clear intervals and reset UI state
    setCrawlProgress(0);
    setIsCrawling(false);
    setCrawlComplete(false);
    setCrawlData(null);
    setCrawlId(null);
    setCrawlStartTime(null);
    setShowTimeoutWarning(false);
    
    toast({
      title: "Crawl cancelled",
      description: "You can try with a different website.",
    });
  };
  
  // Add function to filter pages
  const getFilteredPages = () => {
    if (!crawlData || !crawlData.pages) return [];
    
    if (!pageFilter) return crawlData.pages;
    
    switch (pageFilter) {
      case 'document':
        return crawlData.pages.filter((page: PageDataInCrawl) => page.is_document);
      case 'issues':
        return crawlData.pages.filter((page: PageDataInCrawl) => page.issues && page.issues.length > 0);
      case 'schema':
        return crawlData.pages.filter((page: PageDataInCrawl) => page.has_schema);
      default:
        return crawlData.pages;
    }
  };
  
  // Function to get status code breakdown
  const getStatusCodeBreakdown = () => {
    if (!crawlData || !crawlData.pages) return [];
    
    const statusCounts: { [key: number]: number } = {};
    
    // Count status codes
    crawlData.pages.forEach((page: PageDataInCrawl) => {
      const statusCodeKey = Math.floor(page.status_code / 100) * 100;
      if (!statusCounts[statusCodeKey]) {
        statusCounts[statusCodeKey] = 0;
      }
      statusCounts[statusCodeKey]++;
    });
    
    // Convert to array for rendering
    return Object.entries(statusCounts)
      .map(([status, count]) => ({ status: parseInt(status), count }))
      .sort((a, b) => a.status - b.status);
  };
  
  // Computed values for recommendations
  const issueCount = crawlData 
    ? crawlData.issues.critical + crawlData.issues.warning + crawlData.issues.info 
    : 0;

  // Function to get critical issues for the recommendations panel
  const getCriticalIssues = () => {
    if (!crawlData || !crawlData.pages) return [];
    
    const allIssues = [];
    
    // Collect all critical issues
    for (const page of crawlData.pages) {
      if (page.issues && page.issues.length > 0) {
        const criticalPageIssues = page.issues
          .filter((issue: IssueItem) => issue.type === 'critical')
          .map((issue: IssueItem) => ({
            ...issue,
            pageUrl: page.url
          }));
        allIssues.push(...criticalPageIssues);
      }
    }
    
    // Return top 3 critical issues
    return allIssues.slice(0, 3);
  };

  // Function to handle AI recommendation generation
  const handleGenerateRecommendations = async (currentCrawlId?: string | null) => {
    const targetCrawlId = currentCrawlId || crawlId; // Use provided or current crawlId

    if (!crawlData && !targetCrawlId) { // Check if we have data or at least a crawlId to work with
      toast({
        title: "No Data or Crawl ID",
        description: "Crawl data or a Crawl ID is not available to generate recommendations.",
        variant: "destructive",
      });
      return;
    }
    if (!targetCrawlId) {
        toast({ title: "Missing Crawl ID", description: "Cannot generate summary without a Crawl ID.", variant: "destructive"});
        return;
    }

    setIsGeneratingRecommendations(true);
    setAiRecommendations(null); // Clear old recommendations
    setDisplayedAiRecommendations(""); // Clear displayed text
    setAiError(null);
    setAiSummarySource('generated'); // Mark that we are generating it now

    // Prepare data for the AI (ensure crawlData is available or fetch if needed - simplified here)
    // If crawlData is not fully loaded but we have targetCrawlId, the API will use it.
    // The prompt needs metricScores and issues. If crawlData is null, we might need to send minimal data or adjust API.
    // For now, assume crawlData is available if we reach here with a targetCrawlId from a completed crawl.
    
    const payload = {
      siteUrl: crawlData?.siteUrl || siteUrl, // Fallback to input siteUrl if crawlData not fully loaded
      metricScores: crawlData?.metricScores || { aiVisibility: 0, contentQuality: 0, technical: 0, performance: 0 }, // Provide defaults
      issueSummary: crawlData?.issues || { critical: 0, warning: 0, info: 0 }, // Provide defaults
      topIssues: crawlData?.pages ? (
        (() => {
            const allCritOrWarnIssues: ({ pageUrl: string; type: string; message: string; context?: string })[] = [];
            crawlData.pages.forEach((page: PageDataInCrawl) => {
              if (page.issues && page.issues.length > 0) {
                page.issues.forEach((issue: IssueItem) => {
                  if (issue.type === 'critical' || issue.type === 'warning') {
                    allCritOrWarnIssues.push({ 
                      pageUrl: page.url,
                      type: issue.type,
                      message: issue.message,
                    });
                  }
                });
              }
            });
            allCritOrWarnIssues.sort((a, b) => (a.type === 'critical' ? -1 : 1) - (b.type === 'critical' ? -1 : 1) );
            return allCritOrWarnIssues.slice(0, 5);
        })()
      ) : [],
      crawlId: targetCrawlId, // <<<< PASS crawlId TO THE API
    };

    console.log("[DEBUG] Payload sent to /api/site-audit/generate-recommendations:", JSON.stringify(payload, null, 2));

    try {
      const response = await fetch('/api/site-audit/generate-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("[DEBUG] Error data from API route:", JSON.stringify(errorData, null, 2));
        throw new Error(errorData.error || 'Failed to generate AI recommendations');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to read response stream.');
      }
      const decoder = new TextDecoder();
      let recommendationsText = '';
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        recommendationsText += decoder.decode(value, { stream: true });
        // For live typing from stream, setDisplayedAiRecommendations(recommendationsText) here
        // But we switched to typing after full load, so we set aiRecommendations instead.
      }
      setAiRecommendations(recommendationsText + decoder.decode()); 

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error generating AI recommendations:', errorMessage);
      setAiError(errorMessage);
      toast({
        title: "AI Recommendation Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingRecommendations(false);
    }
  };
  
  // Auto-generate AI recommendations logic (MODIFIED)
  useEffect(() => {
    if (crawlComplete && crawlData && crawlId && crawlId !== lastCrawlIdForAiRec) {
      if (crawlData.ai_summary_markdown) { // Check if summary is already loaded from DB
        console.log('[AI Auto-Load] Loading summary from DB for crawl:', crawlId);
        setAiRecommendations(crawlData.ai_summary_markdown);
        setAiSummarySource('loaded');
        setLastCrawlIdForAiRec(crawlId);
        // No need to clear aiError here as we are loading successfully
      } else if (!isGeneratingRecommendations && !aiRecommendations) {
        // Only generate if not already generating and no recommendations are set (e.g. from a previous failed attempt for this crawlId)
        console.log('[AI Auto-Gen] Summary not in DB, triggering AI recommendations for new crawl:', crawlId);
        handleGenerateRecommendations(crawlId);
        // setLastCrawlIdForAiRec will be set inside handleGenerateRecommendations or upon successful load
      }
    }
    // This part is tricky: when to clear aiRecommendations if crawlId changes?
    // If navigating between historical audits, loadHistoricalCrawl should handle clearing/setting aiRecs.
    if (crawlId && crawlId !== lastCrawlIdForAiRec && (aiRecommendations || aiError)) { // If crawlId changes and it's not the one we have summary for
        console.log('[AI State Clear] Crawl ID changed, clearing old AI summary/error for crawlId:', lastCrawlIdForAiRec, 'New crawlId:', crawlId);
        setAiRecommendations(null);
        setDisplayedAiRecommendations("");
        setAiError(null);
        setAiSummarySource(null);
        setLastCrawlIdForAiRec(null); 
    }

  }, [crawlComplete, crawlData, crawlId, lastCrawlIdForAiRec]); // Removed handleGenerateRecommendations from deps to avoid loops, ensure it's stable or wrapped in useCallback if added back

  // useEffect for typewriter effect (modified to depend on aiSummarySource as well)
  useEffect(() => {
    if (aiRecommendations && !isGeneratingRecommendations) {
      let i = 0;
      const textToType = aiRecommendations;
      setDisplayedAiRecommendations(""); 
      setIsAiSummaryExpanded(false);    

      const typingInterval = setInterval(() => {
        if (i < textToType.length) {
          const chunkSize = Math.min(5, textToType.length - i); 
          setDisplayedAiRecommendations(prev => prev + textToType.substring(i, i + chunkSize));
          i += chunkSize;
        } else {
          clearInterval(typingInterval);
          setDisplayedAiRecommendations(textToType);
        }
      }, 25);
      
      return () => clearInterval(typingInterval); 

    } else if (!aiRecommendations && displayedAiRecommendations !== "") {
      setDisplayedAiRecommendations("");
      setIsAiSummaryExpanded(false);
    }
  }, [aiRecommendations, isGeneratingRecommendations, aiSummarySource]); // Added aiSummarySource

  // Function to load a historical crawl into the main view (MODIFIED)
  const loadHistoricalCrawl = async (histCrawlId: string) => {
    if (!histCrawlId) return;
    console.log(`Loading historical crawl: ${histCrawlId}`);
    
    // Reset current crawl state, but keep siteUrl if needed for context or allow re-audit
    setIsCrawling(false); // Not actively crawling this historical one
    setCrawlProgress(100); // It was completed
    setCrawlComplete(false); // Set to false initially until data is loaded
    setCrawlData(null);      // Clear previous live crawl data
    setError(null);
    setAiRecommendations(null); // Clear previous AI recommendations
    setAiError(null);
    setAiSummarySource(null); // Reset summary source
    setLastCrawlIdForAiRec(null); // Clear last crawl id for AI rec

    toast({ title: "Loading Past Audit...", description: "Fetching details for the selected audit." });

    try {
      const response = await fetch(`/api/site-audit/results/${histCrawlId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get historical crawl results');
      }
      let data = await response.json(); // data from /api/site-audit/results endpoint
      console.log('[loadHistoricalCrawl] Data from results API (with potential AI summary):', JSON.stringify(data, null, 2));
      
      if (data.status === 'completed') {
        // Safe date parsing function to avoid invalid date errors
        const safeParseDate = (dateStr: string | null | undefined): string => {
          if (!dateStr) return new Date().toISOString();
          try {
            const date = new Date(dateStr);
            // Check if date is valid
            return !isNaN(date.getTime()) ? date.toISOString() : new Date().toISOString();
          } catch (e) {
            console.error('Invalid date format:', dateStr, e);
            return new Date().toISOString();
          }
        };

        const finalCrawlData: CrawlData = {
          ...(data as Omit<Partial<CrawlData>, 'siteUrl' | 'started_at'>), 
          siteUrl: data.siteUrl || siteUrl, // INTENDED: Use the normalized URL from the clicked histItem
          status: data.status,
          totalPages: data.totalPages || 0,
          issues: data.issues || { critical: 0, warning: 0, info: 0 },
          metricScores: data.metricScores || { aiVisibility: 0 },
          // Use safer date parsing to prevent "Invalid time value" errors
          started_at: data.started_at ? safeParseDate(data.started_at) : safeParseDate(data.created_at),
          completed_at: data.completed_at ? safeParseDate(data.completed_at) : safeParseDate(data.created_at),
          pages: data.pages || [],
          screenshots: data.screenshots || [],
          ai_summary_markdown: data.ai_summary_markdown,
        };

        setCrawlData(finalCrawlData);
        setCrawlId(histCrawlId); 
        setCrawlComplete(true); // Mark as complete to show results view
        // If the historical data contains a siteUrl, update the input field
        if(data.siteUrl) setSiteUrl(data.siteUrl);

        if (finalCrawlData.ai_summary_markdown) {
          console.log('[loadHistoricalCrawl] AI summary found in historical data for crawlId:', histCrawlId);
          setAiRecommendations(finalCrawlData.ai_summary_markdown);
          setAiSummarySource('loaded');
          setLastCrawlIdForAiRec(histCrawlId);
        } else {
          console.log('[loadHistoricalCrawl] No AI summary in historical data, triggering generation for crawlId:', histCrawlId);
          setAiRecommendations(null); // Clear any old summary
          setDisplayedAiRecommendations("");
          handleGenerateRecommendations(histCrawlId);
        }
        toast({ title: "Past Audit Loaded", description: "Displaying details for the selected audit." });
      } else {
        throw new Error('Selected historical crawl is not in a completed state.');
      }
    } catch (err) {
      console.error('Error loading historical crawl:', err);
      setError(err instanceof Error ? err.message : 'Failed to load the selected audit.');
      toast({
        title: "Error Loading Audit",
        description: err instanceof Error ? err.message : "Could not load the selected audit.",
        variant: "destructive",
      });
      // Reset view if loading fails
      setCrawlComplete(false);
      setCrawlId(null);
    }
  };
  
  return (
    <main className="flex flex-1 flex-col gap-8 p-8 overflow-auto bg-[#0c0c0c]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Site Audit</h1>
        
        {crawlComplete && crawlData && (
        <Button 
          className="bg-gradient-to-r from-[#222222] to-[#2a2a2a] text-white hover:from-[#282828] hover:to-[#333333] border border-[#333333]"
            onClick={() => {
              setCrawlComplete(false);
              setCrawlData(null);
            }}
        >
          <Search className="h-4 w-4 mr-2" />
            New Audit
        </Button>
        )}
      </div>

      {/* URL Input and Crawl Initiation - Centered, v0 Style */}
      {!isCrawling && !crawlComplete && (
        <div className="flex flex-1 flex-col items-center justify-center p-4 text-center space-y-8 min-h-[calc(100vh-200px)]"> {/* Adjust min-h as needed */} 
          
          {/* Main Call to Action */}
          <div className="w-full max-w-xl space-y-4">
            <h1 className="text-4xl font-bold text-white tracking-tight">Audit Your Website</h1>
            <p className="text-md text-gray-400">
              Enter your website URL to analyze its SEO and AI Engine Optimization.
            </p>
            
            <div className="flex flex-row gap-2 items-center pt-4">
              <Globe className="h-6 w-6 text-gray-500 flex-shrink-0" />
                  <Input
                className="bg-[#161616] border-2 border-[#222222] text-white placeholder:text-gray-500 flex-grow h-12 text-md focus:border-[#FF914D] focus:ring-1 focus:ring-[#FF914D] rounded-md"
                placeholder="example.com"
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                  />
                <Button 
                variant="outline"
                size="icon" 
                className={`h-12 w-12 flex-shrink-0 border-2 
                            ${validateUrl(siteUrl) 
                                ? 'border-[#FF914D] bg-[#FF914D]/20 hover:bg-[#FF914D]/30' 
                                : 'border-[#333333] bg-[#1f1f1f] hover:border-gray-600'
                            } transition-colors duration-200 rounded-md`}
                  onClick={startCrawl}
                  disabled={!validateUrl(siteUrl) || isCrawling}
                title="Start Audit"
                >
                <ArrowRight className={`h-6 w-6 ${validateUrl(siteUrl) ? 'text-[#FF914D]' : 'text-gray-400'}`} />
                </Button>
              </div>
            {error && (
              <p className="text-red-400 text-sm mt-2 text-left pl-8">{error}</p>
            )}
            {/* Audit History Dropdown Button */}
            <div className="pt-3 text-left pl-8">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button 
                  variant="link" 
                    className="text-xs text-gray-400 hover:text-[#FF914D] p-0 h-auto flex items-center"
                >
                    View Audit History
                    <ChevronDown className="h-3 w-3 ml-1 opacity-70" />
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="w-80 md:w-96 bg-[#131313] border-[#333333] text-gray-200 shadow-2xl rounded-md" 
                  style={{ maxHeight: 'calc(100vh - 150px)', overflowY: 'hidden' }} // Prevent DropdownMenuContent itself from scrolling
                  align="start"
                >
                  <DropdownMenuLabel className="text-gray-400 px-3 py-2 text-sm font-medium">Past Audits</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[#333333]" />
                  <div className="max-h-80 overflow-y-auto custom-scrollbar"> {/* Inner div handles scrolling */} 
                    {isLoadingHistory && (
                      <DropdownMenuItem disabled className="text-gray-500 px-3 py-2 text-xs focus:bg-transparent cursor-default">Loading history...</DropdownMenuItem>
                    )}
                    {!isLoadingHistory && crawlHistory && crawlHistory.length > 0 && (
                      <>
                        {crawlHistory.map((hist) => (
                          <DropdownMenuItem 
                            key={hist.crawl_id} 
                            className="px-3 py-2.5 hover:bg-[#FF914D]/10 focus:bg-[#FF914D]/20 cursor-pointer data-[disabled]:opacity-50 data-[disabled]:pointer-events-none rounded-sm"
                            onClick={() => loadHistoricalCrawl(hist.crawl_id)}
                          >
                            <div className="flex flex-col w-full">
                              <div className="flex justify-between items-center w-full">
                                <p className="text-xs font-semibold text-gray-100 truncate" title={hist.site_url}>{hist.site_url || 'N/A'}</p>
                                <p className="text-[11px] text-gray-300 flex-shrink-0 ml-2">
                                  {hist.ai_visibility_score}<span className="text-gray-500">/100</span>
                                </p>
                    </div>
                              <div className="flex justify-between items-center w-full mt-0.5">
                                <p className="text-[10px] text-gray-500">
                                    {hist.created_at ? new Date(hist.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date N/A'}
                                </p>
                                {hist.status !== 'completed' && (
                                    <Badge variant="outline" className="text-[9px] leading-tight px-1 py-0 border-yellow-700/60 text-yellow-400 bg-yellow-900/30 h-auto">
                                        {hist.status}
                                    </Badge>
                                )}
                    </div>
                  </div>
                          </DropdownMenuItem>
                        ))}
                      </>
                    )}
                    {!isLoadingHistory && (!crawlHistory || crawlHistory.length === 0) && (
                      <DropdownMenuItem disabled className="text-gray-500 px-3 py-2 text-xs focus:bg-transparent cursor-default">No past audits found.</DropdownMenuItem>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
                </div>
                </div>
                
          {/* Advanced Options Panel - REMOVED from direct view */}
          {/* {showAdvancedOptions && ( ... )} */}

          {/* Audit History Dropdown Button - REMOVED from here, relocated above */}
          {/* <div className="pt-6"> ... DropdownMenu ... </div> */}
                  </div>
      )}
      
      {/* Crawl Progress Indicator */}
      {isCrawling && (
        <Card className="bg-[#101010] border-[#222222] border shadow-md">
          <CardHeader className="border-b border-[#222222]/50 pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-medium text-white">Crawling Site with Firecrawl</CardTitle>
              <div className="flex gap-2">
                <Badge className="bg-[#161616] text-yellow-400 border-[#222222] h-7 px-3 animate-pulse">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  In Progress
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-7 px-3 text-gray-400 hover:text-white"
                  onClick={cancelCrawl}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-400">Analyzing {siteUrl}</p>
                <p className="text-sm text-gray-400">
                  {Math.round(crawlProgress)}% 
                  {crawlData && ` • ${crawlData.crawledPages || 0} pages analyzed`}
                </p>
              </div>
              <Progress 
                value={crawlProgress} 
                className="h-2 bg-[#222222]" 
                indicatorClassName={`bg-gradient-to-r from-[#FF914D] to-[#FFEC9F] ${crawlProgress < 100 ? 'animate-pulse' : ''}`} 
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-[#161616] rounded-md p-3 border border-[#222222]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Content Analysis</span>
                    <span className="text-xs text-gray-400 animate-pulse">
                      {crawlData?.metricScores?.contentQuality 
                        ? `${crawlData.metricScores.contentQuality}%` 
                        : (crawlProgress > 30 ? 'In Progress' : 'Initializing...')}
                    </span>
                  </div>
                </div>
                
                <div className="bg-[#161616] rounded-md p-3 border border-[#222222]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Technical Audit</span>
                    <span className="text-xs text-gray-400 animate-pulse">
                      {crawlData?.metricScores?.technical 
                        ? `${crawlData.metricScores.technical}%` 
                        : (crawlProgress > 60 ? 'In Progress' : 'Waiting...')}
                    </span>
                  </div>
                </div>
                
                <div className="bg-[#161616] rounded-md p-3 border border-[#222222]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">AI Optimization</span>
                    <span className="text-xs text-gray-400 animate-pulse">
                      {crawlData?.metricScores?.aiVisibility 
                        ? `${crawlData.metricScores.aiVisibility}%` 
                        : (crawlProgress > 80 ? 'In Progress' : 'Waiting...')}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Show live results if available */}
              {crawlData && crawlData.pages && crawlData.pages.length > 0 && (
                <div className="mt-6 pt-4 border-t border-[#222222]">
                  <h3 className="text-sm font-medium text-white mb-3">Live Results ({crawlData.pages.length} pages)</h3>
                  <div className="max-h-[200px] overflow-y-auto rounded-md border border-[#222222]">
                    <div className="grid grid-cols-12 gap-4 bg-[#161616] px-4 py-3 text-xs font-medium text-gray-400">
                      <div className="col-span-6">URL</div>
                      <div className="col-span-1">Status</div>
                      <div className="col-span-3">Title</div>
                      <div className="col-span-2">AI Visibility</div>
                    </div>
                    <div className="divide-y divide-[#222222]">
                      {crawlData.pages.map((page: PageDataInCrawl, index: number) => (
                        <div key={index} className="grid grid-cols-12 gap-4 px-4 py-2 items-center text-xs">
                          <div className="col-span-6 font-medium text-white truncate">
                            {page.url}
                          </div>
                          <div className="col-span-1">
                            <Badge className={`${getStatusBadgeClass(page.status_code)}`}>
                              {page.status_code}
                            </Badge>
                          </div>
                          <div className="col-span-3 text-gray-300 truncate">
                            {page.title}
                          </div>
                          <div className="col-span-2">
                            {getVisibilityBadge(page.ai_visibility_score || 0)}
                          </div>
                        </div>
                      ))}
              </div>
            </div>
                  
                  {/* Show live issues summary if available */}
                  {(crawlData.issues.critical > 0 || crawlData.issues.warning > 0) && (
                    <div className="mt-4 bg-[#161616] rounded-md p-3 border border-[#222222]">
                      <h4 className="text-xs font-medium text-white mb-2">Issues Found</h4>
                      <div className="flex gap-3">
                        {crawlData.issues.critical > 0 && (
                          <Badge className="bg-red-900/30 text-red-400 border-red-900/50">
                            {crawlData.issues.critical} Critical
                          </Badge>
                        )}
                        {crawlData.issues.warning > 0 && (
                          <Badge className="bg-yellow-900/30 text-yellow-400 border-yellow-900/50">
                            {crawlData.issues.warning} Warnings
                          </Badge>
                        )}
                        {crawlData.issues.info > 0 && (
                          <Badge className="bg-blue-900/30 text-blue-400 border-blue-900/50">
                            {crawlData.issues.info} Info
              </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Crawl Results */}
      {crawlComplete && crawlData && (
        <div className="w-full space-y-8"> {/* Increased spacing between sections */} 
          {/* --- TOP SECTION: Site Info (Left) & Score Wheel (Right) --- */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-6 md:gap-12">
            {/* Left: Site Title, Meta Description, Link */}
            <div className="flex-grow space-y-3 md:max-w-[60%]">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">SITE TITLE</p>
                <h2 className="text-2xl font-semibold text-white leading-tight">
                  {crawlData.pages?.find((p: PageDataInCrawl) => p.url === crawlData.siteUrl)?.title || 
                   crawlData.pages?.[0]?.title || 
                   crawlData.siteUrl}
                </h2>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">META DESCRIPTION</p>
                <p className="text-sm text-gray-300 leading-relaxed line-clamp-3">
                  {crawlData.pages?.find((p: PageDataInCrawl) => p.url === crawlData.siteUrl)?.meta_description || 
                   crawlData.pages?.[0]?.meta_description || 
                   'Meta description not available.'
                  }
                </p>
              </div>
              <div>
                <a 
                  href={crawlData.siteUrl}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-[#FF914D] hover:text-[#FFB07D] flex items-center group mt-1"
                >
                  Visit Site <ExternalLink className="h-3 w-3 ml-1.5 opacity-70 group-hover:opacity-100 transition-opacity" />
                </a>
            </div>
                  </div>

            {/* Right: Visibility Score Wheel */}
            <div className="flex-shrink-0 md:ml-auto md:mt-2">
              <ScoreWheel score={crawlData.metricScores.aiVisibility} size={140} strokeWidth={12} />
            </div>
          </div>

          {/* --- "ALMOST TABS" SECTION: Stats --- */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 items-center border-y border-gray-800 py-4">
            <div className="text-sm">
              <span className="text-gray-400">Pages Crawled: </span>
              <span className="font-semibold text-white">{crawlData.totalPages}</span>
              </div>
            <div className="text-sm">
              <span className="text-red-400">Critical Issues: </span>
              <span className="font-semibold text-white">{crawlData.issues.critical}</span>
              </div>
            <div className="text-sm">
              <span className="text-yellow-400">Warnings: </span>
              <span className="font-semibold text-white">{crawlData.issues.warning}</span>
            </div>
            </div>

          {/* --- SECTION: AI Summary (No longer a Card) --- */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-white mb-3">AI Summary</h2>
            <div className="min-h-[80px]">
              {(isGeneratingRecommendations && !aiRecommendations && !aiError) && (
                <div className="space-y-2.5 py-3 animate-pulse">
                  <div className="h-3.5 bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3.5 bg-gray-700 rounded w-full"></div>
                  <div className="h-3.5 bg-gray-700 rounded w-5/6"></div>
                  </div>
              )}
              {aiError && !isGeneratingRecommendations && (
                <div className="text-red-400 py-4">
                  <AlertTriangle className="h-5 w-5 mr-2 inline-block" />
                  Error generating summary: {aiError}
                  <Button 
                      variant="link" 
                      className="text-xs text-[#FF914D] p-0 h-auto mt-1 ml-7 hover:text-[#FFB07D] focus:outline-none focus:ring-0 focus:ring-offset-0"
                      onClick={() => handleGenerateRecommendations(crawlId)} // Allow manual retry
                  > 
                      Retry Generation
                  </Button>
                  </div>
              )}
              
              {!isGeneratingRecommendations && displayedAiRecommendations && (
                <div className="relative">
                  <AnimatePresence initial={false}>
                    <motion.div 
                      key="aiSummaryContent"
                      initial="collapsed"
                      animate={isAiSummaryExpanded ? "expanded" : "collapsed"}
                      exit="collapsed" // Optional: define how it exits if content itself is removed
                      variants={{
                        collapsed: { 
                          maxHeight: '180px', // Same as your previous max-h for truncation
                          opacity: 1, 
                          transition: { duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }
                        },
                        expanded: { 
                          maxHeight: '1000px', // A large enough value to show all content
                          opacity: 1,
                          transition: { duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }
                        }
                      }}
                      className={`prose prose-sm prose-headings:text-gray-100 prose-strong:text-gray-200 prose-invert max-w-none text-gray-400 leading-relaxed overflow-hidden`} 
                      // Masking is applied via style only when collapsed to prevent interfering with framer-motion's height
                      style={!isAiSummaryExpanded ? {
                        WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                        maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                      } : {}}
                    >
                      <ReactMarkdown>
                        {displayedAiRecommendations}
                      </ReactMarkdown>
                    </motion.div>
                  </AnimatePresence>
                  
                  {/* Toggle Button for See more / See less */}
                  {displayedAiRecommendations.length > 300 && ( 
                    <div className={`w-full flex pt-1 ${isAiSummaryExpanded ? 'justify-end' : 'justify-start' }`}>
                        <Button 
                            variant="link"
                            className={`text-[#FF914D] hover:text-[#FFB07D] text-sm p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 no-underline focus:outline-none 
                                        ${!isAiSummaryExpanded ? 'bg-gradient-to-t from-[#0c0c0c] via-[#0c0c0c]/90 to-transparent pt-6 pr-4 pl-1' : 'mt-2'}
                                        `}
                            onClick={() => setIsAiSummaryExpanded(!isAiSummaryExpanded)}
                        >
                            {isAiSummaryExpanded ? 'See less...' : 'See more...'}
                        </Button>
                </div>
                  )}
          </div>
              )}
              {!isGeneratingRecommendations && !displayedAiRecommendations && !aiError && (
                 <div className="text-gray-500 py-4">
                   {crawlComplete && crawlData ? 
                     'AI Summary will be generated or loaded shortly.' : 
                     'Complete an audit to see the AI Summary.'
                   }
                 </div>
              )}
            </div>
          </div>

          {/* --- SECTION: Key Issues (No longer a Card) --- */}
          <div className="mt-8"> {/* Added margin-top for separation */}
            <h2 className="text-lg font-semibold text-white mb-4">Key Issues</h2> {/* Title for the section */}
            {/* The content previously in CardContent will now be here */}
            { 
              (() => {
                if (!crawlData || !crawlData.pages || crawlData.pages.length === 0) {
                  return <p className="text-gray-500 py-4">No page data available to display issues.</p>;
                }
                
                const criticalIssues: { pageUrl: string; message: string; }[] = [];
                const warningIssues: { pageUrl: string; message: string; }[] = [];

                crawlData.pages.forEach((page: PageDataInCrawl) => {
                  if (page.issues && page.issues.length > 0) {
                    page.issues.forEach((issue: IssueItem) => {
                      if (issue.type === 'critical') {
                        criticalIssues.push({ 
                          pageUrl: page.url,
                          message: issue.message,
                        });
                      } else if (issue.type === 'warning') {
                        warningIssues.push({ 
                          pageUrl: page.url,
                          message: issue.message,
                        });
                      }
                    });
                  }
                });

                if (criticalIssues.length === 0 && warningIssues.length === 0) {
                  return (
                    <div className="py-4 text-center">
                      <CheckCircle2 className="h-10 w-10 text-green-500 mb-3 mx-auto" />
                      <p className="text-md font-medium text-white">No Critical or Warning Issues Found</p>
                      <p className="text-sm text-gray-400">Excellent! Your site audit looks clean.</p>
          </div>
                  );
                }
                
                const renderIssueList = (issues: { pageUrl: string; message: string; }[]) => {
                  if (issues.length === 0) {
                      return <p className="text-sm text-gray-500 py-4 text-center">No issues of this type found.</p>;
                  }
                  return (
                    <div className="space-y-1.5 mt-4">
                      {issues.map((issue, index) => (
                        <div key={index} className="p-2.5 bg-[#1A1A1A] border border-[#282828] rounded-md flex justify-between items-center min-h-[50px]">
                          <p className="text-sm text-gray-400 leading-tight truncate flex-grow mr-4" title={issue.message}>{issue.message}</p>
                          <a 
                            href={issue.pageUrl}
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs text-[#FF914D] hover:text-[#FFB07D] flex-shrink-0 flex items-center"
                            title={`View page: ${issue.pageUrl}`}
                          >
                            {issue.pageUrl.length > 30 ? issue.pageUrl.substring(0, 27) + '...' : issue.pageUrl} 
                            <ExternalLink className="h-3 w-3 ml-1.5 opacity-80" />
                          </a>
              </div>
                      ))}
            </div>
                  );
                };

                return (
                  <Tabs defaultValue="warnings" className="w-full">
                    <div className="mb-3">
                      <TabsList className="inline-grid grid-cols-2 bg-[#1A1A1A] border border-[#282828] h-9 rounded-md p-0.5">
                        <TabsTrigger 
                          value="warnings" 
                          className="text-xs data-[state=active]:bg-[#282828] data-[state=active]:text-gray-100 text-gray-500 hover:text-gray-300 px-3 py-1.5 rounded-sm"
                        >
                          <AlertTriangle className="h-3.5 w-3.5 mr-1.5 text-yellow-500" />
                          Warnings ({warningIssues.length})
                        </TabsTrigger>
                        <TabsTrigger 
                          value="critical" 
                          className="text-xs data-[state=active]:bg-[#282828] data-[state=active]:text-gray-100 text-gray-500 hover:text-gray-300 px-3 py-1.5 rounded-sm"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1.5 text-red-500" />
                          Critical ({criticalIssues.length})
                        </TabsTrigger>
                      </TabsList>
            </div>
                    <TabsContent value="warnings" className="mt-1">
                      {renderIssueList(warningIssues)}
                    </TabsContent>
                    <TabsContent value="critical" className="mt-1">
                      {renderIssueList(criticalIssues)}
                    </TabsContent>
                  </Tabs>
                );
              })()
            }
          </div>
          
          </div>
      )}
    </main>
  );
} 