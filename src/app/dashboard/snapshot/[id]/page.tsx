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
  ChevronRight,
  Quote
} from 'lucide-react';
import Link from 'next/link';
import { 
  getEnhancedSnapshots,
  getTechnicalIssues,
  getTechnicalRecommendations,
  getVisibilityResults,
  getCombinedScore,
  type EnhancedSnapshotResult,
  type TechnicalIssue,
  type TechnicalRecommendation,
  type VisibilityResult
} from '@/lib/api/enhanced-snapshots';

type TabType = 'overview' | 'visibility' | 'technical' | 'recommendations';

export default function EnhancedSnapshotReportPage() {
  const params = useParams();
  const snapshotId = params.id as string;
  const { user } = useAuth();

  // State management
  const [snapshot, setSnapshot] = useState<EnhancedSnapshotResult | null>(null);
  const [issues, setIssues] = useState<TechnicalIssue[]>([]);
  const [recommendations, setRecommendations] = useState<TechnicalRecommendation[]>([]);
  const [visibilityResults, setVisibilityResults] = useState<VisibilityResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Load all data
  useEffect(() => {
    if (snapshotId && user?.id) {
      loadSnapshotData();
    }
  }, [snapshotId, user?.id]);

  const loadSnapshotData = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        setError('Please sign in to view snapshots');
        return;
      }
      
      // For now, get all snapshots and find the one we need
      // In production, you'd have a getSnapshotById function
      const snapshots = await getEnhancedSnapshots(user.id);
      const targetSnapshot = snapshots.find(s => s.id === snapshotId);
      
      if (!targetSnapshot) {
        setError('Snapshot not found');
        return;
      }
      
      setSnapshot(targetSnapshot);
      
      // Load additional data if completed
      if (targetSnapshot.status === 'completed' && targetSnapshot.url) {
        const [issuesData, recsData, visData] = await Promise.all([
          getTechnicalIssues(targetSnapshot.url),
          getTechnicalRecommendations(targetSnapshot.url),
          getVisibilityResults(snapshotId)
        ]);
        
        setIssues(issuesData);
        setRecommendations(recsData);
        setVisibilityResults(visData);
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
        return <Clock className="w-4 h-4 text-[#888]" />;
      case 'processing':
        return <div className="w-4 h-4 animate-spin rounded-full border-2 border-[#888] border-t-transparent" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-[#888]" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-[#888]" />;
      default:
        return <AlertCircle className="w-4 h-4 text-[#888]" />;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
      case 'info':
        return <Info className="w-4 h-4 text-[#888]" />;
      default:
        return null;
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'medium':
        return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'high':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:
        return 'text-[#888] bg-[#888]/10 border-[#888]/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#888] border-t-transparent" />
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-[#888] mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white mb-2 tracking-tight">Snapshot not found</h1>
          <p className="text-[#888] mb-6">{error}</p>
          <Link
            href="/dashboard/snapshot"
            className="bg-[#2A2A2A] hover:bg-[#333] border border-[#444] text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors"
          >
            Back to Snapshots
          </Link>
        </div>
      </div>
    );
  }

  const combinedScore = snapshot.status === 'completed' ? getCombinedScore(snapshot) : null;

  return (
    <main className="min-h-screen bg-[#0c0c0c] px-6 py-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/snapshot"
            className="flex items-center justify-center w-10 h-10 bg-[#1C1C1C] border border-[#333] rounded-xl hover:bg-[#2A2A2A] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-semibold text-white tracking-tight" style={{ letterSpacing: '-0.04em' }}>
                Snapshot Report
              </h1>
              <div className="flex items-center gap-2">
                {getStatusIcon(snapshot.status)}
                <span className="text-sm text-[#888] capitalize font-medium">
                  {snapshot.status}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-[#666]">
              <span>{snapshot.topic}</span>
              <span>•</span>
              <span>{snapshot.url}</span>
              <span>•</span>
              <span>{new Date(snapshot.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Processing States */}
        {snapshot.status !== 'completed' && (
          <div className="bg-[#181818] border border-[#333] rounded-xl p-8 text-center">
            {snapshot.status === 'pending' && (
              <>
                <Clock className="w-12 h-12 text-[#888] mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2 tracking-tight">Queued for Processing</h3>
                <p className="text-[#888]">Your snapshot will begin processing shortly...</p>
              </>
            )}
            {snapshot.status === 'processing' && (
              <>
                <div className="w-12 h-12 animate-spin rounded-full border-2 border-[#888] border-t-transparent mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2 tracking-tight">Analyzing Your Content</h3>
                <p className="text-[#888]">Running AI visibility tests and technical audits...</p>
              </>
            )}
            {snapshot.status === 'failed' && (
              <>
                <XCircle className="w-12 h-12 text-[#888] mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2 tracking-tight">Processing Failed</h3>
                <p className="text-[#888]">An error occurred during processing</p>
              </>
            )}
          </div>
        )}

        {/* Results - Only show if completed */}
        {snapshot.status === 'completed' && combinedScore && (
          <>
            {/* Hero Score Section */}
            <div className="bg-[#181818] border border-[#333] p-8 text-center">
              <div className="mb-6">
                <div className="text-7xl font-bold text-white tracking-tight mb-2">
                  {combinedScore.score}
                </div>
                <div className="text-2xl font-medium text-[#888]">
                  Combined Score
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-12 mb-6">
                <div>
                  <div className="text-sm text-[#666] mb-1">AI Visibility</div>
                  <div className="text-3xl font-semibold text-white">{combinedScore.breakdown.visibility}</div>
                </div>
                <div className="text-4xl text-[#333]">+</div>
                <div>
                  <div className="text-sm text-[#666] mb-1">Technical Health</div>
                  <div className="text-3xl font-semibold text-white">{combinedScore.breakdown.technical}</div>
                </div>
              </div>
              
              <div className="inline-flex items-center gap-2 bg-[#2A2A2A] border border-[#444] rounded-full px-6 py-3">
                <span className="text-xl font-bold text-white">Grade {combinedScore.grade}</span>
              </div>
            </div>

            {/* Scraping Error Alert */}
            {snapshot.scrape_success === false && snapshot.scrape_error && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-6 h-6 text-amber-400 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-amber-400 font-semibold mb-2 tracking-tight">
                      Website Scraping Issue
                    </h3>
                    <p className="text-amber-200/80 mb-3">
                      We couldn't fully analyze your website's technical aspects due to a scraping error. 
                      Your AI visibility results are still complete and accurate.
                    </p>
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                      <p className="text-amber-200/70 text-sm font-mono">
                        Error: {snapshot.scrape_error}
                      </p>
                    </div>
                    <p className="text-amber-200/60 text-sm mt-3">
                      💡 <strong>What this means:</strong> Technical audit data may be incomplete, but AI visibility testing was successful.
                      The combined score reflects available data.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="bg-[#181818] border border-[#333] p-2 flex gap-2">
              {[
                { id: 'overview', label: 'Overview', icon: Sparkles },
                { id: 'visibility', label: 'AI Visibility', icon: Search },
                { id: 'technical', label: 'Technical Audit', icon: Code },
                { id: 'recommendations', label: 'Recommendations', icon: Zap }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#2A2A2A] text-white border border-[#444]'
                      : 'text-[#888] hover:text-white hover:bg-[#1C1C1C]'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <>
                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#181818] border border-[#333] p-6">
                      <div className="flex items-center gap-2 text-[#888] text-sm mb-2">
                        <Search className="w-4 h-4" />
                        <span>AI Mentions</span>
                      </div>
                      <div className="text-3xl font-semibold text-white mb-1">
                        {snapshot.mentions_count}/{snapshot.total_questions}
                      </div>
                      <div className="text-[#666] text-sm">
                        Found in AI responses
                      </div>
                    </div>
                    
                    <div className="bg-[#181818] border border-[#333] p-6">
                      <div className="flex items-center gap-2 text-[#888] text-sm mb-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Critical Issues</span>
                      </div>
                      <div className="text-3xl font-semibold text-white mb-1">
                        {issues.filter(i => i.severity === 'critical').length}
                      </div>
                      <div className="text-[#666] text-sm">
                        Require immediate attention
                      </div>
                    </div>
                    
                    <div className="bg-[#181818] border border-[#333] p-6">
                      <div className="flex items-center gap-2 text-[#888] text-sm mb-2">
                        <Shield className="w-4 h-4" />
                        <span>Rendering Mode</span>
                      </div>
                      <div className="text-xl font-semibold text-white mb-1">
                        {snapshot.rendering_mode || 'Unknown'}
                      </div>
                      <div className="text-[#666] text-sm">
                        {snapshot.ssr_score_penalty ? `-${snapshot.ssr_score_penalty} penalty` : 'Optimal for SEO'}
                      </div>
                    </div>
                  </div>

                  {/* Category Scores */}
                  <div className="bg-[#181818] border border-[#333] p-6">
                    <h3 className="text-white font-semibold mb-4 tracking-tight">Technical Category Scores</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { label: 'Content Quality', value: snapshot.content_quality_score, weight: '25%' },
                        { label: 'Technical Health', value: snapshot.technical_health_score, weight: '20%' },
                        { label: 'AI Optimization', value: snapshot.ai_optimization_score, weight: '20%' },
                        { label: 'Schema Markup', value: snapshot.schema_markup_score, weight: '20%' },
                        { label: 'Media Accessibility', value: snapshot.media_accessibility_score, weight: '15%' }
                      ].map((category) => (
                        <div key={category.label} className="bg-[#1C1C1C] rounded-xl p-4">
                          <div className="text-[#888] text-sm mb-2">{category.label}</div>
                          <div className="flex items-baseline gap-2">
                            <div className="text-2xl font-semibold text-white">
                              {category.value || 0}
                            </div>
                            <div className="text-[#666] text-xs">/ 100</div>
                          </div>
                          <div className="text-[#666] text-xs mt-1">Weight: {category.weight}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Competitors */}
                  {snapshot.top_competitors.length > 0 && (
                    <div className="bg-[#181818] border border-[#333] p-6">
                      <h3 className="text-white font-semibold mb-4 tracking-tight">Top Competitors in AI Results</h3>
                      <div className="space-y-3">
                        {snapshot.top_competitors.slice(0, 5).map((competitor, index) => (
                          <div key={index} className="flex items-center justify-between bg-[#1C1C1C] rounded-xl p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-[#2A2A2A] rounded-lg flex items-center justify-center text-[#888] text-sm font-medium">
                                {index + 1}
                              </div>
                              <span className="text-white font-medium">{competitor}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key Insights */}
                  <div className="bg-[#181818] border border-[#333] p-6">
                    <h3 className="text-white font-semibold mb-4 tracking-tight">Key Insights</h3>
                    <div className="space-y-3">
                      {snapshot.insights.map((insight, index) => (
                        <div key={index} className="bg-[#1C1C1C] rounded-xl p-4">
                          <p className="text-[#888]">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* AI Visibility Tab */}
              {activeTab === 'visibility' && (
                <div className="space-y-6">
                  <div className="bg-[#181818] border border-[#333] p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-white font-semibold tracking-tight">AI Visibility Testing Results</h3>
                      <div className="text-right">
                        <div className="text-3xl font-semibold text-white">{snapshot.visibility_score}%</div>
                        <div className="text-[#888] text-sm">Visibility Score</div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {visibilityResults.map((result, index) => (
                        <div key={result.id} className="bg-[#1C1C1C] rounded-xl p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-[#888] text-sm">Question {result.question_number}</span>
                                {result.target_found ? (
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-400" />
                                )}
                              </div>
                              <p className="text-white font-medium">{result.question_text}</p>
                            </div>
                            {result.position && (
                              <div className="text-right">
                                <div className="text-xl font-semibold text-white">#{result.position}</div>
                                <div className="text-[#666] text-xs">Position</div>
                              </div>
                            )}
                          </div>
                          
                          {result.citation_snippet && (
                            <div className="bg-[#2A2A2A] rounded-lg p-4 mb-3 relative">
                              <div className="flex items-start gap-3">
                                {/* Perplexity logo or citation icon */}
                                <div className="flex-shrink-0 mt-1">
                                  {result.target_found && result.position === 1 ? (
                                    // Pure mention in AI answer - show Perplexity logo
                                    <div className="w-6 h-6 p-1 bg-black/20 rounded-md flex items-center justify-center">
                                      <img 
                                        src="/images/perplexity.svg" 
                                        alt="Perplexity AI" 
                                        className="w-full h-full"
                                      />
                                    </div>
                                  ) : (
                                    // Citation from search results - show quote icon
                                    <Quote className="w-5 h-5 text-[#666] mt-0.5" />
                                  )}
                                </div>
                                
                                <div className="flex-1">
                                  {/* AI Answer */}
                                  <p className="text-[#CCC] text-sm leading-relaxed mb-3">
                                    {result.citation_snippet}
                                  </p>
                                  
                                  {/* Citation Links */}
                                  {result.top_citations && result.top_citations.length > 0 && (
                                    <div className="space-y-2">
                                      <div className="text-[#666] text-xs font-medium">Sources:</div>
                                      <div className="space-y-1">
                                        {result.top_citations.slice(0, 3).map((citation, index) => {
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
                                              className="flex items-center gap-2 text-[#888] hover:text-[#CCC] transition-colors group"
                                            >
                                              <div className="flex-shrink-0">
                                                <img
                                                  src={getFaviconUrl(citation.url)}
                                                  alt=""
                                                  className="w-4 h-4 rounded"
                                                  onError={(e) => {
                                                    e.currentTarget.src = '/images/split-icon-white.svg';
                                                  }}
                                                />
                                              </div>
                                              <span className="text-xs truncate">
                                                {citation.title || new URL(citation.url).hostname}
                                              </span>
                                              <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 ml-auto flex-shrink-0" />
                                            </a>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {result.competitor_names.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              <span className="text-[#666] text-sm">Also mentioned:</span>
                              {result.competitor_names.map((comp, i) => (
                                <span key={i} className="bg-[#2A2A2A] text-[#888] px-2 py-1 rounded text-sm">
                                  {comp}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Technical Audit Tab */}
              {activeTab === 'technical' && (
                <div className="space-y-6">
                  {/* Technical Score Overview */}
                  <div className="bg-[#181818] border border-[#333] p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-white font-semibold tracking-tight">Technical AEO Analysis</h3>
                      <div className="text-right">
                        <div className="text-3xl font-semibold text-white">{snapshot.weighted_aeo_score || snapshot.aeo_score || 0}</div>
                        <div className="text-[#888] text-sm">AEO Score</div>
                      </div>
                    </div>
                    
                    {/* Issues by Severity */}
                    <div className="space-y-4">
                      {issues.length > 0 ? (
                        issues.map((issue) => (
                          <div key={issue.id} className="bg-[#1C1C1C] rounded-xl p-4 border border-[#333] hover:border-[#444] transition-colors">
                            <div className="flex items-start gap-3">
                              {getSeverityIcon(issue.severity)}
                              <div className="flex-1">
                                <h4 className="text-white font-medium mb-1">{issue.title}</h4>
                                <p className="text-[#888] text-sm mb-2">{issue.description}</p>
                                <div className="flex items-center gap-4">
                                  <span className="text-[#666] text-xs">Impact: {issue.impact}</span>
                                  <span className="text-[#666] text-xs">Priority: {issue.fix_priority}/10</span>
                                </div>
                                {issue.diagnostic && (
                                  <div className="mt-3 bg-[#2A2A2A] rounded-lg p-3">
                                    <p className="text-[#888] text-xs font-mono">{issue.diagnostic}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                          <p className="text-white font-medium">No technical issues found!</p>
                          <p className="text-[#888] text-sm">Your site meets all technical requirements</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations Tab */}
              {activeTab === 'recommendations' && (
                <div className="space-y-6">
                  <div className="bg-[#181818] border border-[#333] p-6">
                    <h3 className="text-white font-semibold mb-6 tracking-tight">Prioritized Recommendations</h3>
                    
                    {recommendations.length > 0 ? (
                      <div className="space-y-4">
                        {recommendations.map((rec) => (
                          <div key={rec.id} className="bg-[#1C1C1C] rounded-xl p-4 border border-[#333] hover:border-[#444] transition-colors">
                            <div className="flex items-start justify-between mb-3">
                              <h4 className="text-white font-medium">{rec.title}</h4>
                              <span className={`text-xs px-2 py-1 rounded-full border ${getEffortColor(rec.effort_level)}`}>
                                {rec.effort_level} effort
                              </span>
                            </div>
                            <p className="text-[#888] text-sm mb-3">{rec.description}</p>
                            <div className="bg-[#2A2A2A] rounded-lg p-3 mb-3">
                              <p className="text-[#888] text-sm">
                                <strong className="text-white">How to implement:</strong> {rec.implementation}
                              </p>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[#666] text-xs">Expected impact: {rec.expected_impact}</span>
                              <span className="text-[#666] text-xs">Priority: {rec.priority_score}/10</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Sparkles className="w-12 h-12 text-[#888] mx-auto mb-3" />
                        <p className="text-white font-medium">No recommendations at this time</p>
                        <p className="text-[#888] text-sm">Your site is well-optimized!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
} 