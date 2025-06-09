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
  ChevronDown
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

type TabType = 'visibility' | 'technical';

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
    if (name.includes('title') && name.includes('length')) {
      return 'Optimize your page title to 30-60 characters (about 600 pixels). Put your primary keyword near the beginning, make it descriptive and compelling. Avoid keyword stuffing. Example: "SEO Guide 2024: Complete Website Optimization Tips" instead of "Website SEO Search Engine Optimization Guide Tips Tricks"';
    }
    if (name.includes('h1')) {
      return 'Add exactly one H1 tag per page that clearly describes your main topic. Make it descriptive, include your primary keyword naturally, and ensure it matches user intent. Place it prominently at the top of your content. Use H2-H6 for subheadings in hierarchical order.';
    }
    if (name.includes('image') && name.includes('alt')) {
      return 'Add descriptive alt text to all images. Describe what the image shows in 10-15 words, include context about how it relates to your content, and use keywords naturally when relevant. For decorative images, use alt="". Example: alt="Person typing on laptop showing SEO analytics dashboard"';
    }
    if (name.includes('canonical')) {
      return 'Add a canonical tag to prevent duplicate content issues. Place <link rel="canonical" href="https://yourdomain.com/page-url" /> in your <head> section. Use your preferred URL version (with or without www, trailing slash, etc.) and ensure it\'s an absolute URL.';
    }
    if (name.includes('robots')) {
      return 'Add a robots meta tag to control search engine crawling. Use <meta name="robots" content="index, follow" /> for pages you want indexed, or "noindex, nofollow" for pages you want to hide. You can also use specific directives like "noarchive" or "nosnippet" for more control.';
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
        const [issuesData, recsData, visData, checklistData] = await Promise.all([
          getTechnicalIssues(targetSnapshot.url),
          getTechnicalRecommendations(targetSnapshot.url),
          getVisibilityResults(snapshotId),
          getTechnicalChecklistResults(targetSnapshot.url)
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
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-3 h-3 text-zinc-500" />;
      case 'processing':
        return <div className="w-3 h-3 animate-spin rounded-full border border-zinc-500 border-t-transparent" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-emerald-500" />;
      case 'failed':
        return <XCircle className="w-3 h-3 text-red-500" />;
      default:
        return <AlertCircle className="w-3 h-3 text-zinc-500" />;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-3 h-3 text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-3 h-3 text-amber-400" />;
      case 'info':
        return <Info className="w-3 h-3 text-zinc-400" />;
      default:
        return null;
    }
  };

  const getEffortBadge = (effort: string) => {
    switch (effort) {
      case 'low':
        return <span className="px-1.5 py-0.5 text-xs rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">Low</span>;
      case 'medium':
        return <span className="px-1.5 py-0.5 text-xs rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">Med</span>;
      case 'high':
        return <span className="px-1.5 py-0.5 text-xs rounded-full bg-red-400/10 text-red-400 border border-red-400/20">High</span>;
      default:
        return <span className="px-1.5 py-0.5 text-xs rounded-full bg-zinc-400/10 text-zinc-400 border border-zinc-400/20">-</span>;
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
    return colors[grade as keyof typeof colors] || 'bg-zinc-500 text-white';
  };

  // Progress Bar Component
  const ProgressBar = ({ value, max = 100, className = '' }: { value: number, max?: number, className?: string }) => (
    <div className={`w-full bg-zinc-800 rounded-full h-1.5 ${className}`}>
      <div 
        className="bg-white rounded-full h-1.5 transition-all duration-300"
        style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
      />
    </div>
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0c0c0c]">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link
              href="/dashboard/snapshot"
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Return to snapshots</span>
            </Link>
      </div>

          {/* Loading State */}
          <div className="space-y-6">
            <div className="bg-zinc-900/20 border border-zinc-800 rounded-lg p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 animate-spin rounded-full border border-zinc-500 border-t-transparent" />
                  <span className="text-xs text-zinc-400 uppercase tracking-wider font-medium">Loading</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="w-72 h-4 bg-zinc-800 rounded animate-pulse"></div>
                <div className="w-48 h-6 bg-zinc-700 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Skeleton Results */}
            <div className="py-8">
              <div className="grid grid-cols-12 gap-12 items-center">
                <div className="col-span-12 lg:col-span-4 flex items-center justify-center">
                  <div className="relative w-64 h-64">
                    <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="none"
                        className="text-zinc-800"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 animate-spin rounded-full border border-zinc-600 border-t-transparent" />
                    </div>
                  </div>
                </div>
                
                <div className="col-span-12 lg:col-span-8 space-y-6">
                  <div className="space-y-4">
                    <div className="w-48 h-4 bg-zinc-800 rounded animate-pulse"></div>
                    <div className="w-3/4 h-8 bg-zinc-700 rounded animate-pulse"></div>
                    <div className="w-full h-4 bg-zinc-800 rounded animate-pulse"></div>
                    <div className="w-2/3 h-4 bg-zinc-800 rounded animate-pulse"></div>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i}>
                        <div className="w-20 h-3 bg-zinc-800 rounded animate-pulse mb-2"></div>
                        <div className="w-12 h-6 bg-zinc-700 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
          <h1 className="text-lg font-medium text-white mb-2">Snapshot not found</h1>
          <p className="text-zinc-500 text-sm mb-4">{error}</p>
          <Link
            href="/dashboard/snapshot"
            className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
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
    <main className="min-h-screen bg-[#0c0c0c]">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/dashboard/snapshot"
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Return to snapshots</span>
          </Link>
        </div>

        {/* Completion Banner */}
        {showCompletionBanner && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 mb-6 animate-in slide-in-from-top duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="text-emerald-400 font-medium text-sm">Snapshot Complete!</div>
                  <div className="text-emerald-200/80 text-xs">Your analysis is ready to view</div>
                </div>
              </div>
              <button
                onClick={() => setShowCompletionBanner(false)}
                className="text-emerald-400/60 hover:text-emerald-400 transition-colors"
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
            <div className="bg-zinc-900/20 border border-zinc-800 rounded-lg p-6">
              <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                {getStatusIcon(snapshot.status)}
                  <span className="text-xs text-zinc-400 uppercase tracking-wider font-medium">
                    {snapshot.status === 'pending' ? 'Queued' : 
                     snapshot.status === 'processing' ? 'Processing' : 
                     snapshot.status === 'failed' ? 'Failed' : 'Unknown'}
                </span>
              </div>
                {(snapshot.status === 'pending' || snapshot.status === 'processing') && (
                  <div className="text-xs text-zinc-500">
                    Auto-refreshing every 3 seconds...
            </div>
                )}
            </div>
              
              {/* URL Display */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${new URL(snapshot.url).hostname}&sz=128`}
                    alt=""
                    className="w-4 h-4 rounded"
                    onError={(e) => {
                      e.currentTarget.src = '/images/split-icon-white.svg';
                    }}
                  />
                  <div className="text-zinc-400 text-sm font-mono">{snapshot.url}</div>
                </div>
                <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Topic</div>
                <div className="inline-flex items-center px-3 py-1 bg-zinc-900 border border-zinc-800 rounded text-sm text-zinc-300">
                  {snapshot.topic}
          </div>
        </div>

              {/* Processing Steps */}
            {snapshot.status === 'processing' && (
                <div className="space-y-3">
                  <div className="text-zinc-400 text-sm font-medium mb-3">Processing Steps:</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm text-zinc-300">Page content scraped</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 animate-spin rounded-full border border-zinc-500 border-t-transparent" />
                      <span className="text-sm text-zinc-300">Running AI visibility tests</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-zinc-500" />
                      <span className="text-sm text-zinc-500">Technical health audit</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-zinc-500" />
                      <span className="text-sm text-zinc-500">Generating insights</span>
                    </div>
                  </div>
                </div>
              )}

              {snapshot.status === 'pending' && (
                <div className="text-center py-4">
                  <Clock className="w-6 h-6 text-zinc-500 mx-auto mb-2" />
                  <div className="text-white font-medium mb-1">Queued for Processing</div>
                  <div className="text-zinc-400 text-sm">Your snapshot will begin processing shortly</div>
          </div>
        )}

              {snapshot.status === 'failed' && (
                <div className="text-center py-4">
                  <XCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                  <div className="text-white font-medium mb-1">Processing Failed</div>
                  <div className="text-zinc-400 text-sm">An error occurred during processing. Please try again.</div>
                </div>
              )}
              </div>
              
            {/* Skeleton Results Preview */}
            {(snapshot.status === 'pending' || snapshot.status === 'processing') && (
              <div className="space-y-6">
                {/* Skeleton Score Overview */}
                <div className="py-8">
                  <div className="grid grid-cols-12 gap-12 items-center">
                    {/* Skeleton Circular Score */}
                    <div className="col-span-12 lg:col-span-4 flex items-center justify-center">
                      <div className="relative w-64 h-64">
                        <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            className="text-zinc-800"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 40}`}
                            strokeDashoffset={`${2 * Math.PI * 40 * 0.7}`}
                            className="text-zinc-700 animate-pulse"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-16 h-8 bg-zinc-700 rounded animate-pulse"></div>
                </div>
                        </div>
                </div>
              </div>
              
                    {/* Skeleton Site Info */}
                    <div className="col-span-12 lg:col-span-8 space-y-6">
                      <div>
                        <div className="w-48 h-4 bg-zinc-800 rounded animate-pulse mb-4"></div>
                        <div className="w-3/4 h-8 bg-zinc-700 rounded animate-pulse mb-4"></div>
                        <div className="w-full h-4 bg-zinc-800 rounded animate-pulse mb-2"></div>
                        <div className="w-2/3 h-4 bg-zinc-800 rounded animate-pulse mb-4"></div>
                        <div className="w-24 h-6 bg-zinc-800 rounded animate-pulse"></div>
            </div>

                      {/* Skeleton Breakdown Grid */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i}>
                            <div className="w-20 h-3 bg-zinc-800 rounded animate-pulse mb-2"></div>
                            <div className="w-12 h-6 bg-zinc-700 rounded animate-pulse"></div>
                    </div>
                        ))}
                  </div>
                </div>
              </div>
                </div>

                {/* Skeleton Tab Navigation */}
                <div className="border border-zinc-800 rounded-lg p-1 bg-zinc-900/30">
                  <div className="grid grid-cols-2 gap-1">
                    <div className="h-12 bg-zinc-800 rounded-lg animate-pulse"></div>
                    <div className="h-12 bg-zinc-800 rounded-lg animate-pulse"></div>
                  </div>
            </div>

                {/* Skeleton Content Area */}
            <div className="space-y-6">
                  <div className="bg-zinc-900/20 rounded-lg p-8">
                    <div className="grid grid-cols-12 gap-8">
                      <div className="col-span-12 lg:col-span-5 space-y-4">
                        <div className="w-32 h-4 bg-zinc-800 rounded animate-pulse"></div>
                        <div className="w-24 h-12 bg-zinc-700 rounded animate-pulse"></div>
                        <div className="w-full h-16 bg-zinc-800 rounded animate-pulse"></div>
                      </div>
                      <div className="col-span-12 lg:col-span-7">
                        <div className="grid grid-cols-2 gap-6">
                          {[1, 2].map((i) => (
                            <div key={i} className="space-y-3">
                              <div className="w-24 h-3 bg-zinc-800 rounded animate-pulse"></div>
                              <div className="w-16 h-8 bg-zinc-700 rounded animate-pulse"></div>
                              <div className="w-20 h-3 bg-zinc-800 rounded animate-pulse"></div>
                              <div className="w-full h-1 bg-zinc-800 rounded animate-pulse"></div>
                      </div>
                          ))}
                        </div>
                      </div>
                      </div>
                    </div>
                    
                  {/* Skeleton Results Cards */}
                  <div className="grid gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-zinc-900/20 border border-zinc-800 rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 bg-zinc-700 rounded animate-pulse flex-shrink-0"></div>
                          <div className="flex-1 space-y-3">
                            <div className="w-3/4 h-4 bg-zinc-700 rounded animate-pulse"></div>
                            <div className="w-full h-3 bg-zinc-800 rounded animate-pulse"></div>
                            <div className="w-1/2 h-3 bg-zinc-800 rounded animate-pulse"></div>
                      </div>
                          <div className="w-16 h-6 bg-zinc-800 rounded animate-pulse"></div>
                      </div>
                      </div>
                    ))}
                    </div>
                </div>
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
                      // Use the same calculation as preview cards for consistency
                      const displayScore = Math.round((snapshot.visibility_score * 0.6) + ((snapshot.calculated_technical_score || snapshot.weighted_aeo_score || snapshot.aeo_score || 0) * 0.4));
                      
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
                            className="text-zinc-800"
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
                            className="text-white transition-all duration-700 ease-out"
                          />
                        </svg>
                        {/* Score Text */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-5xl font-bold text-white">{displayScore}%</div>
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
                      className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4 group"
                    >
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${new URL(snapshot.url).hostname}&sz=128`}
                        alt=""
                        className="w-4 h-4 rounded"
                        onError={(e) => {
                          e.currentTarget.src = '/images/split-icon-white.svg';
                        }}
                      />
                      <span className="text-sm">{snapshot.url}</span>
                      <ExternalLink className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                    </a>
                    
                    <div className="text-zinc-500 text-xs uppercase tracking-wider mb-1">SITE TITLE</div>
                    <h2 className="text-3xl font-semibold text-white mb-4">
                      {snapshot.site_title || 'No title available'}
                    </h2>
                    
                    <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">META DESCRIPTION</div>
                    <div className="text-zinc-400 text-sm mb-4 leading-relaxed">
                      {snapshot.meta_description || 'No meta description available'}
                  </div>

                    <div className="inline-flex items-center px-3 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-300">
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
                            <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">AI Visibility</div>
                            <div className="text-2xl font-semibold text-white">{snapshot.visibility_score}</div>
                        </div>
                          
                          <div>
                            <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Technical Health</div>
                            <div className="text-2xl font-semibold text-white">{technicalScore}</div>
                    </div>
              
                          <div>
                            <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Issues Found</div>
                            <div className="text-2xl font-semibold text-white">{issues.length}</div>
                  </div>

                          <div>
                            <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Competitors</div>
                            <div className="text-2xl font-semibold text-white">{snapshot.top_competitors.length}</div>
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
            <div className="border border-zinc-800 rounded-lg p-1 bg-zinc-900/30">
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => setActiveTab('visibility')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'visibility'
                      ? 'bg-zinc-800 text-white border border-zinc-700'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span>AI Visibility</span>
                </button>
                <button
                  onClick={() => setActiveTab('technical')}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'technical'
                      ? 'bg-zinc-800 text-white border border-zinc-700'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Technical Health</span>
                </button>
                      </div>
                    </div>

              {/* AI Visibility Tab */}
              {activeTab === 'visibility' && (
              <div className="space-y-12">
                {/* Visibility Overview */}
                <div className="bg-zinc-900/20 rounded-lg p-8">
                  <div className="grid grid-cols-12 gap-8 items-center">
                    <div className="col-span-12 lg:col-span-5">
                      <div>
                        <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">AI Visibility Performance</div>
                        <div className="text-6xl font-bold text-white mb-3">{snapshot.visibility_score}<span className="text-2xl text-zinc-400">%</span></div>
                        <p className="text-zinc-400 text-sm leading-relaxed">
                          Your content's visibility across AI search engines and how well it competes for attention in your topic area.
                        </p>
                      </div>
                    </div>
                    
                    <div className="col-span-12 lg:col-span-7">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-3">Coverage Analysis</div>
                          <div className="text-3xl font-bold text-white mb-2">{snapshot.mentions_count}</div>
                          <div className="text-zinc-400 text-sm mb-3">of {snapshot.total_questions} questions</div>
                          <div className="w-full bg-zinc-800/30 rounded-full h-1">
                            <div 
                              className="bg-white h-1 rounded-full transition-all duration-300" 
                              style={{ width: `${(snapshot.mentions_count / snapshot.total_questions) * 100}%` }}
                            />
                    </div>
                  </div>

                        <div>
                          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-3">Competitive Landscape</div>
                          <div className="text-3xl font-bold text-white mb-2">{snapshot.top_competitors.length}</div>
                          <div className="text-zinc-400 text-sm mb-3">competing sources found</div>
                          <div className="flex items-center gap-2">
                            {snapshot.top_competitors.slice(0, 4).map((competitor, index) => {
                              const getCompetitorFavicon = (name: string) => {
                                try {
                                  const cleanName = name.toLowerCase()
                                    .replace(/^(the\s+)?/, '')
                                    .replace(/\s+/g, '')
                                    .replace(/[^a-zA-Z0-9]/g, '');
                                  return `https://www.google.com/s2/favicons?domain=${cleanName}.com&sz=128`;
                                } catch {
                                  return '/images/split-icon-white.svg';
                                }
                              };
                              
                              return (
                                <img
                                  key={index}
                                  src={getCompetitorFavicon(competitor)}
                                  alt=""
                                  className="w-4 h-4 rounded opacity-60"
                                  onError={(e) => {
                                    e.currentTarget.src = '/images/split-icon-white.svg';
                                  }}
                                />
                              );
                            })}
                            {snapshot.top_competitors.length > 4 && (
                              <span className="text-zinc-500 text-xs">+{snapshot.top_competitors.length - 4} more</span>
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
                      <h2 className="text-xl font-semibold text-white">Question Analysis</h2>
                                    </div>
                    
                    <div className="space-y-6 max-h-[64rem] overflow-y-auto pr-2">
                      {visibilityResults.map((result) => (
                        <div key={result.id} className="border-l-2 border-zinc-800/50 pl-6 pb-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <span className="text-zinc-500 text-xs font-mono bg-zinc-800/50 px-2 py-1 rounded">Q{result.question_number}</span>
                                {result.target_found ? (
                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                                )}
                            {result.position && (
                                <span className="px-2 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-400">
                                  Position #{result.position}
                                </span>
                              )}
                            </div>
                            <span className={`px-3 py-1 text-xs rounded-full ${
                              result.target_found ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                            }`}>
                              {result.target_found ? 'Found' : 'Missing'}
                            </span>
                                </div>
                                
                          <h4 className="text-white text-sm font-medium mb-4 leading-relaxed">{result.question_text}</h4>
                          
                          {result.citation_snippet && (
                            <div className="mb-4">
                              <div className="text-zinc-400 text-xs leading-relaxed pl-4 border-l border-zinc-700/50 mb-4">
                                    {result.citation_snippet}
                                </div>
                                  
                                  {/* Citation Links */}
                                  {result.top_citations && result.top_citations.length > 0 && (
                                <div className="pl-4 space-y-2">
                                  <div className="text-zinc-500 text-xs font-medium">Sources:</div>
                                  {result.top_citations.map((citation, index) => {
                                          const getFaviconUrl = (url: string) => {
                                            try {
                                              const domain = new URL(url).hostname;
                                              return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
                                            } catch {
                                              return '/images/split-icon-white.svg';
                                            }
                                          };

                                          return (
                                            <a
                                              key={index}
                                              href={citation.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors group py-1"
                                            >
                                              <div className="flex-shrink-0">
                                                <img
                                                  src={getFaviconUrl(citation.url)}
                                                  alt=""
                                            className="w-3 h-3 rounded"
                                                  onError={(e) => {
                                                    e.currentTarget.src = '/images/split-icon-white.svg';
                                                  }}
                                                />
                                              </div>
                                        <span className="text-xs truncate flex-1">
                                                {citation.title || new URL(citation.url).hostname}
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
                              <span className="text-zinc-500">Also mentioned:</span>
                              {result.competitor_names.map((comp, i) => (
                                <span key={i} className="px-2 py-1 rounded-full bg-zinc-800/30 text-zinc-400">
                                  {comp}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          {result.reasoning_summary && (
                            <div className="mt-4 pt-4 border-t border-zinc-800/30">
                              <div className="text-zinc-500 text-xs font-medium mb-2">Analysis:</div>
                              <p className="text-zinc-400 text-xs leading-relaxed">{result.reasoning_summary}</p>
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
                          <h2 className="text-xl font-semibold text-white">Top Competitors</h2>
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

                            const getCompetitorFavicon = (name: string) => {
                              // Try to construct a URL from the competitor name
                              try {
                                // Remove common prefixes and clean the name
                                const cleanName = name.toLowerCase()
                                  .replace(/^(the\s+)?/, '')
                                  .replace(/\s+/g, '')
                                  .replace(/[^a-zA-Z0-9]/g, '');
                                
                                // Try common domain patterns
                                const possibleDomains = [
                                  `${cleanName}.com`,
                                  `${cleanName}.ai`,
                                  `${cleanName}.io`,
                                  `${cleanName}.co`
                                ];
                                
                                // Use the first domain pattern for favicon
                                return `https://www.google.com/s2/favicons?domain=${possibleDomains[0]}&sz=128`;
                              } catch {
                                return '/images/split-icon-white.svg';
                              }
                            };

                            return topCompetitors.map((competitor, index) => (
                              <div key={competitor.name} className="flex items-center gap-4 py-3 border-b border-zinc-800/30 last:border-b-0">
                                <div className="w-6 h-6 bg-zinc-800/50 rounded text-zinc-400 text-xs flex items-center justify-center font-mono">
                                  {index + 1}
                                </div>
                                <img
                                  src={getCompetitorFavicon(competitor.name)}
                                  alt=""
                                  className="w-4 h-4 rounded"
                                  onError={(e) => {
                                    e.currentTarget.src = '/images/split-icon-white.svg';
                                  }}
                                />
                                <div className="flex-1">
                                  <div className="text-white text-sm font-medium">{competitor.name}</div>
                                </div>
                      <div className="text-right">
                                  <div className="text-white text-sm font-semibold">{competitor.mentionRate}%</div>
                                  <div className="text-zinc-500 text-xs">mention rate</div>
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
                        <h2 className="text-xl font-semibold text-white">Top Citation Sources</h2>
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
                            try {
                              const url = new URL(citation.url);
                              const domain = url.hostname.toLowerCase().replace('www.', '');
                              
                              if (!domainCounts[domain]) {
                                domainCounts[domain] = {
                                  domain,
                                  count: 0,
                                  sampleTitle: citation.title || domain,
                                  sampleUrl: citation.url
                                };
                              }
                              domainCounts[domain].count++;
                            } catch (error) {
                              // Skip invalid URLs
                            }
                          });

                          // Sort by citation count and take top 5
                          const topSources = (Object.values(domainCounts) as Array<{domain: string, count: number, sampleTitle: string, sampleUrl: string}>)
                            .sort((a, b) => b.count - a.count)
                            .slice(0, 5);

                          if (topSources.length === 0) {
                            return (
                              <div className="text-center py-8 text-zinc-500">
                                <Sparkles className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                                <p className="text-sm">No citation sources available</p>
                                </div>
                            );
                          }

                          return topSources.map((source, index) => {
                            return (
                              <div key={source.domain} className="flex items-center gap-4 py-3 border-b border-zinc-800/30 last:border-b-0">
                                <div className="w-6 h-6 bg-zinc-800/50 rounded text-zinc-400 text-xs flex items-center justify-center font-mono">
                                  {index + 1}
                                  </div>
                                <img
                                  src={`https://www.google.com/s2/favicons?domain=${source.domain}&sz=128`}
                                  alt=""
                                  className="w-4 h-4 rounded"
                                  onError={(e) => {
                                    e.currentTarget.src = '/images/split-icon-white.svg';
                                  }}
                                />
                              <div className="flex-1">
                                  <div className="text-white text-sm font-medium">{source.domain}</div>
                                  <div className="text-zinc-500 text-xs truncate">{source.sampleTitle}</div>
                              </div>
                                <div className="text-right">
                                  <div className="text-white text-sm font-semibold">{source.count}</div>
                                  <div className="text-zinc-500 text-xs">citations</div>
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
                        <h2 className="text-xl font-semibold text-white">Position Performance</h2>
                  </div>
                      
                      <div className="mb-6 p-4 bg-zinc-900/10 rounded-lg border border-zinc-800/50">
                        <p className="text-zinc-400 text-sm leading-relaxed">
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
                              <div className="border-l-2 border-zinc-800/50 pl-6">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-zinc-400 text-sm">Top 3 Positions</span>
                                  <span className="text-white text-2xl font-bold">
                                    {allResults.filter(r => r.position && r.position <= 3).length}
                              </span>
                            </div>
                                <div className="w-full bg-zinc-800/30 rounded-full h-1 mb-2">
                                  <div 
                                    className="bg-white h-1 rounded-full transition-all duration-300" 
                                    style={{ width: `${allResults.length > 0 ? (allResults.filter(r => r.position && r.position <= 3).length / allResults.length) * 100 : 0}%` }}
                                  />
                            </div>
                                <div className="text-zinc-500 text-xs">
                                  of {allResults.length} queries
                                </div>
                              </div>
                              
                              <div className="border-l-2 border-zinc-800/50 pl-6">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-zinc-400 text-sm">Top 5 Positions</span>
                                  <span className="text-white text-2xl font-bold">
                                    {allResults.filter(r => r.position && r.position <= 5).length}
                                  </span>
                                </div>
                                <div className="w-full bg-zinc-800/30 rounded-full h-1 mb-2">
                                  <div 
                                    className="bg-white h-1 rounded-full transition-all duration-300" 
                                    style={{ width: `${allResults.length > 0 ? (allResults.filter(r => r.position && r.position <= 5).length / allResults.length) * 100 : 0}%` }}
                                  />
                                </div>
                                <div className="text-zinc-500 text-xs">
                                  of {allResults.length} queries
                                </div>
                              </div>
                              
                              <div className="border-l-2 border-zinc-800/50 pl-6">
                            <div className="flex items-center justify-between">
                                  <span className="text-zinc-400 text-sm">Average Position</span>
                                  <span className="text-white text-2xl font-bold">
                                    {allResults.filter(r => r.position).length > 0 
                                      ? Math.round(allResults.filter(r => r.position).reduce((sum, r) => sum + (r.position || 0), 0) / allResults.filter(r => r.position).length)
                                      : 'N/A'
                                    }
                                  </span>
                            </div>
                                <div className="text-zinc-500 text-xs mt-2">
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

            {/* Technical Health Tab */}
            {activeTab === 'technical' && (
              <div className="space-y-8">
                {/* Technical Health Overview */}
                <div className="bg-zinc-900/20 rounded-lg p-8">
                  <div className="grid grid-cols-12 gap-8 items-center">
                    <div className="col-span-12 lg:col-span-5">
                      {(() => {
                        // Use real checklist data from database
                        const technicalChecklist = checklistResults;
                        
                        if (technicalChecklist.length === 0) {
                          const legacyScore = snapshot.weighted_aeo_score || snapshot.aeo_score || 0;
                          return (
                            <div>
                              <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Technical Audit</div>
                              <div className="flex items-baseline gap-3 mb-3">
                                <div className="text-6xl font-bold text-white">{legacyScore}<span className="text-2xl text-zinc-400">%</span></div>
                                <div className="text-zinc-500 text-sm">
                                  (legacy scoring)
                  </div>
                </div>
                              <p className="text-zinc-400 text-sm leading-relaxed">
                                No detailed checklist data available. Showing legacy technical score.
                              </p>
                            </div>
                          );
                        }
                        
                        const totalPossiblePoints = technicalChecklist.reduce((sum, check) => sum + check.weight, 0);
                        const earnedPoints = technicalChecklist.filter(check => check.passed).reduce((sum, check) => sum + check.weight, 0);
                        const calculatedScore = Math.round((earnedPoints / totalPossiblePoints) * 100);
                        const passedChecks = technicalChecklist.filter(check => check.passed).length;
                        const failedChecks = technicalChecklist.length - passedChecks;
                        
                        // Debug technical scoring
                        console.log('Technical scoring:', {
                          totalChecks: technicalChecklist.length,
                          passedChecks,
                          failedChecks,
                          totalPossiblePoints,
                          earnedPoints,
                          calculatedScore
                        });
                        
                                                  return (
                            <div>
                              <div className="text-zinc-500 text-xs uppercase tracking-wider mb-2">Technical Health Performance</div>
                              <div className="text-6xl font-bold text-white mb-3">{calculatedScore}<span className="text-2xl text-zinc-400">%</span></div>
                              <p className="text-zinc-400 text-sm leading-relaxed">
                                How well your page is optimized for AI crawlers with proper structure, accessibility, and technical implementation.
                              </p>
                            </div>
                          );
                      })()}
                    </div>
                    
                    <div className="col-span-12 lg:col-span-7">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-3">Audit Progress</div>
                          <div className="text-3xl font-bold text-white mb-2">{checklistResults.length || 0}</div>
                          <div className="text-zinc-400 text-sm mb-3">comprehensive checks</div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                              <span className="text-zinc-400 text-xs">
                                {checklistResults.filter(check => check.passed).length} passed
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                              <span className="text-zinc-400 text-xs">
                                {checklistResults.filter(check => !check.passed).length} failed
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-zinc-500 text-xs uppercase tracking-wider mb-3">Category Breakdown</div>
                          <div className="text-3xl font-bold text-white mb-2">
                            {[...new Set(checklistResults.map(check => check.category))].length || 0}
                          </div>
                          <div className="text-zinc-400 text-sm mb-3">audit categories</div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                              <span className="text-zinc-400 text-xs">Weighted scoring</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                              <span className="text-zinc-400 text-xs">Transparent calc</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                                {/* Comprehensive 55-Item Checklist */}
                <div className="bg-zinc-900/20 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-white mb-6">Comprehensive Technical Audit Checklist</h2>
                  
                  {(() => {
                    // Use real checklist data from database
                    const technicalChecklist = checklistResults;
                    
                    if (technicalChecklist.length === 0) {
                      return (
                        <div className="text-center py-8 border border-zinc-800/30 rounded-lg">
                          <AlertCircle className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
                          <p className="text-white text-sm font-medium mb-1">No Checklist Data Available</p>
                          <p className="text-zinc-500 text-xs">Detailed checklist analysis not available for this snapshot</p>
                        </div>
                      );
                    }
                    
                    // Group checklist items by category
                    const categories = [...new Set(technicalChecklist.map(check => check.category))].sort();
                    
                    return categories.map(category => {
                      const categoryChecks = technicalChecklist.filter(check => check.category === category);
                      // Sort failed items (red dots) above passed items (green dots)
                      const sortedChecks = [...categoryChecks].sort((a, b) => {
                        if (a.passed === b.passed) return 0;
                        return a.passed ? 1 : -1; // Failed items first
                      });
                      
                      return (
                        <div key={category} className="mb-6">
                          <h3 className="text-white text-lg font-medium mb-4">{category}</h3>
                          
                          <div className="space-y-2">
                            {sortedChecks.map(check => {
                              const isExpanded = expandedItems.has(check.id);
                              
                              return (
                                <div key={check.id} className="bg-zinc-800/50 rounded-lg overflow-hidden">
                                  <div 
                                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-800/70 transition-colors"
                                    onClick={() => toggleExpanded(check.id)}
                                  >
                                    <div className="flex items-center gap-3 flex-1">
                                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                        check.passed ? 'bg-emerald-400' : 'bg-red-400'
                                      }`}></div>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-white text-sm font-medium">{check.check_name}</div>
                                        <div className="text-zinc-400 text-xs truncate">{check.details}</div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {check.passed ? (
                                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                                      ) : (
                                        <XCircle className="w-4 h-4 text-red-400" />
                                      )}
                                      <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${
                                        isExpanded ? 'rotate-180' : ''
                                      }`} />
                                    </div>
                                  </div>
                                  
                                                                     {isExpanded && (
                                     <div className="border-t border-zinc-700/50 p-4 bg-zinc-900/60">
                                       <div className="text-zinc-300 text-sm font-medium mb-2">
                                         {check.passed ? 'Status:' : 'How to fix:'}
                                       </div>
                                       <p className="text-zinc-400 text-sm leading-relaxed">
                                         {getFixSuggestion(check.check_name, check.details, check.passed)}
                                       </p>
                      </div>
                    )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  })()}
                  </div>
                </div>
              )}
            </div>
        )}
      </div>
    </main>
  );
} 