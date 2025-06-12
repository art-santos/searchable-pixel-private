import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import Papa from 'papaparse'

// Types for export data
export interface ExportData {
  stats: Record<string, any>
  chartData: Array<Record<string, any>>
  recentActivity: Array<Record<string, any>>
  metadata: {
    title: string
    timeframe: string
    exportDate: string
    domain?: string
  }
}

// CSV Export Functions
export const exportToCSV = (data: ExportData) => {
  const { stats, chartData, recentActivity, metadata } = data
  
  // Create summary data
  const summaryData = [
    ['Export Summary'],
    ['Title', metadata.title],
    ['Timeframe', metadata.timeframe],
    ['Export Date', metadata.exportDate],
    ...(metadata.domain ? [['Domain', metadata.domain]] : []),
    [''],
    ['Statistics'],
    ...Object.entries(stats).map(([key, value]) => [
      key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      value?.toString() || 'N/A'
    ]),
    [''],
    ['Chart Data'],
    ...chartData.length > 0 ? [
      Object.keys(chartData[0]),
      ...chartData.map(item => Object.values(item))
    ] : [['No chart data available']],
    [''],
    ['Recent Activity'],
    ...recentActivity.length > 0 ? [
      Object.keys(recentActivity[0]),
      ...recentActivity.map(item => Object.values(item))
    ] : [['No recent activity data available']]
  ]

  const csv = Papa.unparse(summaryData)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${metadata.timeframe.replace(/\s+/g, '_').toLowerCase()}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// PDF Export Functions
export const exportToPDF = async (elementId: string, data: ExportData) => {
  const { metadata } = data
  
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error('Element not found for PDF export')
    }

    // Create canvas from the element
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#0c0c0c',
      width: element.scrollWidth,
      height: element.scrollHeight
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    
    // Calculate dimensions to fit the page
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
    const imgX = (pdfWidth - imgWidth * ratio) / 2
    const imgY = 30

    // Add title
    pdf.setFontSize(16)
    pdf.setTextColor(0, 0, 0)
    pdf.text(metadata.title, pdfWidth / 2, 20, { align: 'center' })
    
    // Add metadata
    pdf.setFontSize(10)
    pdf.text(`Timeframe: ${metadata.timeframe}`, 20, 25)
    pdf.text(`Export Date: ${metadata.exportDate}`, pdfWidth - 20, 25, { align: 'right' })

    // Add the screenshot
    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)

    // Save the PDF
    pdf.save(`${metadata.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${metadata.timeframe.replace(/\s+/g, '_').toLowerCase()}.pdf`)
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw error
  }
}

// Utility function to format data for export
export const formatStatsForExport = (stats: any) => {
  if (!stats) return {}
  
  const formatted: Record<string, any> = {}
  
  Object.entries(stats).forEach(([key, value]) => {
    if (typeof value === 'number') {
      formatted[key] = value.toLocaleString()
    } else if (typeof value === 'string') {
      formatted[key] = value
    } else {
      formatted[key] = value?.toString() || 'N/A'
    }
  })
  
  return formatted
}

// Utility function to format chart data for export
export const formatChartDataForExport = (chartData: any[]) => {
  if (!chartData || chartData.length === 0) return []
  
  return chartData.map(item => {
    const formatted: Record<string, any> = {}
    
    Object.entries(item).forEach(([key, value]) => {
      if (key === 'date') {
        formatted[key] = new Date(value as string).toLocaleString()
      } else if (typeof value === 'number') {
        formatted[key] = value
      } else {
        formatted[key] = value?.toString() || 'N/A'
      }
    })
    
    return formatted
  })
}

// Utility function to format recent activity for export
export const formatRecentActivityForExport = (recentActivity: any[]) => {
  if (!recentActivity || recentActivity.length === 0) return []
  
  return recentActivity.map(item => {
    const formatted: Record<string, any> = {}
    
    Object.entries(item).forEach(([key, value]) => {
      if (key.includes('Visit') || key.includes('visit')) {
        formatted[key] = new Date(value as string).toLocaleString()
      } else if (typeof value === 'number') {
        formatted[key] = value.toLocaleString()
      } else {
        formatted[key] = value?.toString() || 'N/A'
      }
    })
    
    return formatted
  })
} 