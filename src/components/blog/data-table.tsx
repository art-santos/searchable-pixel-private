'use client'

import { useState } from 'react'
import { ArrowUpDown } from 'lucide-react'

interface TableColumn {
  header: string
  accessor: string
}

interface TableProps {
  columns: TableColumn[]
  data: Record<string, any>[]
  title?: string
}

export function DataTable({ columns, data, title }: TableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleSort = (accessor: string) => {
    if (sortColumn === accessor) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(accessor)
      setSortDirection('asc')
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0
    
    const aValue = a[sortColumn]
    const bValue = b[sortColumn]
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  return (
    <div className="my-6 border border-[#2f2f2f] overflow-hidden">
      {title && (
        <div className="border-b border-[#2f2f2f] py-2 px-4">
          <div className="text-sm font-medium text-white">{title}</div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-[#2f2f2f] bg-[#161616]">
            <tr>
              {columns.map((column) => (
                <th 
                  key={column.accessor} 
                  className="px-4 py-3 text-sm font-medium text-gray-400 cursor-pointer"
                  onClick={() => handleSort(column.accessor)}
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {sortColumn === column.accessor && (
                      <ArrowUpDown size={14} className={sortDirection === 'desc' ? 'transform rotate-180' : ''} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, i) => (
              <tr 
                key={i}
                className="border-b border-[#2f2f2f] hover:bg-[#161616] transition-colors"
              >
                {columns.map((column) => (
                  <td key={column.accessor} className="px-4 py-3 text-sm text-gray-300">
                    {row[column.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 