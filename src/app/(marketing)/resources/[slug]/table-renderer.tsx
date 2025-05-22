'use client'

import React, { useEffect, useRef, useState } from 'react'
import { DataTable } from '@/components/blog/data-table'

interface TableRendererProps {
  htmlContent: string
}

export function TableRenderer({ htmlContent }: TableRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [tables, setTables] = useState<Array<{ columns: any[], data: any[] }>>([])
  const [processedContent, setProcessedContent] = useState(htmlContent)
  
  // Process tables on mount
  useEffect(() => {
    if (!containerRef.current) return
    
    // First render the content as HTML
    containerRef.current.innerHTML = htmlContent
    
    // Find all tables
    const tableElements = containerRef.current.querySelectorAll('table')
    if (tableElements.length === 0) return
    
    const tablesData: Array<{ columns: any[], data: any[] }> = []
    
    // Process each table
    tableElements.forEach((table, index) => {
      // Check if table has headers
      const headerRow = table.querySelector('thead tr')
      if (!headerRow) {
        // If no headers, assume first row is header
        const firstRow = table.querySelector('tbody tr:first-child')
        if (firstRow) {
          // Create a new thead element
          const thead = document.createElement('thead')
          const newHeaderRow = firstRow.cloneNode(true)
          thead.appendChild(newHeaderRow)
          table.insertBefore(thead, table.querySelector('tbody'))
          firstRow.parentNode?.removeChild(firstRow)
        }
      }

      // Extract headers (try again after potential addition)
      const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent?.trim() || '')
      
      // If still no headers, create generic ones
      const finalHeaders = headers.length > 0 ? headers : 
        Array.from({ length: table.querySelector('tbody tr')?.children.length || 0 }, 
          (_, i) => `Column ${i+1}`)
      
      // Extract rows
      const rows = Array.from(table.querySelectorAll('tbody tr')).map(tr => {
        const cells = Array.from(tr.querySelectorAll('td')).map(td => td.textContent?.trim() || '')
        const row: Record<string, any> = {}
        
        finalHeaders.forEach((header, i) => {
          row[`col${i}`] = cells[i] || ''
        })
        
        return row
      })
      
      tablesData.push({
        columns: finalHeaders.map((header, i) => ({ 
          header, 
          accessor: `col${i}` 
        })),
        data: rows
      })
      
      // Replace the table with a placeholder
      const placeholder = document.createElement('div')
      placeholder.setAttribute('id', `table-placeholder-${index}`)
      placeholder.className = 'table-placeholder'
      table.replaceWith(placeholder)
    })
    
    setTables(tablesData)
    setProcessedContent(containerRef.current.innerHTML)
  }, [htmlContent])
  
  // Render DataTable components in place of placeholders
  useEffect(() => {
    if (!containerRef.current || tables.length === 0) return
    
    // Render the processed content
    containerRef.current.innerHTML = processedContent
    
    // Replace placeholders with DataTable components
    tables.forEach((tableData, index) => {
      const placeholder = containerRef.current?.querySelector(`#table-placeholder-${index}`)
      if (!placeholder) return
      
      // Create the actual component
      const tableContainer = document.createElement('div')
      tableContainer.className = 'my-8 overflow-hidden'
      placeholder.replaceWith(tableContainer)
      
      try {
        // Use React to render the component
        const { createRoot } = require('react-dom/client')
        const root = createRoot(tableContainer)
        root.render(
          <DataTable
            columns={tableData.columns}
            data={tableData.data}
            title={`Table ${index + 1}`}
          />
        )
      } catch (error) {
        console.error('Error rendering table:', error)
        // Fallback to original table
        tableContainer.innerHTML = `
          <div class="my-6 overflow-x-auto border border-[#2f2f2f]">
            <table class="w-full">
              <thead class="bg-[#161616] border-b border-[#2f2f2f]">
                <tr>
                  ${tableData.columns.map(col => 
                    `<th class="px-4 py-3 text-sm font-medium text-gray-400 text-left">${col.header}</th>`
                  ).join('')}
                </tr>
              </thead>
              <tbody>
                ${tableData.data.map(row => 
                  `<tr class="border-b border-[#2f2f2f] hover:bg-[#161616]">
                    ${tableData.columns.map((col, i) => 
                      `<td class="px-4 py-3 text-sm text-gray-300">${row[`col${i}`]}</td>`
                    ).join('')}
                  </tr>`
                ).join('')}
              </tbody>
            </table>
          </div>
        `
      }
    })
  }, [processedContent, tables])
  
  return <div ref={containerRef} />
} 