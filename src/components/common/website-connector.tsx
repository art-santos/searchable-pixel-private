'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Globe, 
  CheckCircle,
  ArrowRight,
  RotateCw,
  Clipboard,
  AlertCircle,
  Code
} from 'lucide-react';
import { motion } from 'framer-motion';
import SiteConnectionStatus from '@/components/common/site-connection-status';

type PlatformType = 'nextjs' | 'framer' | 'webflow' | 'other';
type ConnectorStep = 'platform' | 'domain' | 'install' | 'verify' | 'complete';

interface WebsiteConnectorProps {
  onComplete?: () => void;
}

export default function WebsiteConnector({ onComplete }: WebsiteConnectorProps = {}) {
  const [currentStep, setCurrentStep] = useState<ConnectorStep>('platform');
  const [platform, setPlatform] = useState<PlatformType | null>(null);
  const [domain, setDomain] = useState('');
  const [siteId, setSiteId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('unknown');

  const handlePlatformSelect = (selectedPlatform: PlatformType) => {
    setPlatform(selectedPlatform);
    
    if (selectedPlatform === 'nextjs') {
      setCurrentStep('domain');
    } else {
      // For other platforms, we'll just show the coming soon message
      // but stay on the platform step
    }
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
        setCurrentStep('install');
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
        setConnectionStatus(data.verification.status as any);
        
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
  
  const renderPlatformStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-white">How is your website built?</h3>
        <p className="text-sm text-gray-400 mt-1">Select your website platform to connect with Split</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Next.js Card - Supported */}
        <Card 
          className={`bg-[#171717] border-[#333333] cursor-pointer hover:border-[#FF914D]/70 hover:bg-[#1a1a1a] transition-colors ${platform === 'nextjs' ? 'border-[#FF914D] ring-1 ring-[#FF914D]/30' : ''}`}
          onClick={() => handlePlatformSelect('nextjs')}
        >
          <CardContent className="p-4 flex flex-col items-center justify-center space-y-4">
            <div className="rounded-full bg-[#222222] p-3">
              <Code className="h-6 w-6 text-white" />
            </div>
            <div className="text-center">
              <h4 className="text-sm font-medium text-white">Next.js</h4>
              <p className="text-xs text-gray-400 mt-1">App or Pages Router</p>
            </div>
            <Badge variant="success">Supported</Badge>
          </CardContent>
        </Card>
        
        {/* Framer Card - Beta */}
        <Card 
          className={`bg-[#171717] border-[#333333] cursor-pointer hover:border-[#FF914D]/70 hover:bg-[#1a1a1a] transition-colors ${platform === 'framer' ? 'border-[#FF914D] ring-1 ring-[#FF914D]/30' : ''}`}
          onClick={() => handlePlatformSelect('framer')}
        >
          <CardContent className="p-4 flex flex-col items-center justify-center space-y-4">
            <div className="rounded-full bg-[#222222] p-3">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M4 2h16v6.73h-8l8 .02v6.75h-8v6.5H4V2z"/>
              </svg>
            </div>
            <div className="text-center">
              <h4 className="text-sm font-medium text-white">Framer</h4>
              <p className="text-xs text-gray-400 mt-1">Framer sites</p>
            </div>
            <Badge variant="secondary" className="bg-orange-500/20 text-orange-300 border-orange-500/30">Beta</Badge>
          </CardContent>
        </Card>
        
        {/* Webflow Card - Supported */}
        <Card 
          className={`bg-[#171717] border-[#333333] cursor-pointer hover:border-[#FF914D]/70 hover:bg-[#1a1a1a] transition-colors ${platform === 'webflow' ? 'border-[#FF914D] ring-1 ring-[#FF914D]/30' : ''}`}
          onClick={() => handlePlatformSelect('webflow')}
        >
          <CardContent className="p-4 flex flex-col items-center justify-center space-y-4">
            <div className="rounded-full bg-[#222222] p-3">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 10.92c-1.203 0-2.181-.978-2.181-2.182 0-1.203.978-2.18 2.181-2.18 1.204 0 2.181.977 2.181 2.18 0 1.204-.977 2.181-2.181 2.181zm4.029 4.03c-1.203 0-2.181-.978-2.181-2.182 0-1.203.978-2.18 2.181-2.18 1.204 0 2.181.977 2.181 2.18 0 1.203-.977 2.181-2.181 2.181zM12 20c-1.203 0-2.181-.978-2.181-2.182 0-1.203.978-2.18 2.181-2.18 1.204 0 2.181.977 2.181 2.18 0 1.204-.977 2.181-2.181 2.181zm-4.029-5.05c-1.203 0-2.181-.978-2.181-2.182 0-1.203.978-2.18 2.181-2.18 1.204 0 2.181.977 2.181 2.18 0 1.203-.977 2.181-2.181 2.181z"/>
              </svg>
            </div>
            <div className="text-center">
              <h4 className="text-sm font-medium text-white">Webflow</h4>
              <p className="text-xs text-gray-400 mt-1">Webflow sites</p>
            </div>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">Lite</Badge>
          </CardContent>
        </Card>
        
        {/* Other Card - Coming Soon */}
        <Card 
          className={`bg-[#171717] border-[#333333] cursor-pointer hover:border-gray-500/50 hover:bg-[#1a1a1a] transition-colors ${platform === 'other' ? 'border-[#FF914D] ring-1 ring-[#FF914D]/30' : ''}`}
          onClick={() => handlePlatformSelect('other')}
        >
          <CardContent className="p-4 flex flex-col items-center justify-center space-y-4">
            <div className="rounded-full bg-[#222222] p-3">
              <Globe className="h-6 w-6 text-white" />
            </div>
            <div className="text-center">
              <h4 className="text-sm font-medium text-white">Other</h4>
              <p className="text-xs text-gray-400 mt-1">Custom websites</p>
            </div>
            <Badge variant="outline">Coming Soon</Badge>
          </CardContent>
        </Card>
      </div>
      
      {platform && platform !== 'nextjs' && platform !== 'webflow' && platform !== 'framer' && (
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-400 mr-3 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-white">Coming Soon</h4>
              <p className="text-xs text-gray-300 mt-1">
                Support for {getPlatformName(platform)} is coming soon! We're currently focusing on Next.js integration.
                Sign up for our waitlist to be notified when your platform is supported.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30"
                onClick={() => {
                  // Here you could implement a waitlist signup or just go back to Next.js
                  setPlatform(null);
                }}
              >
                Join Waitlist
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
  const renderDomainStep = () => (
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
        
        <div className="flex justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-400 hover:text-white"
            onClick={() => setCurrentStep('platform')}
          >
            Back
          </Button>
        </div>
      </div>
    </form>
  );
  
  const renderInstallStep = () => (
    <div className="space-y-4">
      <p className="text-xs text-gray-400">
        Install the Split agent on your website using our CLI tool
      </p>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-white mb-2">Install using the CLI</h3>
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
        
        <div className="pt-2">
          <h3 className="text-sm font-medium text-white mb-2">What happens next?</h3>
          <ul className="space-y-2 text-xs text-gray-400">
            <li className="flex items-start">
              <span className="bg-[#333333] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">1</span>
              <span>Run the command in your Next.js project root directory</span>
            </li>
            <li className="flex items-start">
              <span className="bg-[#333333] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">2</span>
              <span>The CLI will guide you through the installation process</span>
            </li>
            <li className="flex items-start">
              <span className="bg-[#333333] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">3</span>
              <span>Enter the API credentials when prompted</span>
            </li>
            <li className="flex items-start">
              <span className="bg-[#333333] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">4</span>
              <span>Deploy your site with the Split agent installed</span>
            </li>
          </ul>
        </div>
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
          onClick={() => setCurrentStep('verify')}
        >
          Continue
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </div>
  );
  
  const renderVerifyStep = () => (
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
      
      {siteId && connectionStatus !== 'unknown' && connectionStatus !== 'verifying' && (
        <SiteConnectionStatus 
          siteId={siteId} 
          initialStatus={connectionStatus as any} 
          domain={domain}
          lastPinged={null}
        />
      )}
      
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
  );
  
  const renderCompleteStep = () => (
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
          onClick={() => {
            // Call the onComplete callback if provided
            if (onComplete) {
              onComplete();
            }
            // Reload is likely not needed anymore, but we'll keep it as a fallback
            // window.location.reload();
          }}
        >
          Done
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
  
  const getPlatformName = (platform: PlatformType): string => {
    switch (platform) {
      case 'nextjs':
        return 'Next.js';
      case 'framer':
        return 'Framer';
      case 'webflow':
        return 'Webflow';
      case 'other':
        return 'Other platforms';
      default:
        return 'this platform';
    }
  };
  
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'platform':
        return renderPlatformStep();
      case 'domain':
        return renderDomainStep();
      case 'install':
        return renderInstallStep();
      case 'verify':
        return renderVerifyStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return renderPlatformStep();
    }
  };
  
  return (
    <Card className="bg-[#101010] border-[#222222] border shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-white">
          Connect Your Website
        </CardTitle>
        <CardDescription className="text-gray-400">
          Set up the connection between your website and Split
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {renderCurrentStep()}
      </CardContent>
    </Card>
  );
}

// Missing Badge component
const Badge = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'outline' | 'success' }) => {
  const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold";
  
  const variantClasses = {
    default: "bg-[#FF914D]/20 text-[#FF914D] border border-[#FF914D]/30",
    outline: "bg-[#333333] text-gray-300 border border-[#444444]",
    success: "bg-green-500/20 text-green-300 border border-green-500/30"
  };
  
  return (
    <span className={`${baseClasses} ${variantClasses[variant]}`}>
      {children}
    </span>
  );
}; 