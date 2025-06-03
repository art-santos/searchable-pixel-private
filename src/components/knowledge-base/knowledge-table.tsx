'use client'

import { useState, useRef, useEffect } from 'react'
import { Copy, Trash2, Tag as TagIcon, MoreHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

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
  content: string
  originalContent: string
}

export function KnowledgeTable({
  items,
  availableTags,
  onUpdateItem,
  onDeleteItem,
  onCopyItem,
  isLoading = false
}: KnowledgeTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletingProgress, setDeletingProgress] = useState({ current: 0, total: 0 })
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [expandedCell, setExpandedCell] = useState<string | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const getTagLabel = (tag: string) => {
    return availableTags.find(t => t.value === tag)?.label || tag
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recent'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'Recent'
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
  }

  const truncateContent = (content: string, maxLength: number = 120) => {
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength) + '...'
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(items.map(item => item.id)))
    } else {
      setSelectedRows(new Set())
    }
  }

  const handleSelectRow = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedRows)
    if (checked) {
      newSelected.add(itemId)
    } else {
      newSelected.delete(itemId)
    }
    setSelectedRows(newSelected)
  }

  const handleBulkDelete = async () => {
    if (isDeleting) return
    
    const itemsToDelete = Array.from(selectedRows)
    setIsDeleting(true)
    setDeletingProgress({ current: 0, total: itemsToDelete.length })

    try {
      for (let i = 0; i < itemsToDelete.length; i++) {
        setDeletingProgress({ current: i + 1, total: itemsToDelete.length })
        await onDeleteItem(itemsToDelete[i])
        // Small delay to show progress
        if (i < itemsToDelete.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      setSelectedRows(new Set())
    } catch (error) {
      console.error('Error during bulk delete:', error)
    } finally {
      setIsDeleting(false)
      setDeletingProgress({ current: 0, total: 0 })
    }
  }

  const handleContextMenu = (event: React.MouseEvent, itemId: string) => {
    event.preventDefault()
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      itemId
    })
  }

  const handleContentDoubleClick = (item: KnowledgeItem) => {
    setExpandedCell(item.id)
    setEditingCell({ 
      itemId: item.id, 
      content: item.content,
      originalContent: item.content
    })
  }

  const handleContentChange = (newContent: string) => {
    if (editingCell) {
      setEditingCell({ ...editingCell, content: newContent })
    }
  }

  const handleBlur = async () => {
    if (!editingCell) return
    
    // Auto-save if content changed
    if (editingCell.content !== editingCell.originalContent) {
      try {
        await onUpdateItem(editingCell.itemId, { content: editingCell.content })
      } catch (error) {
        console.error('Failed to save edit:', error)
        // Revert on error
        setEditingCell({ ...editingCell, content: editingCell.originalContent })
        return
      }
    }
    
    // Close editing
    setEditingCell(null)
    setExpandedCell(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Revert and close
      if (editingCell) {
        setEditingCell({ ...editingCell, content: editingCell.originalContent })
      }
      setEditingCell(null)
      setExpandedCell(null)
    } else if (e.key === 'Enter' && e.metaKey) {
      // Save and close
      textareaRef.current?.blur()
    }
  }

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

  // Auto-focus textarea when editing starts
  useEffect(() => {
    if (editingCell && textareaRef.current) {
      const textarea = textareaRef.current
      textarea.focus()
      textarea.setSelectionRange(textarea.value.length, textarea.value.length)
    }
  }, [editingCell])

  const contextMenuItem = items.find(item => item.id === contextMenu?.itemId)

  const isAllSelected = items.length > 0 && selectedRows.size === items.length
  const isIndeterminate = selectedRows.size > 0 && selectedRows.size < items.length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-5 h-5 border border-[#333] border-t-white rounded-full" />
      </div>
    )
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className="w-full">
      {/* Elegant Bulk Actions Bar */}
      {selectedRows.size > 0 && (
        <div 
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          style={{
            animation: 'slideUp 0.2s ease-out'
          }}
        >
          <div className="bg-[#111]/95 border border-[#333] shadow-2xl backdrop-blur-xl px-6 py-4 min-w-[320px]">
            <div className="flex items-center justify-between">
              {isDeleting ? (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 animate-spin border-2 border-red-500 border-t-transparent rounded-full" />
                  <span className="text-white text-sm font-medium">
                    Deleting {deletingProgress.current} of {deletingProgress.total}...
                  </span>
                </div>
              ) : (
                <span className="text-white text-sm font-medium">
                  {selectedRows.size} item{selectedRows.size !== 1 ? 's' : ''} selected
                </span>
              )}
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRows(new Set())}
                  disabled={isDeleting}
                  className="h-8 px-3 text-[#888] hover:text-white hover:bg-[#1a1a1a] border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={isDeleting}
                  className="h-8 px-4 border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-3.5 h-3.5 animate-spin border border-current border-t-transparent rounded-full mr-2" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table with smooth content expansion */}
      <div className="border border-[#1a1a1a] rounded-lg overflow-hidden">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-12" />
            <col className="w-auto" />
            <col className="w-48" />
            <col className="w-28" />
            <col className="w-20" />
          </colgroup>
          <thead>
            <tr className="border-b border-[#1a1a1a] bg-[#0a0a0a]">
              <th className="text-left py-3 px-4 border-r border-[#1a1a1a]">
                <Checkbox
                  checked={isAllSelected || isIndeterminate}
                  onCheckedChange={handleSelectAll}
                  className={`border-[#333] data-[state=checked]:bg-white data-[state=checked]:border-white ${
                    isIndeterminate ? 'data-[state=checked]:bg-gray-400' : ''
                  }`}
                />
              </th>
              <th className="text-left py-3 px-4 border-r border-[#1a1a1a] text-[#888] text-xs font-medium uppercase tracking-wide">
                Content
              </th>
              <th className="text-left py-3 px-4 border-r border-[#1a1a1a] text-[#888] text-xs font-medium uppercase tracking-wide">
                Category
              </th>
              <th className="text-left py-3 px-4 border-r border-[#1a1a1a] text-[#888] text-xs font-medium uppercase tracking-wide">
                Added
              </th>
              <th className="text-left py-3 px-4 text-[#888] text-xs font-medium uppercase tracking-wide">
                Words
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr
                key={item.id}
                className={`border-b border-[#1a1a1a] hover:bg-[#0a0a0a] transition-colors ${
                  selectedRows.has(item.id) ? 'bg-[#0a0a0a]' : 'bg-transparent'
                }`}
                onMouseEnter={() => setHoveredRow(item.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onContextMenu={(e) => handleContextMenu(e, item.id)}
              >
                {/* Checkbox */}
                <td className="py-4 px-4 border-r border-[#1a1a1a] align-top">
                  <Checkbox
                    checked={selectedRows.has(item.id)}
                    onCheckedChange={(checked) => handleSelectRow(item.id, checked as boolean)}
                    className="border-[#333] data-[state=checked]:bg-white data-[state=checked]:border-white"
                  />
                </td>

                {/* Content - Smooth expansion */}
                <td className="py-4 px-4 border-r border-[#1a1a1a]">
                  {editingCell?.itemId === item.id ? (
                    <textarea
                      ref={textareaRef}
                      value={editingCell.content}
                      onChange={(e) => handleContentChange(e.target.value)}
                      onBlur={handleBlur}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-transparent border-0 text-white text-sm leading-relaxed resize-none focus:outline-none p-0 transition-all duration-200"
                      rows={Math.min(Math.max(3, Math.ceil(editingCell.content.length / 80)), 8)}
                      style={{
                        animation: 'expandCell 0.2s ease-out'
                      }}
                    />
                  ) : (
                    <div 
                      className={`text-white text-sm leading-relaxed cursor-pointer transition-all duration-200 ${
                        expandedCell === item.id ? 'opacity-75' : 'hover:bg-[#111] -m-1 p-1 rounded'
                      }`}
                      onDoubleClick={() => handleContentDoubleClick(item)}
                      title="Double-click to edit"
                    >
                      {expandedCell === item.id ? item.content : truncateContent(item.content)}
                    </div>
                  )}
                </td>

                {/* Category */}
                <td className="py-4 px-4 border-r border-[#1a1a1a] align-top">
                  <span className="text-[#888] text-sm">
                    {getTagLabel(item.tag)}
                  </span>
                </td>

                {/* Date */}
                <td className="py-4 px-4 border-r border-[#1a1a1a] align-top">
                  <span className="text-[#666] text-sm">
                    {formatDate(item.created_at)}
                  </span>
                </td>

                {/* Word count */}
                <td className="py-4 px-4 align-top">
                  <span className="text-[#666] text-sm">
                    {item.content.split(' ').length}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Context Menu */}
      {contextMenu && contextMenuItem && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl py-2 min-w-[180px]"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            animation: 'fadeIn 0.1s ease-out, scaleIn 0.1s ease-out'
          }}
        >
          <button
            onClick={() => {
              onCopyItem(contextMenuItem.content)
              setContextMenu(null)
            }}
            className="w-full px-4 py-2 text-left text-white hover:bg-[#2a2a2a] transition-colors flex items-center gap-3 text-sm"
          >
            <Copy className="w-4 h-4" />
            Copy content
          </button>
          
          <button
            onClick={() => {
              handleSelectRow(contextMenuItem.id, !selectedRows.has(contextMenuItem.id))
              setContextMenu(null)
            }}
            className="w-full px-4 py-2 text-left text-white hover:bg-[#2a2a2a] transition-colors flex items-center gap-3 text-sm"
          >
            <Checkbox className="w-4 h-4" />
            {selectedRows.has(contextMenuItem.id) ? 'Deselect' : 'Select'}
          </button>
          
          <div className="border-t border-[#333] my-1"></div>
          
          <button
            onClick={() => {
              onDeleteItem(contextMenuItem.id)
              setContextMenu(null)
            }}
            className="w-full px-4 py-2 text-left text-red-400 hover:bg-[#2a2a2a] transition-colors flex items-center gap-3 text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Delete item
          </button>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0.95); }
          to { transform: scale(1); }
        }
        
        @keyframes slideUp {
          from { transform: translateY(20px); }
          to { transform: translateY(0); }
        }
        
        @keyframes expandCell {
          from { 
            opacity: 0;
            transform: scale(0.98);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  )
} 