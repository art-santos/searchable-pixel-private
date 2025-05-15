'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Globe, 
  FileCode,
  Link as LinkIcon,
  Plus,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  Info,
  FilePlus,
  Rocket,
  ArrowRight,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  RotateCw,
  Clipboard
} from 'lucide-react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import SiteConnectionStatus from '@/components/site-connection-status'
import { Input } from '@/components/ui/input'

type ConnectorStep = 'domain' | 'credentials' | 'install' | 'verify' | 'complete'

export default function SiteConnector() {
  const [currentStep, setCurrentStep] = useState<ConnectorStep>('domain')
  const [domain, setDomain] = useState('')
  const [siteId, setSiteId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<string>('unknown')

  // CSS styles for custom badges to match the dashboard
  const customBadgeClass = "bg-transparent border border-[#FF914D] text-white h-7 px-3";
  const customBadgeStyle = {
    background: "linear-gradient(to bottom, rgba(255, 145, 77, 0.3), rgba(255, 236, 159, 0.3))"
  };
  
  const handleDomainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!domain) {
      setError('Please enter a domain');
      return;
    }
    
    // Basic validation
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    if (!domainRegex.test(domain)) {
      setError('Please enter a valid domain (e.g., example.com)');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Create site in database or get existing one
      const response = await fetch('/api/sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSiteId(data.site_id);
        setCurrentStep('credentials');
      } else {
        setError(data.error || 'Failed to register site');
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const verifyConnection = async () => {
    if (!siteId) return;
    
    setIsLoading(true);
    setConnectionStatus('verifying');
    
    try {
      const response = await fetch(`/api/verify-site-connection?site_id=${siteId}`, {
        method: 'GET',
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setConnectionStatus(data.verification.status);
        
        // If connected, move to complete step
        if (data.verification.status === 'connected') {
          setCurrentStep('complete');
        }
      } else {
        setConnectionStatus('error');
        setError(data.error || 'Failed to verify connection');
      }
    } catch (error) {
      setConnectionStatus('error');
      setError('An error occurred during verification');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container max-w-3xl py-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Connect Your Website</h1>
        <p className="text-gray-400 text-sm mt-1">Configure your website connection for AI optimization</p>
      </div>
      
      {/* Step Indicator */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-2">
          {['domain', 'credentials', 'install', 'verify', 'complete'].map((step, index) => (
            <div key={step} className="flex items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep === step 
                    ? 'bg-gradient-to-r from-[#FF914D] to-[#FFEC9F] text-black' 
                    : currentStep === 'complete' || 
                      ['domain', 'credentials', 'install', 'verify'].indexOf(step as ConnectorStep) < 
                      ['domain', 'credentials', 'install', 'verify'].indexOf(currentStep) 
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                        : 'bg-[#222222] text-gray-400'
                }`}
              >
                {currentStep === 'complete' || 
                 (['domain', 'credentials', 'install', 'verify'].indexOf(step as ConnectorStep) < 
                  ['domain', 'credentials', 'install', 'verify'].indexOf(currentStep)) 
                  ? <CheckCircle className="h-4 w-4" /> 
                  : index + 1}
              </div>
              {index < 4 && (
                <div className={`w-12 h-0.5 ${
                  currentStep === 'complete' || 
                  (index < ['domain', 'credentials', 'install', 'verify'].indexOf(currentStep))
                    ? 'bg-green-500/30' 
                    : 'bg-[#333333]'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Connection Status Card */}
      {siteId && (
        <div className="mb-8">
          <p className="text-sm text-gray-400">Connection Status</p>
          <SiteConnectionStatus 
            siteId={siteId} 
            initialStatus={connectionStatus as any} 
            domain={domain}
            lastPinged={null}
          />
        </div>
      )}
      
      {/* Step Content */}
      <Card className="bg-[#101010] border-[#222222] border shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-white">
            {currentStep === 'domain' && 'Enter Your Website Domain'}
            {currentStep === 'credentials' && 'Get API Credentials'}
            {currentStep === 'install' && 'Install Split Agent'}
            {currentStep === 'verify' && 'Verify Connection'}
            {currentStep === 'complete' && 'Connection Complete!'}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {/* Domain Step */}
          {currentStep === 'domain' && (
            <form onSubmit={handleDomainSubmit}>
              <div className="space-y-4">
                <p className="text-xs text-gray-400">
                  Provide the URL of your site to begin the connection process
                </p>
                
                <div className="flex gap-3">
                  <div className="relative flex-grow">
                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="text"
                      placeholder="example.com"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="pl-9 bg-[#171717] border-[#333333] text-white placeholder:text-gray-500 focus:border-[#FF914D]/70 focus:ring-[#FF914D]/20"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="bg-gradient-to-r from-[#FF914D] to-[#FFEC9F] text-black hover:opacity-90"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <RotateCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
                
                {error && (
                  <p className="text-red-400 text-xs">{error}</p>
                )}
              </div>
            </form>
          )}
          
          {/* Credentials Step */}
          {currentStep === 'credentials' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400">
                Generate API credentials for your domain to establish a secure connection
              </p>
              
              <div className="bg-[#171717] border border-[#222222] rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-gray-400">Domain</span>
                  <span className="text-xs font-mono text-white">{domain}</span>
                </div>
                
                <Button 
                  className="w-full bg-gradient-to-r from-[#FF914D] to-[#FFEC9F] text-black hover:opacity-90"
                  onClick={() => {
                    // Navigate to API credentials generation
                    window.location.href = '/dashboard/api-keys'; 
                  }}
                >
                  Generate API Credentials
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
              
              <div className="flex justify-between">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-400 hover:text-white"
                  onClick={() => setCurrentStep('domain')}
                >
                  Back
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-white border-[#333333] hover:bg-[#222222]"
                  onClick={() => setCurrentStep('install')}
                >
                  I've generated credentials
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Install Step */}
          {currentStep === 'install' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400">
                Install the Split agent on your website using our CLI tool or manual setup
              </p>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-white mb-2">Option 1: Using the CLI (Recommended)</h3>
                  <div className="bg-[#0c0c0c] rounded p-3 font-mono text-xs text-white overflow-x-auto flex justify-between items-center">
                    <span>npx create-split</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-gray-400 hover:text-white hover:bg-[#222222]"
                      onClick={() => {
                        navigator.clipboard.writeText('npx create-split');
                      }}
                    >
                      <Clipboard className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-white mb-2">Option 2: Manual Installation</h3>
                  <p className="text-xs text-gray-400 mb-2">
                    Follow our documentation for manual installation steps
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-white border-[#333333] hover:bg-[#222222]"
                    onClick={() => window.open('https://docs.split.dev/installation', '_blank')}
                  >
                    View Documentation
                    <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-400 hover:text-white"
                  onClick={() => setCurrentStep('credentials')}
                >
                  Back
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-white border-[#333333] hover:bg-[#222222]"
                  onClick={() => setCurrentStep('verify')}
                >
                  Continue
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Verify Step */}
          {currentStep === 'verify' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400">
                Let's verify that your site is properly connected
              </p>
              
              <div className="bg-[#171717] border border-[#222222] rounded-lg p-4">
                <Button 
                  className="w-full bg-[#222222] hover:bg-[#2a2a2a] border border-[#333333]"
                  onClick={verifyConnection}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                      Verifying Connection...
                    </>
                  ) : (
                    <>
                      <RotateCw className="h-4 w-4 mr-2" />
                      Verify Connection
                    </>
                  )}
                </Button>
              </div>
              
              {error && (
                <p className="text-red-400 text-xs">{error}</p>
              )}
              
              <div className="flex justify-between">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-400 hover:text-white"
                  onClick={() => setCurrentStep('install')}
                >
                  Back
                </Button>
              </div>
            </div>
          )}
          
          {/* Complete Step */}
          {currentStep === 'complete' && (
            <div className="space-y-4 text-center">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="flex justify-center mb-4"
              >
                <div className="bg-green-500/20 text-green-300 border border-green-500/30 rounded-full p-4">
                  <CheckCircle className="h-8 w-8" />
                </div>
              </motion.div>
              
              <h3 className="text-lg font-medium text-white">
                Site Connected Successfully!
              </h3>
              
              <p className="text-xs text-gray-400">
                Your site is now connected to Split and ready to receive AI-optimized content.
              </p>
              
              <div className="pt-4">
                <Button 
                  className="w-full bg-gradient-to-r from-[#FF914D] to-[#FFEC9F] text-black hover:opacity-90"
                  onClick={() => window.location.href = '/dashboard'}
                >
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 