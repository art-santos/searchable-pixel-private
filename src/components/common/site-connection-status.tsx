'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  HelpCircle,
  ArrowUpRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'unknown' | 'mismatch' | 'verifying';

interface SiteConnectionStatusProps {
  siteId: string;
  initialStatus: ConnectionStatus;
  domain: string;
  lastPinged?: string | null;
}

export default function SiteConnectionStatus({ 
  siteId, 
  initialStatus, 
  domain, 
  lastPinged 
}: SiteConnectionStatusProps) {
  const [status, setStatus] = useState<ConnectionStatus>(initialStatus);
  const [isVerifying, setIsVerifying] = useState(false);
  const [lastVerified, setLastVerified] = useState<string | null>(lastPinged || null);
  
  const getStatusBadge = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
            <CheckCircle className="h-3.5 w-3.5 mr-1" />
            Connected
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
            <XCircle className="h-3.5 w-3.5 mr-1" />
            Disconnected
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
            <AlertCircle className="h-3.5 w-3.5 mr-1" />
            Connection Error
          </Badge>
        );
      case 'mismatch':
        return (
          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
            <AlertCircle className="h-3.5 w-3.5 mr-1" />
            Mismatch
          </Badge>
        );
      case 'verifying':
        return (
          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
            <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
            Verifying
          </Badge>
        );
      case 'unknown':
      default:
        return (
          <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/30">
            <HelpCircle className="h-3.5 w-3.5 mr-1" />
            Unknown
          </Badge>
        );
    }
  };
  
  const verifyConnection = async () => {
    setIsVerifying(true);
    setStatus('verifying');
    
    try {
      const response = await fetch(`/api/verify-site-connection?site_id=${siteId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success && data.verification) {
        setStatus(data.verification.status as ConnectionStatus);
        setLastVerified(new Date().toISOString());
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Error verifying connection:', error);
      setStatus('error');
    } finally {
      setIsVerifying(false);
    }
  };
  
  return (
    <div className="bg-[#171717] border border-[#333333] rounded-lg p-4">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-white">Connection Status</h3>
          {getStatusBadge(status)}
        </div>
        
        <div className="flex items-center text-xs text-gray-400">
          <span className="mr-1">Domain:</span>
          <span className="text-white font-medium">{domain}</span>
          
          <a 
            href={`https://${domain}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="ml-2 text-blue-400 hover:text-blue-300 flex items-center"
          >
            <ArrowUpRight className="h-3 w-3 ml-0.5" />
            <span className="sr-only">Visit site</span>
          </a>
        </div>
        
        {lastVerified && (
          <div className="text-xs text-gray-500">
            Last checked: {formatDistanceToNow(new Date(lastVerified), { addSuffix: true })}
          </div>
        )}
        
        <Button
          variant="outline"
          size="sm"
          className="mt-3 border-[#333333] bg-[#222222] hover:bg-[#2a2a2a] w-full"
          onClick={verifyConnection}
          disabled={isVerifying}
        >
          {isVerifying ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Connection
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 