// Example: Protected Content Generation Page (Hard Block)
// This page requires Plus or Pro plan

import { ProtectedRoute } from '@/components/subscription/protected-route'
import { Button } from '@/components/ui/button'
import { FileText, Sparkles } from 'lucide-react'

export default function ContentPage() {
  return (
    <ProtectedRoute 
      requiredPlan="plus"
      feature="generate-content"
    >
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            AI Content Generation
          </h1>
          <p className="text-[#888]">
            Generate SEO-optimized articles powered by AI
          </p>
        </div>
        
        <div className="grid gap-6">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-white" />
              <h2 className="text-xl font-medium text-white">New Article</h2>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Article topic..."
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white"
              />
              
              <textarea
                placeholder="Keywords and requirements..."
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#333] rounded-lg text-white h-32"
              />
              
              <Button className="w-full bg-white text-black hover:bg-gray-100">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Article
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
} 