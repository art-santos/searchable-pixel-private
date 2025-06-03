import { Input } from '@/components/ui/input'
import { WorkspaceData } from '../types/onboarding-types'
import { motion } from 'framer-motion'

interface WorkspaceStepProps {
  workspaceData: WorkspaceData
  setWorkspaceData: (data: WorkspaceData) => void
}

export function WorkspaceStep({ workspaceData, setWorkspaceData }: WorkspaceStepProps) {
  return (
    <motion.div
      key="workspace"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-xl font-medium text-white">Welcome to Split</h2>
        <p className="text-sm text-[#888]">Let's set up your workspace</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Your Name
          </label>
          <Input
            type="text"
            placeholder="Enter your full name"
            value={workspaceData.name}
            onChange={(e) => setWorkspaceData({
              ...workspaceData,
              name: e.target.value
            })}
            className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-[#666] focus:border-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Workspace Name
          </label>
          <Input
            type="text"
            placeholder="Your company or project name"
            value={workspaceData.workspaceName}
            onChange={(e) => setWorkspaceData({
              ...workspaceData,
              workspaceName: e.target.value
            })}
            className="bg-[#1a1a1a] border-[#333] text-white placeholder:text-[#666] focus:border-white"
          />
          <p className="text-xs text-[#666] mt-1">
            This will be used to identify your workspace
          </p>
        </div>
      </div>
    </motion.div>
  )
} 