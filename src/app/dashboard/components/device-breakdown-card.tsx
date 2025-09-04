'use client'

import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Monitor, Smartphone, Tablet } from "lucide-react"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { useEffect, useState } from "react"

interface DeviceData {
  type: 'desktop' | 'mobile' | 'tablet'
  sessions: number
  percentage: number
  icon: React.ElementType
  color: string
}

export function DeviceBreakdownCard() {
  const { currentWorkspace } = useWorkspace()
  const [data, setData] = useState<DeviceData[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredDevice, setHoveredDevice] = useState<string | null>(null)

  useEffect(() => {
    const fetchDeviceData = async () => {
      if (!currentWorkspace) {
        setLoading(false)
        return
      }

      try {
        // Mock data - replace with actual API call
        setTimeout(() => {
          const mockData: DeviceData[] = [
            {
              type: 'desktop',
              sessions: 7834,
              percentage: 61.2,
              icon: Monitor,
              color: '#3b82f6'
            },
            {
              type: 'mobile', 
              sessions: 4123,
              percentage: 32.2,
              icon: Smartphone,
              color: '#10b981'
            },
            {
              type: 'tablet',
              sessions: 845,
              percentage: 6.6,
              icon: Tablet,
              color: '#f59e0b'
            }
          ]
          setData(mockData)
          setLoading(false)
        }, 500)
      } catch (error) {
        console.error('Error fetching device data:', error)
        setLoading(false)
      }
    }

    fetchDeviceData()
  }, [currentWorkspace])

  // Calculate angles for donut chart
  const getAngles = () => {
    let currentAngle = 0
    return data.map(item => {
      const angle = (item.percentage / 100) * 360
      const result = {
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        percentage: item.percentage
      }
      currentAngle += angle
      return result
    })
  }

  const createArcPath = (centerX: number, centerY: number, radius: number, innerRadius: number, startAngle: number, endAngle: number) => {
    const startAngleRad = (startAngle - 90) * (Math.PI / 180)
    const endAngleRad = (endAngle - 90) * (Math.PI / 180)
    
    const x1 = centerX + radius * Math.cos(startAngleRad)
    const y1 = centerY + radius * Math.sin(startAngleRad)
    const x2 = centerX + radius * Math.cos(endAngleRad)
    const y2 = centerY + radius * Math.sin(endAngleRad)
    
    const x3 = centerX + innerRadius * Math.cos(endAngleRad)
    const y3 = centerY + innerRadius * Math.sin(endAngleRad)
    const x4 = centerX + innerRadius * Math.cos(startAngleRad)
    const y4 = centerY + innerRadius * Math.sin(startAngleRad)
    
    const largeArc = endAngle - startAngle > 180 ? 1 : 0
    
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.42, 0, 0.58, 1] } }
  }

  if (loading) {
    return (
      <motion.div
        key="loading-skeleton"
        initial="hidden"
        animate="visible"
        variants={cardVariants}
        className="h-full"
      >
        <Card className="bg-white border border-gray-200 shadow-sm h-full">
          <CardContent className="p-6 h-full">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-6 w-36 bg-gray-200 animate-pulse rounded"></div>
            </div>
            <div className="flex flex-col items-center justify-center flex-1">
              <div className="w-48 h-48 bg-gray-200 animate-pulse rounded-full mb-4"></div>
              <div className="space-y-2 w-full">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-4 w-24 bg-gray-200 animate-pulse rounded"></div>
                    <div className="h-4 w-16 bg-gray-200 animate-pulse rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const angles = getAngles()
  const totalSessions = data.reduce((sum, item) => sum + item.sessions, 0)

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      className="h-full"
    >
      <Card className="bg-white border border-gray-200 shadow-sm h-full">
        <CardContent className="p-6 h-full flex flex-col">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
            className="flex items-center gap-3 mb-6"
          >
            <div className="w-8 h-8 bg-gray-100 flex items-center justify-center rounded">
              <Monitor className="w-4 h-4 text-gray-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Device Breakdown</h2>
          </motion.div>

          {/* Chart Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.4, ease: [0.42, 0, 0.58, 1] }}
            className="flex-1 flex flex-col items-center justify-center"
          >
            {/* Donut Chart */}
            <div className="relative mb-6">
              <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
                {data.map((item, index) => {
                  const angle = angles[index]
                  const arcPath = createArcPath(100, 100, 90, 50, angle.startAngle, angle.endAngle)
                  
                  return (
                    <motion.path
                      key={item.type}
                      d={arcPath}
                      fill={item.color}
                      className={`cursor-pointer transition-opacity duration-200 ${
                        hoveredDevice && hoveredDevice !== item.type ? 'opacity-50' : 'opacity-100'
                      }`}
                      onMouseEnter={() => setHoveredDevice(item.type)}
                      onMouseLeave={() => setHoveredDevice(null)}
                      initial={{ strokeDasharray: 500, strokeDashoffset: 500 }}
                      animate={{ strokeDashoffset: 0, opacity: hoveredDevice && hoveredDevice !== item.type ? 0.5 : 1 }}
                      transition={{ duration: 1, delay: 0.5 + index * 0.1, ease: [0.42, 0, 0.58, 1] }}
                    />
                  )
                })}
              </svg>
              
              {/* Center Text */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5, duration: 0.5, ease: [0.42, 0, 0.58, 1] }}
                className="absolute inset-0 flex flex-col items-center justify-center"
              >
                <div className="text-2xl font-bold text-gray-900">
                  {hoveredDevice 
                    ? data.find(d => d.type === hoveredDevice)?.sessions.toLocaleString()
                    : totalSessions.toLocaleString()
                  }
                </div>
                <div className="text-sm text-gray-500">
                  {hoveredDevice 
                    ? `${hoveredDevice} sessions`
                    : 'total sessions'
                  }
                </div>
              </motion.div>
            </div>

            {/* Legend */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 1.2 } }
              }}
              className="w-full space-y-3"
            >
              {data.map((item, index) => (
                <motion.div
                  key={item.type}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    hoveredDevice === item.type ? 'bg-gray-50' : 'hover:bg-gray-50'
                  }`}
                  onMouseEnter={() => setHoveredDevice(item.type)}
                  onMouseLeave={() => setHoveredDevice(null)}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <div className="flex items-center gap-2">
                      <item.icon className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-900 capitalize">
                        {item.type}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {item.percentage.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.sessions.toLocaleString()}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Footer Insight */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
            className="mt-6 pt-4 border-t border-gray-100"
          >
            <p className="text-xs text-gray-500">
              💡 <strong>Insight:</strong> Desktop dominates AI-driven traffic ({data[0]?.percentage.toFixed(1)}%), 
              suggesting users prefer larger screens for content consumption from LLMs.
            </p>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}