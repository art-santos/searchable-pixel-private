import { Metadata } from 'next'
import AgentCredentialsManager from '@/components/dashboard/AgentCredentialsManager'

export const metadata: Metadata = {
  title: 'API Keys | Split',
  description: 'Manage your API keys for connecting with Split',
}

export default function ApiKeysPage() {
  return (
    <div className="container py-6 max-w-5xl">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">API Keys</h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage your API credentials for connecting your sites to Split.
          </p>
        </div>
        
        <AgentCredentialsManager />
      </div>
    </div>
  )
} 