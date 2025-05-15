'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  KeyRound, 
  Search, 
  Tag, 
  Zap, 
  FileEdit, 
  Trash2, 
  MoreHorizontal
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [newKeyword, setNewKeyword] = useState('')
  
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
  
  return (
    <main className="flex flex-1 flex-col gap-8 p-8 overflow-auto bg-[#0c0c0c] bg-[radial-gradient(#222222_0.7px,transparent_0.7px)] bg-[size:24px_24px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Keywords</h1>
      </div>

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
    </main>
  )
} 