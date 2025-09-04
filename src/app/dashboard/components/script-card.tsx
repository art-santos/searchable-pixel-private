'use client'

import { Card, CardContent } from "@/components/ui/card"
import { CodeBlock } from "@/components/ui/code-block"
import { useWorkspace } from "@/contexts/WorkspaceContext"
import { Code, Globe, Zap } from "lucide-react"

export function ScriptCard() {
  const { currentWorkspace } = useWorkspace()
  
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

  const script = `<script src="https://cdn.youranalytics.com/p.js" data-id="${currentWorkspace.id}"></script>`

  return (
    <Card className="bg-white border border-gray-200 shadow-sm h-full">
      <CardContent className="p-6 h-full flex flex-col">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gray-100 flex items-center justify-center rounded">
              <Code className="w-4 h-4 text-gray-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Tracking Script</h2>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            Copy this script and paste it in the &lt;head&gt; section of your website to start tracking crawler visits.
          </p>
        </div>

        {/* Script Code Block */}
        <div className="flex-1 mb-6">
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
        </div>

        {/* Instructions */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-50 flex items-center justify-center rounded-full flex-shrink-0 mt-0.5">
              <span className="text-xs font-mono font-bold text-blue-600">1</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                <strong>Copy the script</strong> above using the copy button
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-50 flex items-center justify-center rounded-full flex-shrink-0 mt-0.5">
              <span className="text-xs font-mono font-bold text-blue-600">2</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                <strong>Paste it in your website's</strong> <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">&lt;head&gt;</code> section
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-green-50 flex items-center justify-center rounded-full flex-shrink-0 mt-0.5">
              <Zap className="w-3 h-3 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                <strong>Start monitoring</strong> crawler visits in real-time
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-400" />
            <p className="text-xs text-gray-500">
              Workspace ID: <code className="font-mono">{currentWorkspace.id}</code>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}