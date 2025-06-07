import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, Globe, Activity, Zap, Users, BarChart3 } from 'lucide-react'
import Link from 'next/link'

interface WorkspacePageProps {
  params: { workspaceId: string }
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspaceId } = params
  
  try {
    const supabase = createClient()
    
    // Get workspace info
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, workspace_name, domain, user_id, created_at')
      .eq('id', workspaceId)
      .single()
    
    if (workspaceError || !workspace) {
      notFound()
    }
    
    // Get recent crawler visits for this workspace (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { data: recentVisits, error: visitsError } = await supabase
      .from('crawler_visits')
      .select('crawler_name, crawler_company, timestamp')
      .eq('workspace_id', workspaceId)
      .gte('timestamp', thirtyDaysAgo.toISOString())
      .order('timestamp', { ascending: false })
      .limit(10)
    
    // Get crawler stats
    const { data: crawlerStats, error: statsError } = await supabase
      .from('crawler_visits')
      .select('crawler_name, crawler_company')
      .eq('workspace_id', workspaceId)
      .gte('timestamp', thirtyDaysAgo.toISOString())
    
    const uniqueCrawlers = new Map()
    let totalVisits = 0
    
    if (crawlerStats) {
      crawlerStats.forEach(visit => {
        totalVisits++
        const key = `${visit.crawler_name}-${visit.crawler_company}`
        if (uniqueCrawlers.has(key)) {
          uniqueCrawlers.get(key).count++
        } else {
          uniqueCrawlers.set(key, {
            name: visit.crawler_name,
            company: visit.crawler_company,
            count: 1
          })
        }
      })
    }
    
    const topCrawlers = Array.from(uniqueCrawlers.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
    
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        {/* Header */}
        <div className="border-b border-[#1a1a1a] bg-[#0c0c0c]">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Globe className="w-8 h-8 text-blue-500" />
                  <h1 className="text-3xl font-bold">{workspace.workspace_name}</h1>
                </div>
                <p className="text-gray-400 flex items-center gap-2">
                  <span>{workspace.domain}</span>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20">
                    Active
                  </Badge>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Workspace ID</p>
                <p className="text-sm font-mono text-gray-300">{workspaceId}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="grid gap-6">
            
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-[#0c0c0c] border-[#1a1a1a]">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Activity className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold text-white">{totalVisits}</p>
                      <p className="text-sm text-gray-400">Total Visits (30d)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-[#0c0c0c] border-[#1a1a1a]">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold text-white">{uniqueCrawlers.size}</p>
                      <p className="text-sm text-gray-400">Unique Crawlers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-[#0c0c0c] border-[#1a1a1a]">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-8 h-8 text-purple-500" />
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {totalVisits > 0 ? Math.round(totalVisits / 30) : 0}
                      </p>
                      <p className="text-sm text-gray-400">Avg Daily Visits</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Top Crawlers */}
            {topCrawlers.length > 0 && (
              <Card className="bg-[#0c0c0c] border-[#1a1a1a]">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-500" />
                    Top AI Crawlers (Last 30 Days)
                  </CardTitle>
                  <CardDescription>
                    Most active AI crawlers visiting this workspace
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topCrawlers.map((crawler, index) => (
                      <div key={`${crawler.name}-${crawler.company}`} className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg border border-[#1a1a1a]">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 text-sm font-bold flex items-center justify-center">
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-white font-medium">{crawler.name}</p>
                            <p className="text-sm text-gray-400">{crawler.company}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                          {crawler.count} visits
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Recent Activity */}
            {recentVisits && recentVisits.length > 0 ? (
              <Card className="bg-[#0c0c0c] border-[#1a1a1a]">
                <CardHeader>
                  <CardTitle className="text-white">Recent Crawler Visits</CardTitle>
                  <CardDescription>
                    Latest AI crawler activity on this workspace
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recentVisits.map((visit, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-[#1a1a1a] last:border-b-0">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-green-400"></div>
                          <div>
                            <span className="text-white font-medium">{visit.crawler_name}</span>
                            <span className="text-gray-400 ml-2">({visit.crawler_company})</span>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(visit.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-[#0c0c0c] border-[#1a1a1a]">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No Crawler Visits Yet</h3>
                    <p className="text-gray-400 mb-4">
                      This workspace hasn't received any AI crawler visits in the last 30 days.
                    </p>
                    <p className="text-sm text-gray-500">
                      Make sure the tracking pixel is installed on your website to start seeing data.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href="/dashboard">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Full Dashboard
                </Link>
              </Button>
              
              {workspace.domain !== 'example.com' && (
                <Button variant="outline" asChild className="border-[#333] text-gray-300 hover:text-white hover:border-[#444]">
                  <Link href={`https://${workspace.domain}`} target="_blank">
                    <Globe className="w-4 h-4 mr-2" />
                    Visit Website
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="border-t border-[#1a1a1a] mt-12">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <p>Powered by Split Analytics</p>
              <p>
                Created {new Date(workspace.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
    
  } catch (error) {
    console.error('Error loading workspace page:', error)
    notFound()
  }
} 