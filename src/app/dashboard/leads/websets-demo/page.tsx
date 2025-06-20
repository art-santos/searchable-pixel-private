'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface WebsetsResult {
  success: boolean;
  status: string;
  leadId?: string;
  websetId?: string;
  company?: {
    name: string;
    domain: string;
    city: string;
    country: string;
  };
  contact?: {
    name: string;
    title: string;
    email: string;
    linkedinUrl: string;
    confidence: number;
    pictureUrl?: string;
    headline?: string;
    enrichment?: any;
  };
  cost?: number;
  error?: string;
}

export default function WebsetsDemoPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [userVisitId, setUserVisitId] = useState('09ade746-e5a7-40de-b773-8e89db6d7379');
  const [icpDescription, setIcpDescription] = useState('Senior UX Designer');
  const [loading, setLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);
  const [result, setResult] = useState<WebsetsResult | null>(null);
  const [useWebsets, setUseWebsets] = useState(true);

  // Admin access check
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user) {
        router.push('/login')
        return
      }

      // Check user's admin status from both email domain and profile
      const supabase = createClient()
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()

      const hasAdminEmail = user.email?.endsWith('@split.dev')
      const hasAdminRole = profile?.is_admin === true

      if (!hasAdminEmail && !hasAdminRole) {
        router.push('/dashboard')
        return
      }

      // For @split.dev users, check admin verification
      if (hasAdminEmail) {
        const adminVerified = localStorage.getItem('admin_verified')
        const adminVerifiedAt = localStorage.getItem('admin_verified_at')
        
        if (!adminVerified || adminVerified !== 'true') {
          router.push('/admin/verify')
          return
        }

        if (adminVerifiedAt) {
          const verifiedTime = new Date(adminVerifiedAt)
          const now = new Date()
          const hoursSinceVerification = (now.getTime() - verifiedTime.getTime()) / (1000 * 60 * 60)
          
          // Require re-verification after 24 hours
          if (hoursSinceVerification > 24) {
            localStorage.removeItem('admin_verified')
            localStorage.removeItem('admin_verified_at')
            router.push('/admin/verify')
            return
          }
        }
      }

      setAdminLoading(false)
    }

    checkAdminAccess()
  }, [user, router])

  // Show loading while checking admin access
  if (adminLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0c0c0c] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-500 mx-auto mb-4" />
          <p className="text-zinc-600 dark:text-zinc-400">Checking admin access...</p>
        </div>
      </div>
    )
  }

  const handleEnrich = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const endpoint = useWebsets ? '/api/leads/enrich-websets' : '/api/leads/enrich-now';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userVisitId,
          icpDescription: icpDescription || undefined
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Websets vs Legacy Enrichment Demo</h1>
          <p className="text-muted-foreground mt-2">
            Test the new Exa Websets pipeline against the legacy search method
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enrichment Test</CardTitle>
          <CardDescription>
            Enter a user visit ID and ICP description to test lead enrichment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">User Visit ID</label>
              <Input
                value={userVisitId}
                onChange={(e) => setUserVisitId(e.target.value)}
                placeholder="Enter user visit ID"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">ICP Description (Optional)</label>
              <Input
                value={icpDescription}
                onChange={(e) => setIcpDescription(e.target.value)}
                placeholder="e.g., Senior UX Designer"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="websets"
                name="method"
                checked={useWebsets}
                onChange={() => setUseWebsets(true)}
              />
              <label htmlFor="websets" className="text-sm">
                🚀 Websets Pipeline ($0.35/lead)
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="radio"
                id="legacy"
                name="method"
                checked={!useWebsets}
                onChange={() => setUseWebsets(false)}
              />
              <label htmlFor="legacy" className="text-sm">
                🔍 Legacy Search ($0.07/lead)
              </label>
            </div>
          </div>

          <Button 
            onClick={handleEnrich} 
            disabled={loading || !userVisitId}
            className="w-full"
          >
            {loading ? 'Enriching...' : `Enrich with ${useWebsets ? 'Websets' : 'Legacy'}`}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Enrichment Result</CardTitle>
              <Badge variant={result.success ? 'default' : 'destructive'}>
                {result.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.error && (
              <Alert>
                <AlertDescription>{result.error}</AlertDescription>
              </Alert>
            )}

            {result.company && (
              <div className="space-y-2">
                <h3 className="font-semibold">Company Found</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>Name:</strong> {result.company.name}</div>
                  <div><strong>Domain:</strong> {result.company.domain}</div>
                  <div><strong>Location:</strong> {result.company.city}, {result.company.country}</div>
                  {result.websetId && (
                    <div><strong>Webset ID:</strong> {result.websetId}</div>
                  )}
                </div>
              </div>
            )}

            {result.contact && (
              <div className="space-y-2">
                <h3 className="font-semibold">Contact Found</h3>
                <div className="flex items-start space-x-4">
                  {result.contact.pictureUrl && (
                    <img 
                      src={result.contact.pictureUrl} 
                      alt={result.contact.name}
                      className="w-16 h-16 rounded-full"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div><strong>Name:</strong> {result.contact.name}</div>
                      <div><strong>Title:</strong> {result.contact.title}</div>
                      <div><strong>Email:</strong> {result.contact.email}</div>
                      <div><strong>Confidence:</strong> {(result.contact.confidence * 100).toFixed(1)}%</div>
                      {result.contact.headline && (
                        <div className="col-span-2"><strong>Headline:</strong> {result.contact.headline}</div>
                      )}
                    </div>
                    
                    {result.contact.linkedinUrl && (
                      <a 
                        href={result.contact.linkedinUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View LinkedIn Profile →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {result.contact?.enrichment && (
              <div className="space-y-2">
                <h3 className="font-semibold">Enrichment Data</h3>
                <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(result.contact.enrichment, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              {result.cost && (
                <div>Cost: ${result.cost.toFixed(3)}</div>
              )}
              {result.leadId && (
                <div>Lead ID: {result.leadId}</div>
              )}
            </div>

            <details className="text-xs">
              <summary className="cursor-pointer font-medium">Raw JSON Response</summary>
              <pre className="bg-gray-100 p-3 rounded mt-2 overflow-auto max-h-60">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 