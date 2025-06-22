'use client'

import { useState } from 'react'
import { Download, FileText, FileSpreadsheet } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ExportData, exportToCSV, exportToPDF } from '@/lib/export-utils'

interface ExportDropdownProps {
  data: ExportData
  elementId: string
  className?: string
}

export function ExportDropdown({ data, elementId, className }: ExportDropdownProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleCSVExport = () => {
    try {
      setIsExporting(true)
      exportToCSV(data)
    } catch (error) {
      console.error('Error exporting CSV:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handlePDFExport = async () => {
    try {
      setIsExporting(true)
      await exportToPDF(elementId, data)
    } catch (error) {
      console.error('Error exporting PDF:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isExporting}
          className={`text-sm text-gray-600 hover:text-gray-900 transition-colors px-3 py-1.5 rounded border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 ${className}`}
        >
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white border-gray-200 shadow-lg">
        <DropdownMenuItem
          onClick={handleCSVExport}
          disabled={isExporting}
          className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handlePDFExport}
          disabled={isExporting}
          className="text-gray-700 hover:text-gray-900 hover:bg-gray-50 cursor-pointer"
        >
          <FileText className="w-4 h-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 