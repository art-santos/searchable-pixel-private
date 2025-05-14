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
  Rocket
} from 'lucide-react'

export default function SiteConnector() {
  const [siteConnected, setSiteConnected] = useState(false)
  const [activeTab, setActiveTab] = useState("sitemap")

  // CSS styles for custom badges to match the dashboard
  const customBadgeClass = "bg-transparent border border-[#FF914D] text-white h-7 px-3";
  const customBadgeStyle = {
    background: "linear-gradient(to bottom, rgba(255, 145, 77, 0.3), rgba(255, 236, 159, 0.3))"
  };
  
  return (
    <main className="flex flex-1 flex-col gap-8 p-8 overflow-auto bg-[#0c0c0c] bg-[radial-gradient(#222222_0.7px,transparent_0.7px)] bg-[size:24px_24px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Site Connector</h1>
          <p className="text-gray-400 text-sm mt-1">Configure your website connection for AI optimization</p>
        </div>
        
        <Button 
          className="bg-gradient-to-r from-[#222222] to-[#2a2a2a] text-white hover:from-[#282828] hover:to-[#333333] border border-[#333333]"
          onClick={() => setSiteConnected(!siteConnected)}
        >
          <Globe className="h-4 w-4 mr-2" />
          {siteConnected ? "Reconnect Site" : "Connect Site"}
        </Button>
      </div>

      {/* Connection Status Card */}
      <Card className="bg-[#101010] border-[#222222] border shadow-md">
        <CardContent className="pt-6 px-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-400">Connection Status</p>
              <h2 className="text-2xl font-bold text-white mt-1">
                {siteConnected ? "Connected" : "Not Connected"}
              </h2>
            </div>
            <div className="rounded-full bg-[#1a1a1a] p-2 border border-[#222222]">
              <Globe className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs">
            {siteConnected ? (
              <Badge className={customBadgeClass} style={customBadgeStyle}>
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge className="bg-[#222222] text-gray-400 border-[#333333]/30 h-6 px-2">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
      
      {!siteConnected ? (
        // Empty state when site is not connected
        <Card className="bg-[#101010] border-[#222222] border shadow-md">
          <CardContent className="pt-8 px-6 pb-8">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4 border border-[#222222]">
                <Globe className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Connect your website</h3>
              <p className="text-sm text-gray-400 max-w-md mb-6">
                Connect your website to access sitemap and configure llms.txt for optimized AI visibility
              </p>
              <div className="space-y-4 max-w-md w-full">
                <div className="rounded-md bg-[#161616] border border-[#222222] p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-[#222222] h-8 w-8 flex items-center justify-center flex-shrink-0">
                      <LinkIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white mb-1">Enter your website URL</h4>
                      <p className="text-xs text-gray-400">Provide the URL of your site to begin the connection process</p>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-md bg-[#161616] border border-[#222222] p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-[#222222] h-8 w-8 flex items-center justify-center flex-shrink-0">
                      <FilePlus className="h-4 w-4 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white mb-1">Set up llms.txt file</h4>
                      <p className="text-xs text-gray-400">Configure how AI engines should crawl and index your content</p>
                    </div>
                  </div>
                </div>
                
                <div className="rounded-md bg-[#161616] border border-[#222222] p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-[#222222] h-8 w-8 flex items-center justify-center flex-shrink-0">
                      <Rocket className="h-4 w-4 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white mb-1">Start optimization</h4>
                      <p className="text-xs text-gray-400">Once connected, we'll analyze your sitemap and boost your AI visibility</p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-gradient-to-r from-[#222222] to-[#2a2a2a] text-white hover:from-[#282828] hover:to-[#333333] border border-[#333333]"
                  onClick={() => setSiteConnected(true)}
                >
                  Connect Site Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Content when site is connected
        <>
          {/* Tabs for Sitemap and llms.txt */}
          <Tabs 
            defaultValue="sitemap" 
            className="w-full" 
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <div className="border-b border-[#222222]">
              <TabsList className="bg-transparent border-b-0 p-0">
                <TabsTrigger 
                  value="sitemap" 
                  className="py-2.5 px-4 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[#FF914D] text-gray-400 hover:text-gray-200"
                >
                  Sitemap
                </TabsTrigger>
                <TabsTrigger 
                  value="llms" 
                  className="py-2.5 px-4 rounded-none data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[#FF914D] text-gray-400 hover:text-gray-200"
                >
                  llms.txt
                </TabsTrigger>
              </TabsList>
            </div>
            
            {/* Sitemap Content */}
            <TabsContent value="sitemap" className="pt-6">
              <Card className="bg-[#101010] border-[#222222] border shadow-md">
                <CardHeader className="border-b border-[#222222]/50 pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-medium text-white">Sitemap Management</CardTitle>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        className="bg-[#161616] border-[#222222] text-white hover:bg-[#1d1d1d]"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <Button 
                        size="sm"
                        className="bg-gradient-to-r from-[#222222] to-[#2a2a2a] text-white hover:from-[#282828] hover:to-[#333333] border border-[#333333]"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center text-center py-12">
                    <div className="h-16 w-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4 border border-[#222222]">
                      <LinkIcon className="h-8 w-8 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No sitemap detected</h3>
                    <p className="text-sm text-gray-400 max-w-md mb-6">
                      Upload your existing sitemap or let us generate one by crawling your website
                    </p>
                    <div className="flex gap-4">
                      <Button 
                        variant="outline"
                        className="border-[#333333] bg-[#161616] text-white hover:bg-[#1d1d1d]"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Sitemap
                      </Button>
                      <Button 
                        className="bg-gradient-to-r from-[#222222] to-[#2a2a2a] text-white hover:from-[#282828] hover:to-[#333333] border border-[#333333]"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Generate Sitemap
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* llms.txt Content */}
            <TabsContent value="llms" className="pt-6">
              <Card className="bg-[#101010] border-[#222222] border shadow-md">
                <CardHeader className="border-b border-[#222222]/50 pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-medium text-white">llms.txt Configuration</CardTitle>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        className="bg-[#161616] border-[#222222] text-white hover:bg-[#1d1d1d]"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button 
                        size="sm"
                        className="bg-gradient-to-r from-[#222222] to-[#2a2a2a] text-white hover:from-[#282828] hover:to-[#333333] border border-[#333333]"
                      >
                        <FileCode className="h-4 w-4 mr-2" />
                        Generate
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center text-center py-12">
                    <div className="h-16 w-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4 border border-[#222222]">
                      <FileCode className="h-8 w-8 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No llms.txt file configured</h3>
                    <p className="text-sm text-gray-400 max-w-md mb-6">
                      Configure your llms.txt file to control how AI engines crawl and use your content
                    </p>
                    <div className="flex gap-4">
                      <Button 
                        variant="outline"
                        className="border-[#333333] bg-[#161616] text-white hover:bg-[#1d1d1d]"
                      >
                        <Info className="h-4 w-4 mr-2" />
                        Learn More
                      </Button>
                      <Button 
                        className="bg-gradient-to-r from-[#222222] to-[#2a2a2a] text-white hover:from-[#282828] hover:to-[#333333] border border-[#333333]"
                      >
                        <FileCode className="h-4 w-4 mr-2" />
                        Configure llms.txt
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* llms.txt Info Card */}
              <Card className="bg-[#101010] border-[#222222] border shadow-md mt-6">
                <CardHeader className="border-b border-[#222222]/50 pb-4">
                  <CardTitle className="text-lg font-medium text-white">What is llms.txt?</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="border border-[#222222] rounded-lg p-5">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-md font-medium text-white">Crawl Control</h3>
                        <Info className="h-4 w-4 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-400">
                        Specify which AI models are allowed to crawl and index your content
                      </p>
                    </div>
                    
                    <div className="border border-[#222222] rounded-lg p-5">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-md font-medium text-white">Content Rules</h3>
                        <Info className="h-4 w-4 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-400">
                        Set rules for how your content can be used in AI-generated responses
                      </p>
                    </div>
                    
                    <div className="border border-[#222222] rounded-lg p-5">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-md font-medium text-white">Path Management</h3>
                        <Info className="h-4 w-4 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-400">
                        Control which sections of your site can be indexed by AI engines
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </main>
  )
} 