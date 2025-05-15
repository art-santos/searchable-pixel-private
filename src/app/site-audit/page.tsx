'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
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
  ScreenShare
} from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

export default function SiteAudit() {
  const [siteUrl, setSiteUrl] = useState('')
  const [isCrawling, setIsCrawling] = useState(false)
  const [crawlProgress, setCrawlProgress] = useState(0)
  const [crawlComplete, setCrawlComplete] = useState(false)
  const [crawlData, setCrawlData] = useState<any>(null)
  const [crawlId, setCrawlId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  
  // Add options for enhanced features
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [maxPages, setMaxPages] = useState(100)
  const [includeDocuments, setIncludeDocuments] = useState(true)
  const [checkMediaAccessibility, setCheckMediaAccessibility] = useState(true)
  const [performInteractiveActions, setPerformInteractiveActions] = useState(false)
  
  // Add a timeout state to detect issues with long-running crawls
  const [crawlStartTime, setCrawlStartTime] = useState<number | null>(null)
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)
  
  // Add page filter state
  const [pageFilter, setPageFilter] = useState<string | null>(null)
  
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
        if (error.message === 'Failed to get crawl status' && error.response?.status === 404) {
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
            totalPages: 0,
            crawledPages: 0,
            aeoScore: 0,
            issues: { critical: 0, warning: 0, info: 0 },
            pages: [],
            metricScores: {
              aiVisibility: 0,
              contentQuality: 0,
              technical: 0,
              performance: 0
            },
            isPartial: true
          });
        }
        return;
      }
      
      const data = await response.json();
      console.log("Partial crawl results:", data);
      
      if (data.pages && data.pages.length > 0) {
        console.log(`Received ${data.pages.length} pages in partial results`);
      }
      
      // Update the UI with partial results
      setCrawlData(data);
    } catch (error) {
      console.error('Error fetching partial results:', error);
      // Don't show error to user as this is a background update
      // Create fallback data if we don't have any yet
      if (!crawlData) {
        setCrawlData({
          status: 'processing',
          totalPages: 0,
          crawledPages: 0,
          aeoScore: 0,
          issues: { critical: 0, warning: 0, info: 0 },
          pages: [],
          metricScores: {
            aiVisibility: 0,
            contentQuality: 0,
            technical: 0,
            performance: 0
          },
          isPartial: true
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
      
    } catch (error) {
      console.error('Error starting crawl:', error);
      setError(error.message || 'Failed to start the site audit. Please try again.');
      setIsCrawling(false);
      
      toast({
        title: "Crawl failed",
        description: error.message || "There was an error starting the crawl.",
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
      console.log("Final crawl results:", data);
      
      if (data.status === 'completed') {
        console.log("Setting crawl as complete with data");
        setCrawlComplete(true);
        setCrawlData(data);
        setIsCrawling(false);
        
        toast({
          title: "Crawl completed",
          description: "Your site audit is complete.",
        });
      } else {
        // Keep waiting if status is still processing
        console.log("Results not complete yet, trying again in 3s");
        setTimeout(fetchCrawlResults, 3000);
      }
    } catch (error) {
      console.error('Error fetching crawl results:', error);
      setError('Failed to fetch the audit results. Please try again later.');
      setIsCrawling(false);
      
      toast({
        title: "Error fetching results",
        description: error.message || "There was an error retrieving the crawl results.",
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
        return crawlData.pages.filter(page => page.is_document);
      case 'issues':
        return crawlData.pages.filter(page => page.issues && page.issues.length > 0);
      case 'schema':
        return crawlData.pages.filter(page => page.has_schema);
      default:
        return crawlData.pages;
    }
  };
  
  // Function to get status code breakdown
  const getStatusCodeBreakdown = () => {
    if (!crawlData || !crawlData.pages) return [];
    
    const statusCounts = {};
    
    // Count status codes
    crawlData.pages.forEach(page => {
      const statusCode = Math.floor(page.status_code / 100) * 100;
      if (!statusCounts[statusCode]) {
        statusCounts[statusCode] = 0;
      }
      statusCounts[statusCode]++;
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
        const criticalIssues = page.issues
          .filter(issue => issue.type === 'critical')
          .map(issue => ({
            ...issue,
            pageUrl: page.url
          }));
        allIssues.push(...criticalIssues);
      }
    }
    
    // Return top 3 critical issues
    return allIssues.slice(0, 3);
  };
  
  return (
    <main className="flex flex-1 flex-col gap-8 p-8 overflow-auto bg-[#0c0c0c]">
      {/* Debug info - Remove this in production */}
      <div className="bg-[#161616] p-4 rounded border border-[#222222] text-xs text-gray-300">
        <h3 className="font-bold mb-2 text-white">Debug Info:</h3>
        <div>isCrawling: {isCrawling ? 'true' : 'false'}</div>
        <div>crawlProgress: {crawlProgress}</div>
        <div>crawlComplete: {crawlComplete ? 'true' : 'false'}</div>
        <div>crawlId: {crawlId || 'null'}</div>
        <div>error: {error || 'null'}</div>
        <div>crawlData: {crawlData ? `has ${crawlData.pages?.length || 0} pages` : 'null'}</div>
        <button 
          onClick={() => console.log('Current state:', { isCrawling, crawlProgress, crawlComplete, crawlId, error, crawlData })}
          className="mt-2 px-2 py-1 bg-[#222222] text-white rounded"
        >
          Log State
        </button>
      </div>
      
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

      {/* URL Input and Crawl Initiation */}
      {!isCrawling && !crawlComplete && (
        <Card className="bg-gradient-to-b from-[#101010] to-[#151515] border-[#222222] border shadow-lg">
          <CardHeader className="border-b border-[#222222]/50 pb-4">
            <CardTitle className="text-xl font-medium text-white flex items-center gap-2">
              <Globe className="h-5 w-5 text-[#FF914D]" />
              Site Crawler
            </CardTitle>
            <CardDescription className="text-gray-400">
              Analyze your website for SEO and AI Engine Optimization using Firecrawl
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="text-sm text-gray-300 mb-3">
                Enter your website URL to start a comprehensive site audit
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    className="bg-[#161616] border-[#222222] text-white placeholder:text-gray-500"
                    placeholder="https://yourdomain.com"
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                  />
                  {error && (
                    <p className="text-red-400 text-xs mt-1">{error}</p>
                  )}
                </div>
                <Button 
                  className="bg-gradient-to-r from-[#222222] to-[#2a2a2a] text-white hover:from-[#282828] hover:to-[#333333] border border-[#333333]"
                  onClick={startCrawl}
                  disabled={!validateUrl(siteUrl) || isCrawling}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Start Crawl
                </Button>
              </div>
              
              {/* Advanced options toggle */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#222222]/50">
                <Button 
                  variant="link" 
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className="text-[#FF914D] p-0 flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  {showAdvancedOptions ? 'Hide Advanced Options' : 'Show Advanced Options'}
                </Button>
              </div>
              
              {/* Advanced options panel */}
              {showAdvancedOptions && (
                <div className="mt-2 pt-4 border-t border-[#222222]/30 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-300 mb-1 block">Maximum Pages</label>
                      <div className="flex items-center">
                        <Input
                          className="bg-[#161616] border-[#222222] text-white"
                          type="number"
                          min="1"
                          max="500"
                          value={maxPages}
                          onChange={(e) => setMaxPages(parseInt(e.target.value) || 100)}
                        />
                        <span className="ml-2 text-sm text-gray-400">pages</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="includeDocuments" 
                        checked={includeDocuments}
                        onCheckedChange={(checked) => setIncludeDocuments(checked as boolean)}
                      />
                      <label 
                        htmlFor="includeDocuments" 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
                      >
                        <FileDown className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-white">Include documents (PDF, DOCX, etc.)</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="checkMediaAccessibility" 
                        checked={checkMediaAccessibility}
                        onCheckedChange={(checked) => setCheckMediaAccessibility(checked as boolean)}
                      />
                      <label 
                        htmlFor="checkMediaAccessibility" 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
                      >
                        <Image className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-white">Analyze media accessibility</span>
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="performInteractiveActions" 
                        checked={performInteractiveActions}
                        onCheckedChange={(checked) => setPerformInteractiveActions(checked as boolean)}
                      />
                      <label 
                        htmlFor="performInteractiveActions" 
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
                      >
                        <ScreenShare className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-white">Perform interactive checks (cookies, popups)</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-4 border-t border-[#222222]">
                <div className="bg-[#161616] rounded-md p-4 border border-[#222222]">
                  <div className="flex items-center mb-2">
                    <FileText className="h-4 w-4 text-gray-400 mr-2" />
                    <h3 className="text-sm font-medium text-white">Content Analysis</h3>
                  </div>
                  <p className="text-xs text-gray-400">
                    Analyzes headings, content structure, metadata, and keyword usage
                  </p>
                </div>
                
                <div className="bg-[#161616] rounded-md p-4 border border-[#222222]">
                  <div className="flex items-center mb-2">
                    <Zap className="h-4 w-4 text-gray-400 mr-2" />
                    <h3 className="text-sm font-medium text-white">Technical Audit</h3>
                  </div>
                  <p className="text-xs text-gray-400">
                    Checks for broken links, redirects, performance issues, and more
                  </p>
                </div>
                
                <div className="bg-[#161616] rounded-md p-4 border border-[#222222]">
                  <div className="flex items-center mb-2">
                    <Bot className="h-4 w-4 text-gray-400 mr-2" />
                    <h3 className="text-sm font-medium text-white">AI Optimization</h3>
                  </div>
                  <p className="text-xs text-gray-400">
                    Evaluates how well your content is optimized for AI engines
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
                      {crawlData.pages.map((page, index) => (
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
        <>
          {/* Summary Cards */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-4">
            {/* Pages Crawled */}
        <Card className="bg-[#101010] border-[#222222] border shadow-md">
          <CardContent className="pt-6 px-6">
            <div className="flex justify-between items-start">
              <div>
                    <p className="text-sm text-gray-400">Pages Crawled</p>
                    <h2 className="text-2xl font-bold text-white mt-1">{crawlData.totalPages}</h2>
              </div>
              <div className="rounded-full bg-[#1a1a1a] p-2 border border-[#222222]">
                    <LayoutGrid className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
                  <div className="w-full bg-[#222222] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#333333] h-full rounded-full w-full"></div>
                  </div>
            </div>
          </CardContent>
        </Card>
        
            {/* Critical Issues */}
        <Card className="bg-[#101010] border-[#222222] border shadow-md">
          <CardContent className="pt-6 px-6">
            <div className="flex justify-between items-start">
              <div>
                    <p className="text-sm text-gray-400">Critical Issues</p>
                    <h2 className="text-2xl font-bold text-white mt-1">{crawlData.issues.critical}</h2>
              </div>
              <div className="rounded-full bg-[#1a1a1a] p-2 border border-[#222222]">
                    <XCircle className="h-5 w-5 text-red-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
                  <Badge className="bg-red-900/30 text-red-400 border-red-900/50 h-6 px-2">
                    High Priority
              </Badge>
            </div>
          </CardContent>
        </Card>
      
            {/* Warnings */}
      <Card className="bg-[#101010] border-[#222222] border shadow-md">
              <CardContent className="pt-6 px-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-400">Warnings</p>
                    <h2 className="text-2xl font-bold text-white mt-1">{crawlData.issues.warning}</h2>
                  </div>
                  <div className="rounded-full bg-[#1a1a1a] p-2 border border-[#222222]">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs">
                  <Badge className="bg-yellow-900/30 text-yellow-400 border-yellow-900/50 h-6 px-2">
                    Medium Priority
            </Badge>
          </div>
        </CardContent>
      </Card>
      
            {/* AI Visibility Score */}
      <Card className="bg-[#101010] border-[#222222] border shadow-md">
              <CardContent className="pt-6 px-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-400">AI Visibility Score</p>
                    <h2 className="text-2xl font-bold text-white mt-1">{crawlData.metricScores.aiVisibility}/100</h2>
          </div>
                  <div className="rounded-full bg-[#1a1a1a] p-2 border border-[#222222]">
                    <Bot className="h-5 w-5 text-[#FF914D]" />
              </div>
            </div>
                <div className="mt-4 flex items-center text-xs">
                  <div className="w-full bg-[#222222] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-[#FF914D] to-[#FFEC9F] h-full rounded-full" 
                      style={{ width: `${crawlData.metricScores.aiVisibility}%` }}
                    ></div>
            </div>
          </div>
        </CardContent>
      </Card>
          </div>
        </>
      )}
    </main>
  );
} 