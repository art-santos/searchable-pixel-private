'use client'

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft, 
  ExternalLink, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  AlertTriangle,
  Info,
  Zap,
  Code,
  Search,
  Shield,
  Sparkles,
  Quote,
  Target,
  TrendingUp,
  BarChart3,
  PieChart,
  Eye,
  Brain,
  Globe,
  Users,
  FileText,
  Image,
  Link as LinkIcon,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import Link from 'next/link';
import { 
  getEnhancedSnapshots,
  getTechnicalIssues,
  getTechnicalRecommendations,
  getVisibilityResults,
  getTechnicalChecklistResults,
  getCombinedScore,
  calculateTechnicalScoreFromChecklist,
  type EnhancedSnapshotResult,
  type TechnicalIssue,
  type TechnicalRecommendation,
  type VisibilityResult,
  type TechnicalChecklistItem
} from '@/lib/api/enhanced-snapshots';
import { SnapshotReportSkeleton, SnapshotProcessingSkeleton } from '@/components/skeletons';

type TabType = 'visibility' | 'linkaudit';

// Helper functions for safe URL handling
const safeParseUrl = (url: string): URL | null => {
  try {
    // If URL doesn't have protocol, assume https
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    return new URL(url);
  } catch {
    return null;
  }
};

const getSafeHostname = (url: string): string => {
  const parsed = safeParseUrl(url);
  return parsed ? parsed.hostname : url;
};

const getSafeFaviconUrl = (url: string, size: number = 128): string => {
  try {
    const hostname = getSafeHostname(url);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=${size}`;
  } catch {
    return '/images/split-icon-black.svg';
  }
};

const getCompetitorFavicon = (name: string): string => {
  try {
    const cleanName = name.toLowerCase()
      .replace(/^(the\s+)?/, '')
      .replace(/\s+/g, '')
      .replace(/[^a-zA-Z0-9]/g, '');
    return `https://www.google.com/s2/favicons?domain=${cleanName}.com&sz=128`;
  } catch {
    return '/images/split-icon-black.svg';
  }
};

export default function EnhancedSnapshotReportPage() {
  const params = useParams();
  const snapshotId = params.id as string;
  const { user } = useAuth();

  // State management
  const [snapshot, setSnapshot] = useState<EnhancedSnapshotResult | null>(null);
  const [issues, setIssues] = useState<TechnicalIssue[]>([]);
  const [recommendations, setRecommendations] = useState<TechnicalRecommendation[]>([]);
  const [visibilityResults, setVisibilityResults] = useState<VisibilityResult[]>([]);
  const [checklistResults, setChecklistResults] = useState<TechnicalChecklistItem[]>([]);
  const [comprehensiveAudit, setComprehensiveAudit] = useState<any>(null);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('visibility');
  const [showCompletionBanner, setShowCompletionBanner] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Toggle expanded state for checklist items
  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Load comprehensive audit data
  const loadComprehensiveAudit = async (url: string, force = false) => {
    if (!force && (comprehensiveAudit || auditLoading)) return; // Don't reload if already loaded or loading
    
    setAuditLoading(true);
    setAuditError(null);
    
    try {
      console.log('🔍 Loading comprehensive audit for:', url);
      
      // First, try to retrieve existing data
      const retrieveResponse = await fetch(`/api/audit/retrieve?url=${encodeURIComponent(url)}`);
      
      if (retrieveResponse.ok) {
        const retrieveData = await retrieveResponse.json();
        
        if (retrieveData.exists && !force) {
          console.log('✅ Found existing comprehensive audit data');
          setComprehensiveAudit(retrieveData.data);
          return;
        }
      }
      
      // If no existing data or force refresh, run new audit
      console.log('🔄 Running new comprehensive audit...');
      
      const response = await fetch('/api/audit/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url,
          options: {
            includeContentAudit: true,
            waitFor: 3000,
            timeout: 45000
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const auditData = await response.json();
      console.log('✅ New comprehensive audit completed:', auditData);
      
      setComprehensiveAudit(auditData);
    } catch (error: any) {
      console.error('❌ Failed to load comprehensive audit:', error);
      setAuditError(error.message || 'Failed to load comprehensive audit');
    } finally {
      setAuditLoading(false);
    }
  };

  // Get fix suggestions for checklist items
  const getFixSuggestion = (checkName: string, details: string, passed: boolean): string => {
    const name = checkName.toLowerCase();
    
    // If the check passed, return positive message
    if (passed) {
      if (name.includes('meta description')) {
        return 'Perfect! Your meta description is properly configured and within the optimal length range. This helps search engines understand your page content.';
      }
      if (name.includes('title')) {
        return 'Excellent! Your page title is optimized for search engines and users. Keep using descriptive titles with relevant keywords.';
      }
      if (name.includes('h1')) {
        return 'Great job! Your H1 tag is properly implemented. This provides clear page structure and helps with SEO.';
      }
      if (name.includes('image') && name.includes('alt')) {
        return 'Well done! Your images have proper alt text. This improves accessibility and helps search engines understand your content.';
      }
      if (name.includes('https')) {
        return 'Secure connection confirmed! Your site uses HTTPS, which builds user trust and is favored by search engines.';
      }
      if (name.includes('canonical')) {
        return 'Perfect! Canonical tags are properly set up, preventing duplicate content issues and consolidating link equity.';
      }
      // Generic positive message for other passed checks
      return 'All good here! This optimization is properly implemented and working as expected. No changes needed.';
    }
    
    // Fix suggestions for failed checks
    if (name.includes('meta description')) {
      return 'Add a compelling meta description between 120-160 characters. Write it like ad copy - describe what users will find on your page and include your main keyword naturally. Example: "Learn how to optimize your website for search engines with our comprehensive SEO guide. Improve rankings, drive traffic, and boost conversions today."';
    }
    if (name.includes('title')) {
      return 'Optimize your page title to 50-60 characters with your main keyword near the beginning. Make it descriptive and compelling for both search engines and users. Include your brand name at the end. Example: "Complete SEO Guide 2024: Boost Rankings & Traffic | YourBrand"';
    }
    if (name.includes('h1')) {
      return 'Add a clear, descriptive H1 tag that includes your main keyword and tells users what the page is about. Only use one H1 per page. Example: <h1>Complete Guide to Search Engine Optimization in 2024</h1>. Make sure it\'s unique and matches the page content.';
    }
    if (name.includes('image') && name.includes('alt')) {
      return 'Add descriptive alt text to all images for accessibility and SEO. Describe what\'s in the image naturally, include relevant keywords when appropriate, and keep it under 125 characters. Example: alt="Modern office workspace with laptop showing analytics dashboard". Don\'t use "image of" or "picture of".';
    }
    if (name.includes('loading') || name.includes('speed')) {
      return 'Improve page loading speed by optimizing images (use WebP format, compress files), minifying CSS/JS, enabling compression, using a CDN, and optimizing server response times. Aim for under 3 seconds load time. Use Google PageSpeed Insights to identify specific issues.';
    }
    if (name.includes('mobile') || name.includes('responsive')) {
      return 'Ensure your site is fully responsive and mobile-friendly. Test on various devices, use responsive design principles, ensure touch targets are at least 44px, and make sure content fits without horizontal scrolling. Use Google\'s Mobile-Friendly Test to verify.';
    }
    if (name.includes('viewport')) {
      return 'Add a viewport meta tag for mobile optimization: <meta name="viewport" content="width=device-width, initial-scale=1.0" />. This ensures your page displays correctly on mobile devices and is required for mobile-first indexing. Place it in your <head> section.';
    }
    if (name.includes('favicon')) {
      return 'Add a favicon to improve brand recognition and professionalism. Create a 32x32 pixel .ico file and place it in your root directory, or use <link rel="icon" type="image/x-icon" href="/favicon.ico" />. Also consider adding Apple touch icons and other sizes for better cross-platform support.';
    }
    if (name.includes('https')) {
      return 'Migrate to HTTPS immediately. Obtain an SSL certificate from your hosting provider (many offer free Let\'s Encrypt certificates), update all internal links to use https://, set up 301 redirects from HTTP to HTTPS, and update your sitemap. HTTPS is a ranking factor and required for user trust.';
    }
    if (name.includes('sitemap')) {
      return 'Create and submit an XML sitemap to help search engines discover your content. Generate one automatically with your CMS or SEO plugin, include all important pages, update it regularly, and submit it via Google Search Console and Bing Webmaster Tools. Limit to 50,000 URLs per sitemap file.';
    }
    if (name.includes('structured data') || name.includes('schema')) {
      return 'Implement JSON-LD structured data to help search engines understand your content better. Use Google\'s Structured Data Markup Helper or Schema.org to find relevant schemas. Common types include Article, Product, LocalBusiness, FAQ, and BreadcrumbList. Test with Google\'s Rich Results Test tool.';
    }
    if (name.includes('breadcrumb')) {
      return 'Add breadcrumb navigation with proper schema markup. Create a logical hierarchy (Home > Category > Subcategory > Page), use schema.org/BreadcrumbList markup, and style them clearly for users. This improves UX and can generate rich snippets in search results.';
    }
    if (name.includes('loading') || name.includes('lazy')) {
      return 'Implement lazy loading for images below the fold to improve Core Web Vitals. Add loading="lazy" to img tags that aren\'t immediately visible. Ensure above-the-fold images use loading="eager" or no attribute. Consider using next-gen formats like WebP and proper image sizing.';
    }
    if (name.includes('word count')) {
      return 'Expand your content to at least 300-500 words minimum. Add detailed explanations, examples, case studies, FAQs, or related subtopics. Focus on providing comprehensive value rather than just hitting a word count. Structure content with headings, bullet points, and short paragraphs for readability.';
    }
    if (name.includes('broken link')) {
      return 'Audit and fix all broken links immediately. Use tools like Google Search Console, Screaming Frog, or online broken link checkers. Either fix the URLs, redirect them to relevant pages with 301 redirects, or remove the links entirely. Broken links hurt user experience and can impact SEO.';
    }
    if (name.includes('open graph') || name.includes('og:')) {
      return 'Add Open Graph meta tags for better social media sharing. Include og:title, og:description, og:image (1200x630px), og:url, and og:type. This controls how your content appears when shared on Facebook, LinkedIn, and other platforms, improving click-through rates.';
    }
    if (name.includes('twitter card')) {
      return 'Implement Twitter Card meta tags for enhanced Twitter sharing. Add twitter:card (summary_large_image), twitter:title, twitter:description, and twitter:image. Use the Twitter Card Validator to test your implementation and ensure optimal presentation.';
    }
    if (name.includes('lang') && name.includes('html')) {
      return 'Add a language attribute to your HTML tag: <html lang="en"> (or your appropriate language code). This helps screen readers, translation tools, and search engines understand your content language. Use ISO 639-1 language codes for best compatibility.';
    }
    if (name.includes('contrast') || name.includes('accessibility')) {
      return 'Improve color contrast to meet WCAG AA standards (4.5:1 ratio for normal text, 3:1 for large text). Use tools like WebAIM\'s Contrast Checker, ensure text is readable against backgrounds, and consider users with visual impairments. This improves accessibility and user experience.';
    }
    
    // Generic fallback with more detail
    return `This optimization needs attention: ${details}. Research best practices for this specific element, consult documentation, or work with a developer to implement proper fixes. Consider the impact on both user experience and search engine optimization.`;
  };

  // Load all data
  useEffect(() => {
    if (snapshotId && user?.id) {
      loadSnapshotData();
    }
  }, [snapshotId, user?.id]);

  // Auto-refresh for pending/processing snapshots
  useEffect(() => {
    if (snapshot && (snapshot.status === 'pending' || snapshot.status === 'processing')) {
      const interval = setInterval(() => {
        loadSnapshotData();
      }, 3000); // Refresh every 3 seconds

      return () => clearInterval(interval);
    }
  }, [snapshot?.status]);

  // Show completion banner when snapshot completes
  useEffect(() => {
    if (snapshot?.status === 'completed' && !showCompletionBanner) {
      setShowCompletionBanner(true);
      // Hide banner after 5 seconds
      const timer = setTimeout(() => {
        setShowCompletionBanner(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [snapshot?.status]);

  const loadSnapshotData = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        setError('Please sign in to view snapshots');
        return;
      }
      
      const snapshots = await getEnhancedSnapshots(user.id);
      const targetSnapshot = snapshots.find(s => s.id === snapshotId);
      
      if (!targetSnapshot) {
        setError('Snapshot not found');
        return;
      }
      
      setSnapshot(targetSnapshot);
      
      // Load additional data if completed
      if (targetSnapshot.status === 'completed' && targetSnapshot.url) {
        try {
          // Load traditional data and comprehensive audit in parallel
          const [issuesData, recsData, visData, checklistData] = await Promise.all([
            getTechnicalIssues(targetSnapshot.url).catch(() => []),
            getTechnicalRecommendations(targetSnapshot.url).catch(() => []),
            getVisibilityResults(snapshotId).catch(() => []),
            getTechnicalChecklistResults(targetSnapshot.url).catch(() => [])
          ]);
          
          setIssues(issuesData);
          setRecommendations(recsData);
          setVisibilityResults(visData);
          setChecklistResults(checklistData);
          
          // Debug checklist data
          console.log('Checklist data loaded:', {
            url: targetSnapshot.url,
            checklistCount: checklistData.length,
            passed: checklistData.filter(c => c.passed).length,
            failed: checklistData.filter(c => !c.passed).length,
            categories: [...new Set(checklistData.map(c => c.category))],
            sample: checklistData.slice(0, 5)
          });

          // Start comprehensive audit automatically for completed snapshots
          console.log('🚀 Starting comprehensive audit automatically for completed snapshot');
          loadComprehensiveAudit(targetSnapshot.url, false);
          
        } catch (dataError) {
          console.error('Error loading additional data:', dataError);
          // Continue anyway - we have the main snapshot data
        }
      }
    } catch (err: any) {
      console.error('Error loading snapshot data:', err);
      setError(err.message || 'Failed to load snapshot data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-3 h-3 text-gray-500" />;
      case 'processing':
        return <div className="w-3 h-3 animate-spin rounded-full border border-gray-500 border-t-transparent" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-emerald-500" />;
      case 'failed':
        return <XCircle className="w-3 h-3 text-red-500" />;
      default:
        return <AlertCircle className="w-3 h-3 text-gray-500" />;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-3 h-3 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-3 h-3 text-amber-500" />;
      case 'info':
        return <Info className="w-3 h-3 text-gray-500" />;
      default:
        return null;
    }
  };

  const getEffortBadge = (effort: string) => {
    switch (effort) {
      case 'low':
        return <span className="px-1.5 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Low</span>;
      case 'medium':
        return <span className="px-1.5 py-0.5 text-xs rounded-full bg-amber-50 text-amber-700 border border-amber-200">Med</span>;
      case 'high':
        return <span className="px-1.5 py-0.5 text-xs rounded-full bg-red-50 text-red-700 border border-red-200">High</span>;
      default:
        return <span className="px-1.5 py-0.5 text-xs rounded-full bg-gray-50 text-gray-600 border border-gray-200">-</span>;
    }
  };

  const getGradeBadge = (grade: string) => {
    const colors = {
      'A': 'bg-emerald-500 text-white',
      'B': 'bg-blue-500 text-white', 
      'C': 'bg-amber-500 text-white',
      'D': 'bg-orange-500 text-white',
      'F': 'bg-red-500 text-white'
    };
    return colors[grade as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  // Progress Bar Component
  const ProgressBar = ({ value, max = 100, className = '' }: { value: number, max?: number, className?: string }) => (
    <div className={`w-full bg-gray-200 rounded-full h-1.5 ${className}`}>
      <div 
        className="bg-gray-900 rounded-full h-1.5 transition-all duration-300"
        style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
      />
    </div>
  );

  if (loading) {
    return <SnapshotReportSkeleton />
  }

  if (error || !snapshot) {
    return (
      <div className="min-h-screen bg-[#f9f9f9] flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-8 h-8 text-gray-500 mx-auto mb-3" />
          <h1 className="text-lg font-medium text-gray-900 mb-2">Snapshot not found</h1>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <Link
            href="/dashboard/snapshot"
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Snapshots
          </Link>
        </div>
      </div>
    );
  }

  // Calculate initial combined score
  let combinedScore = snapshot.status === 'completed' ? getCombinedScore(snapshot, checklistResults) : null;

  return (
    <main className="min-h-screen bg-[#f9f9f9]">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard/snapshot"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Return to snapshots</span>
          </Link>
        </div>

        {/* Completion Banner */}
        {showCompletionBanner && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6 animate-in slide-in-from-top duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <div>
                  <div className="text-emerald-700 font-medium text-sm">Snapshot Complete!</div>
                  <div className="text-emerald-600 text-xs">Your analysis is ready to view</div>
                </div>
              </div>
              <button
                onClick={() => setShowCompletionBanner(false)}
                className="text-emerald-500 hover:text-emerald-700 transition-colors"
              >
                <span className="sr-only">Dismiss</span>
                ×
              </button>
            </div>
          </div>
        )}

        {/* Processing States */}
        {snapshot.status !== 'completed' && (
          <div className="space-y-6">
            {/* URL and Status Header */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                {getStatusIcon(snapshot.status)}
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                    {snapshot.status === 'pending' ? 'Queued' : 
                     snapshot.status === 'processing' ? 'Processing' : 
                     snapshot.status === 'failed' ? 'Failed' : 'Unknown'}
                </span>
              </div>
                {(snapshot.status === 'pending' || snapshot.status === 'processing') && (
                  <div className="text-xs text-gray-400">
                    Auto-refreshing every 3 seconds...
            </div>
                )}
            </div>
              
              {/* URL Display */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src={getSafeFaviconUrl(snapshot.url)}
                    alt=""
                    className="w-4 h-4 rounded"
                  />
                  <div className="text-gray-500 text-sm font-mono">{snapshot.url}</div>
                </div>
                <div className="text-gray-400 text-xs uppercase tracking-wider mb-1">Topic</div>
                <div className="inline-flex items-center px-3 py-1 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
                  {snapshot.topic}
          </div>
        </div>

              {/* Processing Steps */}
            {snapshot.status === 'processing' && (
                <SnapshotProcessingSkeleton />
              )}

              {snapshot.status === 'pending' && (
                <div className="text-center py-4">
                  <Clock className="w-6 h-6 text-gray-500 mx-auto mb-2" />
                  <div className="text-gray-900 font-medium mb-1">Queued for Processing</div>
                  <div className="text-gray-500 text-sm">Your snapshot will begin processing shortly</div>
          </div>
        )}

              {snapshot.status === 'failed' && (
                <div className="text-center py-4">
                  <XCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                  <div className="text-gray-900 font-medium mb-1">Processing Failed</div>
                  <div className="text-gray-500 text-sm">An error occurred during processing. Please try again.</div>
                </div>
              )}
              </div>
              
            {/* Use the consistent light skeleton component */}
            {(snapshot.status === 'pending' || snapshot.status === 'processing') && (
              <div className="pt-6">
                <SnapshotReportSkeleton />
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {snapshot.status === 'completed' && combinedScore && (
          <div className="space-y-6">
            {/* Combined Score Overview */}
            <div className="py-8">
              <div className="grid grid-cols-12 gap-12 items-center">
                {/* Left: Circular Score Display (30% width) */}
                <div className="col-span-12 lg:col-span-4 flex items-center justify-center">
                                      {(() => {
                      // Use the new weighting: 40% visibility + 60% link audit for consistency
                      const displayScore = Math.round((snapshot.visibility_score * 0.4) + ((snapshot.calculated_technical_score || snapshot.weighted_aeo_score || snapshot.aeo_score || 0) * 0.6));
                      
                      return (
                      <div className="relative w-64 h-64">
                        {/* Circular Progress Background */}
                        <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            className="text-gray-200"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 40}`}
                            strokeDashoffset={`${2 * Math.PI * 40 * (1 - displayScore / 100)}`}
                            className="text-gray-900 transition-all duration-700 ease-out"
                          />
                        </svg>
                        {/* Score Text */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-5xl font-bold text-gray-900">{displayScore}%</div>
                      </div>
                      </div>
                      </div>
                    );
                  })()}
                    </div>
              
                {/* Right: Site Information & Breakdown (70% width) */}
                <div className="col-span-12 lg:col-span-8 space-y-6">
                <div>
                    <a 
                      href={snapshot.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-4 group"
                    >
                      <img
                        src={getSafeFaviconUrl(snapshot.url)}
                        alt=""
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm">{snapshot.url}</span>
                      <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                    </a>
                    
                    <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">SITE TITLE</div>
                    <h2 className="text-3xl font-semibold text-gray-900 mb-4">
                      {snapshot.site_title || 'No title available'}
                    </h2>
                    
                    <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">META DESCRIPTION</div>
                    <div className="text-gray-400 text-sm mb-4 leading-relaxed">
                      {snapshot.meta_description || 'No meta description available'}
                  </div>

                    <div className="inline-flex items-center px-3 py-1 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700">
                      {snapshot.topic}
                            </div>
                          </div>

                  {/* Breakdown Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {(() => {
                      // Use same technical score as preview cards
                      const technicalScore = snapshot.calculated_technical_score || snapshot.weighted_aeo_score || snapshot.aeo_score || 0;
                      
                      return (
                        <>
                <div>
                            <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">AI Visibility</div>
                            <div className="text-2xl font-semibold text-gray-900">{snapshot.visibility_score}</div>
                        </div>
                          
                          <div>
                            <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">Link Audit</div>
                            <div className="text-2xl font-semibold text-gray-900">
                              {comprehensiveAudit?.pageScore || technicalScore}
                            </div>
                    </div>
              
                          <div>
                            <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">Issues Found</div>
                            <div className="text-2xl font-semibold text-gray-900">{issues.length}</div>
                  </div>

                          <div>
                            <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">Competitors</div>
                            <div className="text-2xl font-semibold text-gray-900">{snapshot.top_competitors.length}</div>
                              </div>
                        </>
                      );
                    })()}
                            </div>
                          </div>
                      </div>
                    </div>

            {/* Scraping Error Alert */}
            {snapshot.scrape_success === false && snapshot.scrape_error && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-amber-400 font-medium text-sm mb-1">Website Scraping Issue</h3>
                    <p className="text-amber-200/80 text-sm mb-2">
                      Technical audit data may be incomplete due to scraping errors. AI visibility results remain accurate.
                    </p>
                    <details className="text-amber-200/70 text-xs">
                      <summary className="cursor-pointer">Error Details</summary>
                      <p className="mt-1 font-mono">{snapshot.scrape_error}</p>
                    </details>
                        </div>
                    </div>
                  </div>
            )}

            {/* Tab Navigation */}
            <div className="border border-gray-200 rounded-lg p-1 bg-white shadow-sm">
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => setActiveTab('visibility')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'visibility'
                      ? 'bg-gray-900 text-white border border-gray-700'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span>AI Visibility</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('linkaudit');
                    // Only load audit if it hasn't been started yet (fallback)
                    if (snapshot?.url && !comprehensiveAudit && !auditLoading) {
                      loadComprehensiveAudit(snapshot.url);
                    }
                  }}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'linkaudit'
                      ? 'bg-gray-900 text-white border border-gray-700'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <LinkIcon className="w-4 h-4" />
                  <span>Link Audit</span>
                  {auditLoading ? (
                    <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin ml-2"></div>
                  ) : (
                    <span className="px-1.5 py-0.5 text-xs rounded-sm bg-blue-50 text-blue-700 border border-blue-200 ml-1">
                      New
                    </span>
                  )}
                </button>
                      </div>
                    </div>

              {/* AI Visibility Tab */}
              {activeTab === 'visibility' && (
              <div className="space-y-12">
                {/* Visibility Overview */}
                <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-sm">
                  <div className="grid grid-cols-12 gap-8 items-center">
                    <div className="col-span-12 lg:col-span-5">
                      <div>
                        <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">AI Visibility Performance</div>
                        <div className="text-6xl font-bold text-gray-900 mb-3">{snapshot.visibility_score}<span className="text-2xl text-gray-400">%</span></div>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          Your content's visibility across AI search engines and how well it competes for attention in your topic area.
                        </p>
                      </div>
                    </div>
                    
                    <div className="col-span-12 lg:col-span-7">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <div className="text-gray-500 text-xs uppercase tracking-wider mb-3">Coverage Analysis</div>
                          <div className="text-3xl font-bold text-gray-900 mb-2">{snapshot.mentions_count}</div>
                          <div className="text-gray-500 text-sm mb-3">of {snapshot.total_questions} questions</div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div 
                              className="bg-gray-900 h-1 rounded-full transition-all duration-300" 
                              style={{ width: `${(snapshot.mentions_count / snapshot.total_questions) * 100}%` }}
                            />
                    </div>
                  </div>

                        <div>
                          <div className="text-gray-500 text-xs uppercase tracking-wider mb-3">Competitive Landscape</div>
                          <div className="text-3xl font-bold text-gray-900 mb-2">{snapshot.top_competitors.length}</div>
                          <div className="text-gray-400 text-sm mb-3">competing sources found</div>
                          <div className="flex items-center gap-2">
                            {snapshot.top_competitors.slice(0, 4).map((competitor, index) => {
                              return (
                                <img
                                  key={index}
                                  src={getCompetitorFavicon(competitor)}
                                  alt=""
                                  className="w-4 h-4 rounded opacity-60"
                                />
                              );
                            })}
                            {snapshot.top_competitors.length > 4 && (
                              <span className="text-gray-500 text-xs">+{snapshot.top_competitors.length - 4} more</span>
                                )}
                              </div>
                            </div>
                              </div>
                      </div>
                    </div>
                          </div>
                          
                {/* Detailed Visibility Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* All Visibility Results */}
                  <div>
                    <div className="flex items-center gap-3 mb-8">
                      <h2 className="text-xl font-semibold text-gray-900">Question Analysis</h2>
                                    </div>
                    
                    <div className="space-y-6 max-h-[64rem] overflow-y-auto pr-2">
                      {visibilityResults.map((result) => (
                        <div key={result.id} className="border-l-2 border-gray-200 pl-6 pb-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <span className="text-gray-600 text-xs font-mono bg-gray-100 px-2 py-1 rounded">Q{result.question_number}</span>
                                {result.target_found ? (
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                                )}
                            {result.position && (
                                <span className="px-2 py-1 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Position #{result.position}
                                </span>
                              )}
                            </div>
                            <span className={`px-3 py-1 text-xs rounded-full border ${
                              result.target_found ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {result.target_found ? 'Found' : 'Missing'}
                            </span>
                                </div>
                                
                          <h4 className="text-gray-900 text-sm font-medium mb-4 leading-relaxed">{result.question_text}</h4>
                          
                          {result.citation_snippet && (
                            <div className="mb-4">
                              <div className="text-gray-600 text-xs leading-relaxed pl-4 border-l border-gray-300 mb-4">
                                    {result.citation_snippet}
                                </div>
                                  
                                  {/* Citation Links */}
                                  {result.top_citations && result.top_citations.length > 0 && (
                                <div className="pl-4 space-y-2">
                                  <div className="text-gray-500 text-xs font-medium">Sources:</div>
                                  {result.top_citations.map((citation, index) => {
                                          return (
                                            <a
                                              key={index}
                                              href={citation.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors group py-1"
                                            >
                                              <div className="flex-shrink-0">
                                                <img
                                                  src={getSafeFaviconUrl(citation.url)}
                                                  alt=""
                                            className="w-3 h-3 rounded"
                                                />
                                              </div>
                                        <span className="text-xs truncate flex-1">
                                                {citation.title || getSafeHostname(citation.url)}
                                              </span>
                                        <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100 ml-auto flex-shrink-0" />
                                            </a>
                                          );
                                        })}
                                    </div>
                                  )}
                            </div>
                          )}
                          
                          {result.competitor_names.length > 0 && (
                            <div className="flex flex-wrap gap-2 text-xs mb-4">
                              <span className="text-gray-500">Also mentioned:</span>
                              {result.competitor_names.map((comp, i) => (
                                <span key={i} className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                                  {comp}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {result.reasoning_summary && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="text-gray-500 text-xs font-medium mb-2">Analysis:</div>
                              <p className="text-gray-400 text-xs leading-relaxed">{result.reasoning_summary}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column - Competitors & Insights */}
                  <div className="space-y-12">
                    {/* Competitor Analysis */}
                    {snapshot.top_competitors.length > 0 && (
                      <div>
                        <div className="flex items-center gap-3 mb-8">
                          <h2 className="text-xl font-semibold text-gray-900">Top Competitors</h2>
                </div>
                        <div className="space-y-4">
                          {(() => {
                            // Calculate mention rates for all competitors and sort by highest rate
                            const competitorsWithRates = snapshot.top_competitors.map(competitor => {
                              // Filter to only category questions (exclude comparison queries)
                              const categoryResults = visibilityResults.filter(result => {
                                const questionText = result.question_text.toLowerCase();
                                const isComparisonQuery = questionText.includes(' vs ') || 
                                                        questionText.includes(' versus ') ||
                                                        questionText.includes('compared to') ||
                                                        questionText.includes('alternative') ||
                                                        questionText.includes('alternatives') ||
                                                        questionText.includes('competitor') ||
                                                        questionText.includes('competitors') ||
                                                        questionText.includes('or ') ||
                                                        questionText.includes('better than') ||
                                                        questionText.includes('different from');
                                return !isComparisonQuery;
                              });
                              
                              const mentionCount = categoryResults.filter(result => 
                                result.competitor_names.includes(competitor)
                              ).length;
                              const mentionRate = categoryResults.length > 0 ? Math.round((mentionCount / categoryResults.length) * 100) : 0;
                              return { name: competitor, mentionRate, mentionCount };
                            });

                            // Sort by mention rate (highest first) and take top 5
                            const topCompetitors = competitorsWithRates
                              .sort((a, b) => b.mentionRate - a.mentionRate)
                              .slice(0, 5);

                            return topCompetitors.map((competitor, index) => (
                              <div key={competitor.name} className="flex items-center gap-4 py-3 border-b border-gray-200 last:border-b-0">
                                <div className="w-6 h-6 bg-gray-100 rounded text-gray-700 text-xs flex items-center justify-center font-mono border border-gray-200">
                                  {index + 1}
                                </div>
                                <img
                                  src={getCompetitorFavicon(competitor.name)}
                                  alt=""
                                  className="w-4 h-4 rounded"
                                />
                                <div className="flex-1">
                                  <div className="text-gray-900 text-sm font-medium">{competitor.name}</div>
                                </div>
                      <div className="text-right">
                                  <div className="text-gray-900 text-sm font-semibold">{competitor.mentionRate}%</div>
                                  <div className="text-gray-500 text-xs">mention rate</div>
                      </div>
                    </div>
                            ));
                          })()}
                        </div>
                      </div>
                    )}

                    {/* Top Citation Sources */}
                    <div>
                      <div className="flex items-center gap-3 mb-8">
                        <h2 className="text-xl font-semibold text-gray-900">Top Citation Sources</h2>
                      </div>
                    <div className="space-y-4">
                        {(() => {
                          // Extract and analyze all citations
                          const allCitations: Array<{url: string, title?: string}> = [];
                          visibilityResults.forEach(result => {
                            if (result.top_citations && result.top_citations.length > 0) {
                              result.top_citations.forEach((citation: any) => {
                                allCitations.push(citation);
                              });
                            }
                          });

                          // Group citations by domain and count frequencies
                          const domainCounts: {[key: string]: {domain: string, count: number, sampleTitle: string, sampleUrl: string}} = {};
                          allCitations.forEach(citation => {
                            const domain = getSafeHostname(citation.url).toLowerCase().replace('www.', '');
                            
                            if (domain && domain !== citation.url) { // Only process if we got a valid domain
                              if (!domainCounts[domain]) {
                                domainCounts[domain] = {
                                  domain,
                                  count: 0,
                                  sampleTitle: citation.title || domain,
                                  sampleUrl: citation.url
                                };
                              }
                              domainCounts[domain].count++;
                            }
                          });

                          // Sort by citation count and take top 5
                          const topSources = (Object.values(domainCounts) as Array<{domain: string, count: number, sampleTitle: string, sampleUrl: string}>)
                            .sort((a, b) => b.count - a.count)
                            .slice(0, 5);

                          if (topSources.length === 0) {
                            return (
                              <div className="text-center py-8 text-gray-500">
                                <Sparkles className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                                <p className="text-sm">No citation sources available</p>
                                </div>
                            );
                          }

                          return topSources.map((source, index) => {
                            return (
                              <div key={source.domain} className="flex items-center gap-4 py-3 border-b border-gray-200 last:border-b-0">
                                <div className="w-6 h-6 bg-gray-100 rounded text-gray-700 text-xs flex items-center justify-center font-mono border border-gray-200">
                                  {index + 1}
                                  </div>
                                <img
                                  src={getSafeFaviconUrl(source.domain)}
                                  alt=""
                                  className="w-4 h-4 rounded"
                                  onError={(e) => {
                                    e.currentTarget.src = '/images/split-icon-white.svg';
                                  }}
                                />
                              <div className="flex-1">
                                  <div className="text-gray-900 text-sm font-medium">{source.domain}</div>
                                  <div className="text-gray-500 text-xs truncate">{source.sampleTitle}</div>
                              </div>
                                <div className="text-right">
                                  <div className="text-gray-900 text-sm font-semibold">{source.count}</div>
                                  <div className="text-gray-500 text-xs">citations</div>
                            </div>
                          </div>
                            );
                          });
                        })()}
                        </div>
                    </div>

                    {/* Position Analysis */}
                    <div>
                      <div className="flex items-center gap-3 mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">Position Performance</h2>
                  </div>
                      
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-gray-600 text-sm leading-relaxed">
                          This analysis tracks where your content appears in AI search results for questions related to your topic, 
                          showing your competitive position against other sources.
                        </p>
                </div>

                <div className="space-y-6">
                        {(() => {
                          // Use all visibility results for consistency
                          const allResults = visibilityResults;

                          return (
                            <>
                              <div className="border-l-2 border-gray-200 pl-6">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-gray-500 text-sm">Top 3 Positions</span>
                                  <span className="text-gray-900 text-2xl font-bold">
                                    {allResults.filter(r => r.position && r.position <= 3).length}
                              </span>
                            </div>
                                <div className="w-full bg-gray-200 rounded-full h-1 mb-2">
                                  <div 
                                    className="bg-gray-900 h-1 rounded-full transition-all duration-300" 
                                    style={{ width: `${allResults.length > 0 ? (allResults.filter(r => r.position && r.position <= 3).length / allResults.length) * 100 : 0}%` }}
                                  />
                            </div>
                                <div className="text-gray-500 text-xs">
                                  of {allResults.length} queries
                                </div>
                              </div>
                              
                              <div className="border-l-2 border-gray-200 pl-6">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-gray-500 text-sm">Top 5 Positions</span>
                                  <span className="text-gray-900 text-2xl font-bold">
                                    {allResults.filter(r => r.position && r.position <= 5).length}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1 mb-2">
                                  <div 
                                    className="bg-gray-900 h-1 rounded-full transition-all duration-300" 
                                    style={{ width: `${allResults.length > 0 ? (allResults.filter(r => r.position && r.position <= 5).length / allResults.length) * 100 : 0}%` }}
                                  />
                                </div>
                                <div className="text-gray-500 text-xs">
                                  of {allResults.length} queries
                                </div>
                              </div>
                              
                              <div className="border-l-2 border-gray-200 pl-6">
                            <div className="flex items-center justify-between">
                                  <span className="text-gray-500 text-sm">Average Position</span>
                                  <span className="text-gray-900 text-2xl font-bold">
                                    {allResults.filter(r => r.position).length > 0 
                                      ? Math.round(allResults.filter(r => r.position).reduce((sum, r) => sum + (r.position || 0), 0) / allResults.filter(r => r.position).length)
                                      : 'N/A'
                                    }
                                  </span>
                            </div>
                                <div className="text-gray-500 text-xs mt-2">
                                  across all queries
                          </div>
                      </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  </div>
                      </div>
                    )}

            {/* Link Audit Tab */}
            {activeTab === 'linkaudit' && (
              <div className="space-y-8">
                {/* Loading State */}
                {auditLoading && (
                  <div className="pt-6">
                    <SnapshotReportSkeleton />
                  </div>
                )}

                {/* Error State */}
                {auditError && !auditLoading && (
                  <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-sm">
                    <div className="text-center">
                      <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Audit Failed</h3>
                      <p className="text-gray-600 text-sm mb-4">{auditError}</p>
                      <button
                        onClick={() => {
                          if (snapshot?.url) {
                            setComprehensiveAudit(null);
                            loadComprehensiveAudit(snapshot.url);
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Retry Audit
                      </button>
                    </div>
                  </div>
                )}

                {/* Comprehensive Audit Results */}
                {comprehensiveAudit && !auditLoading && (
                  <>
                    {/* Overall Score Overview */}
                    <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-sm">
                      <div className="grid grid-cols-12 gap-8 items-center">
                        <div className="col-span-12 lg:col-span-5">
                          <div>
                            <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">Comprehensive Page Score</div>
                            <div className="text-6xl font-bold text-gray-900 mb-3">
                              {comprehensiveAudit.pageScore}<span className="text-2xl text-gray-400">%</span>
                            </div>
                            <p className="text-gray-600 text-sm leading-relaxed">
                              Combined technical and content analysis measuring SEO readiness, accessibility, and AI visibility optimization.
                            </p>
                          </div>
                        </div>
                        
                        <div className="col-span-12 lg:col-span-7">
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">Technical Score</div>
                              <div className="text-2xl font-semibold text-gray-900">
                                {comprehensiveAudit.debugData?.technicalScore || 'N/A'}%
                              </div>
                              <div className="text-gray-500 text-xs mt-1">Structure & Performance</div>
                            </div>
                            <div>
                              <div className="text-gray-500 text-xs uppercase tracking-wider mb-2">Content Score</div>
                              <div className="text-2xl font-semibold text-gray-900">
                                {comprehensiveAudit.contentAnalysis?.overallScore || 'N/A'}%
                              </div>
                              <div className="text-gray-500 text-xs mt-1">AI Content Quality</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Technical Analysis */}
                    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                      <h2 className="text-xl font-semibold text-gray-900 mb-6">Technical Analysis</h2>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column - SEO & Structure */}
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">SEO & Structure</h3>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600 text-sm">Meta Description</span>
                                <div className="flex items-center gap-2">
                                  {comprehensiveAudit.seoAnalysis.metaDescriptionPresent ? (
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                  )}
                                  <span className="text-gray-900 text-sm font-medium">
                                    {comprehensiveAudit.seoAnalysis.metaDescriptionPresent ? 'Present' : 'Missing'}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600 text-sm">H1 Heading</span>
                                <div className="flex items-center gap-2">
                                  {comprehensiveAudit.seoAnalysis.h1Present ? (
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                  )}
                                  <span className="text-gray-900 text-sm font-medium">
                                    {comprehensiveAudit.seoAnalysis.h1Count} found
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600 text-sm">Word Count</span>
                                <span className="text-gray-900 text-sm font-medium">
                                  {comprehensiveAudit.seoAnalysis.wordCount?.toLocaleString()} words
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600 text-sm">Heading Depth</span>
                                <span className="text-gray-900 text-sm font-medium">
                                  H1-H{comprehensiveAudit.seoAnalysis.headingDepth}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600 text-sm">Performance Score</span>
                                <span className="text-gray-900 text-sm font-medium">
                                  {comprehensiveAudit.performanceScore}%
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600 text-sm">HTML Size</span>
                                <span className="text-gray-900 text-sm font-medium">
                                  {comprehensiveAudit.htmlSizeKb} KB
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600 text-sm">DOM Complexity</span>
                                <span className="text-gray-900 text-sm font-medium">
                                  {comprehensiveAudit.technicalMetrics.domNodes?.toLocaleString()} nodes
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600 text-sm">SSR Rendered</span>
                                <div className="flex items-center gap-2">
                                  {comprehensiveAudit.ssrRendered ? (
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                  )}
                                  <span className="text-gray-900 text-sm font-medium">
                                    {comprehensiveAudit.ssrRendered ? 'Yes' : 'No'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Column - Links & Images */}
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Link Analysis</h3>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600 text-sm">Total Links</span>
                                <span className="text-gray-900 text-sm font-medium">
                                  {comprehensiveAudit.linkAnalysis.totalLinks}
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600 text-sm">Internal Links</span>
                                <span className="text-gray-900 text-sm font-medium">
                                  {comprehensiveAudit.linkAnalysis.internalLinkCount}
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600 text-sm">E-E-A-T Links</span>
                                <span className="text-gray-900 text-sm font-medium">
                                  {comprehensiveAudit.linkAnalysis.externalEeatLinks}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Image Analysis</h3>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600 text-sm">Total Images</span>
                                <span className="text-gray-900 text-sm font-medium">
                                  {comprehensiveAudit.imageAnalysis.totalImages}
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600 text-sm">Alt Text Coverage</span>
                                <span className="text-gray-900 text-sm font-medium">
                                  {comprehensiveAudit.imageAnalysis.imageAltPresentPercent}%
                                </span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Schema Analysis</h3>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600 text-sm">JSON-LD Valid</span>
                                <div className="flex items-center gap-2">
                                  {comprehensiveAudit.schemaAnalysis.jsonldValid ? (
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-500" />
                                  )}
                                  <span className="text-gray-900 text-sm font-medium">
                                    {comprehensiveAudit.schemaAnalysis.jsonldValid ? 'Yes' : 'No'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content Analysis (if available) */}
                    {comprehensiveAudit.contentAnalysis && (
                      <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">AI Content Analysis</h2>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {/* Content Quality Metrics */}
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Content Quality</h3>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600 text-sm">Overall Score</span>
                                <span className="text-gray-900 text-sm font-medium">
                                  {comprehensiveAudit.contentAnalysis.overallScore}/100
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600 text-sm">Paragraphs Analyzed</span>
                                <span className="text-gray-900 text-sm font-medium">
                                  {comprehensiveAudit.contentAnalysis.totalParagraphs}
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600 text-sm">Avg Clarity</span>
                                <span className="text-gray-900 text-sm font-medium">
                                  {comprehensiveAudit.contentAnalysis.avgClarity?.toFixed(1)}/5
                                </span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600 text-sm">Avg Authority</span>
                                <span className="text-gray-900 text-sm font-medium">
                                  {comprehensiveAudit.contentAnalysis.avgAuthority?.toFixed(1)}/5
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Red Flags & Issues */}
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Content Issues</h3>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600 text-sm">Red Flags</span>
                                <div className="flex items-center gap-2">
                                  {comprehensiveAudit.contentAnalysis.redFlagCount === 0 ? (
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                  ) : (
                                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                                  )}
                                  <span className="text-gray-900 text-sm font-medium">
                                    {comprehensiveAudit.contentAnalysis.redFlagCount} found
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600 text-sm">Red Flag Rate</span>
                                <span className="text-gray-900 text-sm font-medium">
                                  {comprehensiveAudit.contentAnalysis.redFlagPercentage?.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Key Takeaways */}
                        {comprehensiveAudit.contentAnalysis.keyTakeaways && comprehensiveAudit.contentAnalysis.keyTakeaways.length > 0 && (
                          <div className="mt-6 pt-6 border-t border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Key Content Recommendations</h3>
                            <div className="space-y-2">
                              {comprehensiveAudit.contentAnalysis.keyTakeaways.slice(0, 5).map((takeaway: string, index: number) => (
                                <div key={index} className="flex items-start gap-3">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <p className="text-gray-700 text-sm">{takeaway}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Recommendations */}
                    <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                      <h2 className="text-xl font-semibold text-gray-900 mb-6">Priority Recommendations</h2>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Technical Quick Win */}
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Technical Quick Win</h3>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <Zap className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                              <p className="text-blue-800 text-sm leading-relaxed">
                                {comprehensiveAudit.recommendations?.technicalQuickWin || 'No immediate technical issues found'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Priority Actions */}
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Priority Actions</h3>
                          <div className="space-y-2">
                            {comprehensiveAudit.recommendations?.priorityActions?.slice(0, 3).map((action: string, index: number) => (
                              <div key={index} className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                                <p className="text-gray-700 text-sm">{action}</p>
                              </div>
                            )) || (
                              <p className="text-gray-500 text-sm">No priority actions identified</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* No Audit Available */}
                {!comprehensiveAudit && !auditLoading && !auditError && (
                  <div className="bg-white rounded-lg p-8 border border-gray-200 shadow-sm">
                    <div className="text-center">
                      <LinkIcon className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Link Audit</h3>
                      <p className="text-gray-600 text-sm mb-4">
                        Comprehensive analysis automatically runs when your snapshot completes. This includes technical SEO, content quality, and AI optimization analysis.
                      </p>
                      <button
                        onClick={() => {
                          if (snapshot?.url) {
                            loadComprehensiveAudit(snapshot.url, true);
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Run Audit Now
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            </div>
        )}
      </div>
    </main>
  );
} 