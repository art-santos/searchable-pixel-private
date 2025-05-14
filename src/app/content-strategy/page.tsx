'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Plus, 
  FileText, 
  FileEdit,
  Lightbulb,
  PlusCircle,
  CalendarDays,
  BookCopy,
  Zap,
  Search,
  KeyRound,
  Clock,
  Upload,
  FileUp,
  AlignLeft,
  BarChart3,
  Sparkles,
  Tag,
  BookMarked,
  Settings,
  Shuffle,
  ListChecks,
  MessageSquare,
  FilePlus,
  Trash2,
  Bookmark,
  MoreHorizontal,
  ChevronDown,
  CheckCircle2,
  PauseCircle,
  Sliders
} from 'lucide-react'
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Keyword {
  id: string;
  keyword: string;
  status: 'planned' | 'drafted' | 'published' | 'indexed';
  difficulty: number;
  dateAdded: string;
}

interface ContentSettings {
  minLength: number;
  maxLength: number;
  frequency: number;
  useVariation: boolean;
  contentMix: {
    blog: number;
    article: number;
    social: number;
    guide: number;
  }
}

interface ContentPrompt {
  id: string;
  text: string;
  status: 'queued' | 'processing' | 'completed';
  type: 'blog' | 'article' | 'social' | 'guide';
  createdAt: string;
  wordCount?: number;
}

export default function ContentStrategy() {
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [newKeyword, setNewKeyword] = useState('')
  const [promptText, setPromptText] = useState('')
  const [contentSettings, setContentSettings] = useState<ContentSettings>({
    minLength: 800,
    maxLength: 2000,
    frequency: 2,
    useVariation: true,
    contentMix: {
      blog: 40,
      article: 30,
      social: 20,
      guide: 10
    }
  })
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [contentPrompts, setContentPrompts] = useState<ContentPrompt[]>([
    {
      id: '1',
      text: 'Write an article about AI Engine Optimization best practices for beginners',
      status: 'completed',
      type: 'article',
      createdAt: '2023-06-15T09:30:00Z',
      wordCount: 1240
    },
    {
      id: '2',
      text: 'Create a short guide explaining the difference between SEO and AEO for website owners',
      status: 'processing',
      type: 'guide',
      createdAt: '2023-06-15T10:45:00Z'
    },
    {
      id: '3',
      text: 'Draft a quick social media post about the importance of AI-friendly content',
      status: 'queued',
      type: 'social',
      createdAt: '2023-06-15T11:15:00Z'
    }
  ])
  
  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return
    
    const newKeywordObj: Keyword = {
      id: Date.now().toString(),
      keyword: newKeyword,
      status: 'planned',
      difficulty: Math.floor(Math.random() * 60) + 20, // Random difficulty between 20-80
      dateAdded: new Date().toISOString().split('T')[0]
    }
    
    setKeywords([...keywords, newKeywordObj])
    setNewKeyword('')
  }

  const updateContentMix = (type: keyof ContentSettings['contentMix'], value: number) => {
    // Calculate remaining percentage
    const others = Object.entries(contentSettings.contentMix).filter(([key]) => key !== type);
    const currentTotal = others.reduce((sum, [_, val]) => sum + val, 0);
    const remainingPercent = 100 - value;
    
    // Distribute the remaining percentage proportionally among other types
    const newMix = { ...contentSettings.contentMix, [type]: value };
    
    if (currentTotal > 0) {
      others.forEach(([key, val]) => {
        const ratio = val / currentTotal;
        newMix[key as keyof ContentSettings['contentMix']] = Math.round(remainingPercent * ratio);
      });
    }
    
    // Make sure the total is exactly 100%
    let total = Object.values(newMix).reduce((sum, val) => sum + val, 0);
    if (total !== 100) {
      const diff = 100 - total;
      const largestKey = Object.entries(newMix)
        .filter(([k]) => k !== type)
        .sort((a, b) => b[1] - a[1])[0][0] as keyof ContentSettings['contentMix'];
      newMix[largestKey] += diff;
    }
    
    setContentSettings({
      ...contentSettings,
      contentMix: newMix
    });
  }

  const getAverageWordCount = () => {
    if (contentSettings.useVariation) {
      const avg = Math.round((contentSettings.minLength + contentSettings.maxLength) / 2);
      return `~${avg} words (varied)`;
    }
    return `${contentSettings.minLength} words`;
  }
  
  const addContentPrompt = () => {
    if (!promptText.trim()) return;
    
    // Determine content type based on mix percentages (simplified)
    const rand = Math.random() * 100;
    let cumulative = 0;
    let selectedType: keyof ContentSettings['contentMix'] = 'blog';
    
    for (const [type, percentage] of Object.entries(contentSettings.contentMix)) {
      cumulative += percentage;
      if (rand <= cumulative) {
        selectedType = type as keyof ContentSettings['contentMix'];
        break;
      }
    }
    
    const newPrompt: ContentPrompt = {
      id: Date.now().toString(),
      text: promptText,
      status: 'queued',
      type: selectedType as 'blog' | 'article' | 'social' | 'guide',
      createdAt: new Date().toISOString()
    };
    
    setContentPrompts([newPrompt, ...contentPrompts]);
    setPromptText('');
  }
  
  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'queued':
      case 'processing':
      case 'completed':
      default:
        return 'bg-[#222222] text-gray-300 border-[#333333]';
    }
  }
  
  const getStatusBadgeStyle = () => {
    return {};
  }
  
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'queued':
        return <Clock className="h-3 w-3 mr-1" />;
      case 'processing':
        return <Shuffle className="h-3 w-3 mr-1" />;
      case 'completed':
        return <CheckCircle2 className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  }
  
  return (
    <main className="flex flex-1 flex-col gap-8 p-8 overflow-auto bg-[#0c0c0c] bg-[radial-gradient(#222222_0.7px,transparent_0.7px)] bg-[size:24px_24px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Content Strategy</h1>
        
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="border-[#222222] bg-[#161616] text-white hover:bg-[#1d1d1d] hover:text-white"
            >
              <Sliders className="h-4 w-4 mr-2" />
              Configuration
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-[#101010] border-[#222222] text-white">
            <DialogHeader>
              <DialogTitle className="text-xl">Content Strategy Settings</DialogTitle>
              <DialogDescription className="text-gray-400">
                Configure your content generation preferences and mix
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-6">
              {/* Content Length Range */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-white flex items-center gap-2">
                    <AlignLeft className="h-4 w-4 text-gray-400" />
                    Content Length
                  </Label>
                  <Badge className="bg-[#161616] text-gray-300 border-[#222222] h-7 px-3">
                    {getAverageWordCount()}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-4 mb-2">
                  <div className="flex-1">
                    <Label className="text-xs text-gray-400 mb-1 block">Min words</Label>
                    <Input 
                      type="number" 
                      className="bg-[#161616] border-[#222222] text-white h-8"
                      value={contentSettings.minLength}
                      onChange={(e) => setContentSettings({...contentSettings, minLength: Number(e.target.value)})}
                      min={300}
                      max={contentSettings.maxLength - 100}
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-gray-400 mb-1 block">Max words</Label>
                    <Input 
                      type="number" 
                      className="bg-[#161616] border-[#222222] text-white h-8"
                      value={contentSettings.maxLength}
                      onChange={(e) => setContentSettings({...contentSettings, maxLength: Number(e.target.value)})}
                      min={contentSettings.minLength + 100}
                      max={5000}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="variation" 
                    checked={contentSettings.useVariation}
                    onCheckedChange={(checked) => 
                      setContentSettings({...contentSettings, useVariation: checked === true})
                    }
                    className="border-[#222222] data-[state=checked]:bg-[#333333] data-[state=checked]:border-[#333333]"
                  />
                  <Label 
                    htmlFor="variation" 
                    className="text-sm text-gray-300 cursor-pointer"
                  >
                    Use variable word counts for natural variation
                  </Label>
                </div>
              </div>
              
              <Separator className="bg-[#222222]" />
              
              {/* Publishing Frequency */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-white flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    Publishing Frequency
                  </Label>
                  <span className="text-sm text-gray-300">{contentSettings.frequency} posts/week</span>
                </div>
                <Slider
                  value={[contentSettings.frequency]}
                  min={1}
                  max={7}
                  step={1}
                  onValueChange={(value) => setContentSettings({...contentSettings, frequency: value[0]})}
                  className="mt-2"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">Less frequent</span>
                  <span className="text-xs text-gray-500">More frequent</span>
                </div>
              </div>
              
              <Separator className="bg-[#222222]" />
              
              {/* Content Mix */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-white flex items-center gap-2">
                    <Shuffle className="h-4 w-4 text-gray-400" />
                    Content Mix
                  </Label>
                  <Badge className="bg-[#161616] text-gray-300 border-[#222222] h-7 px-3">
                    {Object.keys(contentSettings.contentMix).length} types
                  </Badge>
                </div>
                
                <p className="text-xs text-gray-400">Adjust the percentage of each content type in your strategy</p>
                
                <div className="space-y-3">
                  {Object.entries(contentSettings.contentMix).map(([type, percentage]) => (
                    <div key={type} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300 capitalize">{type}</span>
                        <span className="text-gray-400">{percentage}%</span>
                      </div>
                      <Slider
                        value={[percentage]}
                        min={0}
                        max={100}
                        step={5}
                        onValueChange={(value) => updateContentMix(type as keyof ContentSettings['contentMix'], value[0])}
                        className="mt-1"
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Content Mix Summary */}
              <div className="bg-[#161616] border border-[#222222] rounded-lg p-4">
                <h4 className="text-sm font-medium text-white mb-3">Content Mix Preview</h4>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(contentSettings.contentMix).map(([type, percentage]) => (
                    <div key={type} className="bg-[#1a1a1a] border border-[#222222] rounded-md p-3 text-center">
                      <div className="text-xl font-bold text-white mb-1">{percentage}%</div>
                      <div className="text-xs text-gray-400 capitalize">{type}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <DialogFooter className="border-t border-[#222222] pt-4">
              <Button 
                className="w-full bg-gradient-to-r from-[#222222] to-[#2a2a2a] text-white hover:from-[#282828] hover:to-[#333333] border border-[#333333]"
                onClick={() => setIsSettingsOpen(false)}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Apply Settings
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="strategy">
        <TabsList className="bg-[#0c0c0c] border-b border-[#222222] mb-6 rounded-none px-0 h-[40px] w-auto">
          <TabsTrigger 
            value="strategy" 
            className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[#FF914D] text-gray-400 rounded-none h-[40px] px-4"
          >
            Content Strategy
          </TabsTrigger>
          <TabsTrigger 
            value="keywords" 
            className="data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-[#FF914D] text-gray-400 rounded-none h-[40px] px-4"
          >
            Keywords
          </TabsTrigger>
        </TabsList>
        
        {/* Content Strategy Tab */}
        <TabsContent value="strategy" className="space-y-6">
          {/* Content Creation Input */}
          <Card className="bg-gradient-to-b from-[#101010] to-[#151515] border-[#222222] border shadow-lg">
            <CardHeader className="border-b border-[#222222]/50 pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl font-medium text-white flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#FF914D]" />
                    Content Creation
                  </CardTitle>
                  <p className="text-sm text-gray-400 mt-1">Quickly create optimized content using AI</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-300 mb-3">
                    Enter ideas, topics, or paste existing content to transform into optimized content
                  </div>
                  <Textarea 
                    className="min-h-[140px] bg-[#161616] border-[#222222] text-white placeholder:text-gray-500 focus:ring-[#FF914D]/20 focus:border-[#FF914D]/30"
                    placeholder="What would you like to create? E.g., 'Write an article about AI Engine Optimization best practices...' or paste content to rewrite"
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                  />
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-[#161616] border-[#222222] text-gray-400 h-8 px-3 hover:text-white"
                      >
                        <Upload className="h-3 w-3 mr-1" />
                        Upload File
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-[#161616] border-[#222222] text-gray-400 h-8 px-3 hover:text-white"
                      >
                        <PlusCircle className="h-3 w-3 mr-1" />
                        Add Reference
                      </Button>
                    </div>
                    
                    <Button 
                      className="bg-[#161616] hover:bg-[#1d1d1d] text-white border border-[#222222]"
                      onClick={addContentPrompt}
                      disabled={!promptText.trim()}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Generate Content
                    </Button>
                  </div>
                </div>
                <div className="px-4 py-3 bg-[#161616] rounded-md border border-[#222222] text-xs text-gray-400 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="font-medium">Content Settings:</div>
                    <div>
                      {contentSettings.frequency} posts/week • {getAverageWordCount()} • Mixed Content
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white h-6 px-2"
                    onClick={() => setIsSettingsOpen(true)}
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    <span className="text-xs">Edit</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Publishing Calendar */}
          <Card className="bg-[#101010] border-[#222222] border">
            <CardHeader className="border-b border-[#222222]/50 pb-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <CalendarDays className="h-4 w-4 text-gray-400 mr-2" />
                  <CardTitle className="text-md font-medium text-white">Publishing Calendar</CardTitle>
                </div>
                <Badge className="bg-[#161616] text-gray-300 border-[#222222] h-7 px-3">
                  {contentSettings.frequency} posts/week
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              {/* Calendar Preview - Empty State */}
              <div className="flex flex-col items-center justify-center text-center py-10">
                <div className="h-12 w-12 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-3 border border-[#222222]">
                  <CalendarDays className="h-6 w-6 text-gray-500" />
                </div>
                <h3 className="text-md font-medium text-white mb-2">No content scheduled</h3>
                <p className="text-sm text-gray-400 max-w-md mb-4">
                  Set up your publishing calendar to maintain a consistent content cadence
                </p>
                <Button 
                  variant="outline"
                  className="border-[#222222] bg-[#161616] text-white hover:bg-[#1d1d1d]"
                  onClick={() => setIsSettingsOpen(true)}
                >
                  <Sliders className="h-4 w-4 mr-2" />
                  Edit Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Content Queue */}
          <Card className="bg-[#101010] border-[#222222] border">
            <CardHeader className="border-b border-[#222222]/50 pb-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <ListChecks className="h-4 w-4 text-gray-400 mr-2" />
                  <CardTitle className="text-md font-medium text-white">Content Queue</CardTitle>
                </div>
                <Badge className="bg-[#161616] text-gray-300 border-[#222222] h-7 px-3">
                  {contentPrompts.length} items
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              {contentPrompts.length > 0 ? (
                <div className="space-y-3">
                  {contentPrompts.map((prompt) => (
                    <div 
                      key={prompt.id} 
                      className="p-3 bg-[#161616] border border-[#222222] rounded-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          <div className="bg-[#222222] rounded-full p-1.5 w-6 h-6 flex items-center justify-center">
                            {prompt.type === 'blog' && <BookMarked className="h-3 w-3 text-gray-400" />}
                            {prompt.type === 'article' && <FileText className="h-3 w-3 text-gray-400" />}
                            {prompt.type === 'social' && <FileUp className="h-3 w-3 text-gray-400" />}
                            {prompt.type === 'guide' && <BarChart3 className="h-3 w-3 text-gray-400" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <p className="text-xs text-gray-400">
                                {new Date(prompt.createdAt).toLocaleString(undefined, { 
                                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                              </p>
                              <Badge 
                                className={getStatusBadgeClass(prompt.status)}
                              >
                                {getStatusIcon(prompt.status)}
                                <span className="capitalize">{prompt.status}</span>
                              </Badge>
                              <Badge 
                                className="bg-[#222222] text-gray-300 border-[#333333]"
                              >
                                <span className="capitalize">{prompt.type}</span>
                              </Badge>
                              {prompt.wordCount && (
                                <p className="text-xs text-gray-400">
                                  {prompt.wordCount} words
                                </p>
                              )}
                            </div>
                            <p className="text-sm text-white">{prompt.text}</p>
                            
                            {/* Actions Row */}
                            <div className="mt-3 pt-2 flex gap-1">
                              {prompt.status === 'completed' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 px-2 text-gray-400 hover:text-white hover:bg-[#222222]"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 px-2 text-gray-400 hover:text-white hover:bg-[#222222]"
                              >
                                <FileEdit className="h-3.5 w-3.5" />
                              </Button>
                              {prompt.status === 'processing' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 px-2 text-gray-400 hover:text-white hover:bg-[#222222]"
                                >
                                  <PauseCircle className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 px-2 text-gray-400 hover:text-white hover:bg-[#222222]"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <Badge 
                          className="h-6 px-2 text-xs bg-[#161616] border-[#222222] text-gray-300 cursor-pointer hover:bg-[#222222] transition-colors"
                        >
                          {prompt.wordCount ? `${prompt.wordCount} words` : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-8">
                  <div className="h-12 w-12 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-3 border border-[#222222]">
                    <FilePlus className="h-6 w-6 text-gray-500" />
                  </div>
                  <h3 className="text-md font-medium text-white mb-2">Your content queue is empty</h3>
                  <p className="text-sm text-gray-400 max-w-md mb-4">
                    Create your first piece of content by entering a prompt
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Keywords Tab */}
        <TabsContent value="keywords" className="space-y-6">
          {/* Consolidated Keywords Management */}
          <Card className="bg-[#101010] border-[#222222] border shadow-md">
            <CardHeader className="border-b border-[#222222]/50 pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-medium text-white">Keywords</CardTitle>
                  <p className="text-sm text-gray-400 mt-1">Manage keywords for AI engine optimization</p>
                </div>
                <div className="flex items-center gap-3">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[160px] bg-[#161616] border-[#222222] text-white">
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#161616] border-[#222222] text-white">
                      <SelectGroup>
                        <SelectLabel>Keyword Type</SelectLabel>
                        <SelectItem value="all">All Keywords</SelectItem>
                        <SelectItem value="primary">Primary Keywords</SelectItem>
                        <SelectItem value="longtail">Long-tail Keywords</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="border-[#222222] text-white bg-[#161616] hover:bg-[#1d1d1d]"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Empty State */}
              {keywords.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-12">
                  <div className="h-16 w-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4 border border-[#222222]">
                    <KeyRound className="h-8 w-8 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No keywords tracked yet</h3>
                  <p className="text-sm text-gray-400 max-w-md mb-6">
                    Add keywords you want to target in AI engines or discover new keyword opportunities
                  </p>
                  <div className="flex gap-3">
                    <Button 
                      className="border border-[#333333] bg-gradient-to-r from-[#222222] to-[#2a2a2a] text-white hover:from-[#282828] hover:to-[#333333]"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Discover Keywords
                    </Button>
                    <Button 
                      variant="outline"
                      className="border-[#222222] text-white bg-[#161616] hover:bg-[#1d1d1d]"
                      onClick={() => document.getElementById('add-keyword-input')?.focus()}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Manually
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Keyword Table */}
                  <div className="rounded-md border border-[#222222] overflow-hidden">
                    <div className="grid grid-cols-12 gap-4 bg-[#161616] px-4 py-3 text-sm font-medium text-gray-400">
                      <div className="col-span-5">Keyword</div>
                      <div className="col-span-2">Type</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2">Difficulty</div>
                      <div className="col-span-1">Actions</div>
                    </div>
                    <div className="divide-y divide-[#222222]">
                      {keywords.map((keyword) => (
                        <div key={keyword.id} className="grid grid-cols-12 gap-4 px-4 py-3 items-center">
                          <div className="col-span-5 font-medium text-white">
                            {keyword.keyword}
                          </div>
                          <div className="col-span-2">
                            <Badge className="bg-[#222222] text-gray-300 border-[#333333]">
                              Primary
                            </Badge>
                          </div>
                          <div className="col-span-2">
                            <Badge className="bg-[#222222] text-gray-300 border-[#333333]">
                              {keyword.status}
                            </Badge>
                          </div>
                          <div className="col-span-2">
                            <div className="w-full bg-[#222222] h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-[#333333] h-full rounded-full"
                                style={{ width: `${keyword.difficulty}%` }}
                              ></div>
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="text-[10px] text-gray-500">Easy</span>
                              <span className="text-[10px] text-gray-500">{keyword.difficulty}%</span>
                              <span className="text-[10px] text-gray-500">Hard</span>
                            </div>
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                  <MoreHorizontal className="h-4 w-4 text-gray-400" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-[#161616] border-[#222222] text-white">
                                <DropdownMenuItem className="focus:bg-[#222222] focus:text-white cursor-pointer">
                                  <FileEdit className="h-4 w-4 mr-2" />
                                  <span>Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="focus:bg-[#222222] focus:text-white cursor-pointer">
                                  <Tag className="h-4 w-4 mr-2" />
                                  <span>Change Type</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-[#222222]" />
                                <DropdownMenuItem className="focus:bg-[#222222] focus:text-white cursor-pointer text-red-400 focus:text-red-400">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Add Keyword Row */}
                  <div className="flex items-end gap-4 mt-6 pt-4 border-t border-[#222222]">
                    <div className="flex-1">
                      <Label className="text-xs text-gray-400 mb-1.5 block">Add new keyword</Label>
                      <Input
                        id="add-keyword-input"
                        className="bg-[#161616] border-[#222222] text-white placeholder:text-gray-500"
                        placeholder="Enter keyword or phrase..."
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                      />
                    </div>
                    <div className="w-[140px]">
                      <Label className="text-xs text-gray-400 mb-1.5 block">Type</Label>
                      <Select defaultValue="primary">
                        <SelectTrigger className="bg-[#161616] border-[#222222] text-white">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#161616] border-[#222222] text-white">
                          <SelectGroup>
                            <SelectItem value="primary">Primary</SelectItem>
                            <SelectItem value="longtail">Long-tail</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      className="bg-[#161616] hover:bg-[#1d1d1d] text-white border border-[#222222] h-10"
                      onClick={handleAddKeyword}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Primary Keywords Performance */}
            <Card className="bg-[#101010] border-[#222222] border shadow-md">
              <CardHeader className="border-b border-[#222222]/50 pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-medium text-white">Primary Keywords</CardTitle>
                  <Badge className="bg-[#161616] text-gray-400 border-[#222222] h-7 px-3">
                    No Data
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center text-center py-8">
                  <div className="h-14 w-14 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4 border border-[#222222]">
                    <Tag className="h-6 w-6 text-gray-500" />
                  </div>
                  <h3 className="text-md font-medium text-white mb-2">No performance data</h3>
                  <p className="text-sm text-gray-400 max-w-md mb-4">
                    Track how your primary keywords perform across AI engines
                  </p>
                  <Button 
                    variant="outline"
                    className="border-[#222222] text-white bg-[#161616] hover:bg-[#1d1d1d]"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Analyze Keywords
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Long-tail Keywords Performance */}
            <Card className="bg-[#101010] border-[#222222] border shadow-md">
              <CardHeader className="border-b border-[#222222]/50 pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-medium text-white">Long-tail Keywords</CardTitle>
                  <Badge className="bg-[#161616] text-gray-400 border-[#222222] h-7 px-3">
                    No Data
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center text-center py-8">
                  <div className="h-14 w-14 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4 border border-[#222222]">
                    <KeyRound className="h-6 w-6 text-gray-500" />
                  </div>
                  <h3 className="text-md font-medium text-white mb-2">No performance data</h3>
                  <p className="text-sm text-gray-400 max-w-md mb-4">
                    Track how long-tail phrases perform in conversational AI
                  </p>
                  <Button 
                    variant="outline"
                    className="border-[#222222] text-white bg-[#161616] hover:bg-[#1d1d1d]"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Generate Phrases
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  )
} 