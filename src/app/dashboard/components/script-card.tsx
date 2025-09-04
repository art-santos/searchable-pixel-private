'use client'

import { Card, CardContent } from "@/components/ui/card"
import { CodeBlock } from "@/components/ui/code-block"
import { Button } from "@/components/ui/button"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { useToast } from "@/components/ui/use-toast"
import { Code, Globe, Zap, Activity, Database, Loader2 } from "lucide-react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export function ScriptCard() {
  const { currentWorkspace } = useWorkspace()
  const { toast } = useToast()
  const [isPopulating, setIsPopulating] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  
  if (!currentWorkspace) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm h-full">
        <CardContent className="p-6 h-full flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Loading workspace...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Handle populate test data
  const handlePopulateTestData = async () => {
    if (!currentWorkspace || isPopulating) return

    setIsPopulating(true)
    try {
      const response = await fetch('/api/test/populate-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspaceId: currentWorkspace.id,
          count: 50
        }) 
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Test Data Populated",
          description: `Successfully added ${result.details.total_visits} crawler visits with ${result.details.unique_crawlers} different crawlers`
        })
        // Refresh the page data
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        throw new Error(result.error || 'Failed to populate test data')
      }
    } catch (error) {
      console.error('Error populating test data:', error)
      toast({
        title: "Error",
        description: "Failed to populate test data. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsPopulating(false)
    }
  }

  // Handle simulate events
  const handleSimulateEvents = async () => {
    if (!currentWorkspace || isSimulating) return

    setIsSimulating(true)
    try {
      const response = await fetch('/api/test/simulate-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workspaceId: currentWorkspace.id,
          duration: 10
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Event Simulation Started",
          description: "Simulating crawler events for 10 seconds. Watch the dashboard for real-time updates!"
        })
        // Stop simulating state after 10 seconds
        setTimeout(() => {
          setIsSimulating(false)
          toast({
            title: "Simulation Complete",
            description: "Event simulation finished. Check your dashboard data!"
          })
        }, 10000)
      } else {
        throw new Error(result.error || 'Failed to start event simulation')
      }
    } catch (error) {
      console.error('Error simulating events:', error)
      toast({
        title: "Error",
        description: "Failed to start event simulation. Please try again.",
        variant: "destructive"
      })
      setIsSimulating(false)
    }
  }

  const script = `<script src="https://cdn.searchablepixel.cc/p.js" data-key="${currentWorkspace.id}"></script>`

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.42, 0, 0.58, 1] } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.42, 0, 0.58, 1] } }
  }

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
            transition={{ duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 flex items-center justify-center rounded">
                  <Code className="w-4 h-4 text-gray-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Tracking Script</h2>
              </div>
              
              {/* Action Buttons */}
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
                }}
                className="flex gap-2"
              >
                <motion.div variants={itemVariants}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSimulateEvents}
                    disabled={!currentWorkspace || isSimulating}
                    className="text-xs"
                  >
                    {isSimulating ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Activity className="w-3 h-3 mr-1" />
                    )}
                    {isSimulating ? "Simulating..." : "Simulate Events"}
                  </Button>
                </motion.div>
                
                <motion.div variants={itemVariants}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePopulateTestData}
                    disabled={!currentWorkspace || isPopulating}
                    className="text-xs"
                  >
                    {isPopulating ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Database className="w-3 h-3 mr-1" />
                    )}
                    {isPopulating ? "Populating..." : "Populate Test Data"}
                  </Button>
                </motion.div>
              </motion.div>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Copy this script and paste it in the &lt;head&gt; section of your website to start tracking crawler visits.
            </p>
          </motion.div> 

          {/* Script Code Block */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4, ease: [0.42, 0, 0.58, 1] }}
            className="flex-1 mb-6"
          >
            <div className="mb-3">
              <h3 className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-2">
                YOUR TRACKING SCRIPT
              </h3>
            </div>
            <CodeBlock 
              code={script}
              className="text-xs"
              showCopy={true}
            />
          </motion.div>

          {/* Instructions */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.5 } }
            }}
            className="space-y-3"
          >
            <motion.div variants={itemVariants} className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-50 flex items-center justify-center rounded-full flex-shrink-0 mt-0.5">
                <span className="text-xs font-mono font-bold text-blue-600">1</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  <strong>Copy the script</strong> above using the copy button
                </p>
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-50 flex items-center justify-center rounded-full flex-shrink-0 mt-0.5">
                <span className="text-xs font-mono font-bold text-blue-600">2</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  <strong>Paste it in your website's</strong> <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">&lt;head&gt;</code> section
                </p>
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-50 flex items-center justify-center rounded-full flex-shrink-0 mt-0.5">
                <Zap className="w-3 h-3 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  <strong>Start monitoring</strong> crawler visits in real-time
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* Footer Note */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.3, ease: [0.42, 0, 0.58, 1] }}
            className="mt-6 pt-4 border-t border-gray-100"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-400" />
              <p className="text-xs text-gray-500">
                Workspace ID: <code className="font-mono">{currentWorkspace.id}</code>
              </p>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  )
}