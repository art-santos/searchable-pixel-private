'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronDown, 
  Filter, 
  Search, 
  MoreHorizontal,
  Copy,
  Edit3,
  Trash2,
  Calendar,
  Tag,
  FileText,
  Check,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { toast } from '@/components/ui/use-toast'

interface KnowledgeItem {
  id: string
  content: string
  tag: string
  created_at?: string
  updated_at?: string
  wordCount?: number
  confidenceScore?: number
}

interface KnowledgeTableProps {
  items: KnowledgeItem[]
  availableTags: { value: string; label: string }[]
  onUpdateItem: (id: string, updates: Partial<KnowledgeItem>) => Promise<void>
  onDeleteItem: (id: string) => Promise<void>
  onCopyItem: (content: string) => void
  isLoading?: boolean
}

interface ContextMenu {
  x: number
  y: number
  itemId: string
}

interface EditingCell {
  itemId: string
  field: 'content' | 'tag'
  value: string
}

export function KnowledgeTable({
  items,
  availableTags,
  onUpdateItem,
  onDeleteItem,
  onCopyItem,
  isLoading = false
}: KnowledgeTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'created_at' | 'updated_at' | 'content' | 'tag'>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null)
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  // Handle click outside to close context menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [editingCell])

  // Filter and sort items
  const filteredItems = items
    .filter(item => {
      const matchesSearch = !searchQuery || 
        item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getTagLabel(item.tag).toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesTags = selectedTags.length === 0 || selectedTags.includes(item.tag)
      
      return matchesSearch && matchesTags
    })
    .sort((a, b) => {
      let aValue: string | number | Date
      let bValue: string | number | Date
      
      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at || '')
          bValue = new Date(b.created_at || '')
          break
        case 'updated_at':
          aValue = new Date(a.updated_at || '')
          bValue = new Date(b.updated_at || '')
          break
        case 'content':
          aValue = a.content.toLowerCase()
          bValue = b.content.toLowerCase()
          break
        case 'tag':
          aValue = getTagLabel(a.tag).toLowerCase()
          bValue = getTagLabel(b.tag).toLowerCase()
          break
        default:
          return 0
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
      return 0
    })

  const getTagLabel = (tag: string) => {
    return availableTags.find(t => t.value === tag)?.label || tag
  }

  const getTagColor = (tag: string) => {
    const colors: Record<string, string> = {
      'company-overview': 'bg-blue-500/20 text-blue-300',
      'target-audience': 'bg-green-500/20 text-green-300',
      'pain-points': 'bg-red-500/20 text-red-300',
      'positioning': 'bg-purple-500/20 text-purple-300',
      'product-features': 'bg-orange-500/20 text-orange-300',
      'use-cases': 'bg-cyan-500/20 text-cyan-300',
      'competitor-notes': 'bg-yellow-500/20 text-yellow-300',
      'sales-objections': 'bg-pink-500/20 text-pink-300',
      'brand-voice': 'bg-indigo-500/20 text-indigo-300',
      'keywords': 'bg-emerald-500/20 text-emerald-300',
      'other': 'bg-gray-500/20 text-gray-300'
    }
    return colors[tag] || colors['other']
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
  }

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const handleTagFilter = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const handleContextMenu = (event: React.MouseEvent, itemId: string) => {
    event.preventDefault()
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      itemId
    })
  }

  const handleDoubleClick = (itemId: string, field: 'content' | 'tag', currentValue: string) => {
    setEditingCell({ itemId, field, value: currentValue })
    setContextMenu(null)
  }

  const handleEditSave = async () => {
    if (!editingCell) return
    
    try {
      await onUpdateItem(editingCell.itemId, {
        [editingCell.field]: editingCell.value
      })
      setEditingCell(null)
      toast({
        title: 'Updated successfully',
        description: `${editingCell.field === 'content' ? 'Content' : 'Tag'} has been updated`
      })
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'There was an error updating the item',
        variant: 'destructive'
      })
    }
  }

  const handleEditCancel = () => {
    setEditingCell(null)
  }

  const handleEditKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleEditSave()
    } else if (event.key === 'Escape') {
      handleEditCancel()
    }
  }

  const contextMenuItem = items.find(item => item.id === contextMenu?.itemId)

  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg overflow-hidden">
      {/* Table Header with Filters */}
      <div className="bg-[#111] border-b border-[#1a1a1a] p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-medium text-white">Knowledge Base</h3>
            <span className="text-xs text-[#666]">
              {filteredItems.length} of {items.length} items
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#666]" />
              <Input
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#0a0a0a] border-[#1a1a1a] hover:border-[#2a2a2a] focus:border-[#3a3a3a] text-white h-8 pl-9 pr-3 w-64"
              />
            </div>

            {/* Tag Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 border-[#1a1a1a] hover:border-[#2a2a2a] bg-[#0a0a0a] text-white"
                >
                  <Tag className="w-4 h-4 mr-2" />
                  Tags
                  {selectedTags.length > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 text-xs">
                      {selectedTags.length}
                    </Badge>
                  )}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {availableTags.map((tag) => (
                  <DropdownMenuCheckboxItem
                    key={tag.value}
                    checked={selectedTags.includes(tag.value)}
                    onCheckedChange={() => handleTagFilter(tag.value)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getTagColor(tag.value).split(' ')[0]}`} />
                      {tag.label}
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
                {selectedTags.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSelectedTags([])}>
                      Clear filters
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto max-h-[60vh]">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <FileText className="w-8 h-8 text-[#333] mx-auto mb-2" />
              <p className="text-sm text-[#666]">
                {items.length === 0 ? 'No knowledge items yet' : 'No items match your filters'}
              </p>
            </div>
          </div>
        ) : (
          <table className="w-full">
            {/* Table Headers */}
            <thead className="bg-[#0f0f0f] border-b border-[#1a1a1a] sticky top-0">
              <tr>
                <th className="text-left p-3 text-xs font-medium text-[#888] uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('content')}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    Content
                    {sortBy === 'content' && (
                      <ChevronDown className={`w-3 h-3 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                    )}
                  </button>
                </th>
                <th className="text-left p-3 text-xs font-medium text-[#888] uppercase tracking-wider w-48">
                  <button
                    onClick={() => handleSort('tag')}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    Tag
                    {sortBy === 'tag' && (
                      <ChevronDown className={`w-3 h-3 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                    )}
                  </button>
                </th>
                <th className="text-left p-3 text-xs font-medium text-[#888] uppercase tracking-wider w-32">
                  <button
                    onClick={() => handleSort('created_at')}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    Date Added
                    {sortBy === 'created_at' && (
                      <ChevronDown className={`w-3 h-3 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                    )}
                  </button>
                </th>
                <th className="text-left p-3 text-xs font-medium text-[#888] uppercase tracking-wider w-20">
                  Words
                </th>
                <th className="w-8"></th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-[#1a1a1a]">
              {filteredItems.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-[#111] transition-colors group"
                  onContextMenu={(e) => handleContextMenu(e, item.id)}
                >
                  {/* Content Cell */}
                  <td className="p-3">
                    {editingCell?.itemId === item.id && editingCell.field === 'content' ? (
                      <div className="flex items-center gap-2">
                        <Input
                          ref={editInputRef}
                          value={editingCell.value}
                          onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                          onKeyDown={handleEditKeyDown}
                          className="bg-[#0a0a0a] border-[#333] text-white text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={handleEditSave}
                          className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleEditCancel}
                          className="h-8 w-8 p-0 border-[#333]"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div
                        className="text-white text-sm leading-relaxed cursor-text hover:bg-[#1a1a1a] p-2 -m-2 rounded"
                        onDoubleClick={() => handleDoubleClick(item.id, 'content', item.content)}
                      >
                        {item.content}
                      </div>
                    )}
                  </td>

                  {/* Tag Cell */}
                  <td className="p-3">
                    {editingCell?.itemId === item.id && editingCell.field === 'tag' ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={editingCell.value}
                          onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                          onKeyDown={handleEditKeyDown}
                          className="bg-[#0a0a0a] border border-[#333] text-white text-sm rounded px-2 py-1"
                        >
                          {availableTags.map((tag) => (
                            <option key={tag.value} value={tag.value}>
                              {tag.label}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          onClick={handleEditSave}
                          className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleEditCancel}
                          className="h-8 w-8 p-0 border-[#333]"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Badge
                        className={`${getTagColor(item.tag)} cursor-pointer hover:scale-105 transition-transform`}
                        onDoubleClick={() => handleDoubleClick(item.id, 'tag', item.tag)}
                      >
                        {getTagLabel(item.tag)}
                      </Badge>
                    )}
                  </td>

                  {/* Date Cell */}
                  <td className="p-3 text-[#666] text-sm">
                    {formatDate(item.created_at)}
                  </td>

                  {/* Word Count Cell */}
                  <td className="p-3 text-[#666] text-sm">
                    {item.wordCount || item.content.split(' ').length}
                  </td>

                  {/* Actions Cell */}
                  <td className="p-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleContextMenu(e, item.id)}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && contextMenuItem && (
          <motion.div
            ref={contextMenuRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl py-1 min-w-[160px]"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
          >
            <button
              onClick={() => {
                onCopyItem(contextMenuItem.content)
                setContextMenu(null)
                toast({
                  title: 'Copied to clipboard',
                  description: 'Content has been copied'
                })
              }}
              className="w-full px-3 py-2 text-left text-white hover:bg-[#2a2a2a] transition-colors flex items-center gap-2 text-sm"
            >
              <Copy className="w-4 h-4" />
              Copy content
            </button>
            
            <button
              onClick={() => {
                handleDoubleClick(contextMenuItem.id, 'content', contextMenuItem.content)
                setContextMenu(null)
              }}
              className="w-full px-3 py-2 text-left text-white hover:bg-[#2a2a2a] transition-colors flex items-center gap-2 text-sm"
            >
              <Edit3 className="w-4 h-4" />
              Edit content
            </button>
            
            <button
              onClick={() => {
                handleDoubleClick(contextMenuItem.id, 'tag', contextMenuItem.tag)
                setContextMenu(null)
              }}
              className="w-full px-3 py-2 text-left text-white hover:bg-[#2a2a2a] transition-colors flex items-center gap-2 text-sm"
            >
              <Tag className="w-4 h-4" />
              Change tag
            </button>
            
            <div className="border-t border-[#333] my-1"></div>
            
            <button
              onClick={() => {
                onDeleteItem(contextMenuItem.id)
                setContextMenu(null)
              }}
              className="w-full px-3 py-2 text-left text-red-400 hover:bg-[#2a2a2a] transition-colors flex items-center gap-2 text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Delete item
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 