'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AuthCodeErrorPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#0c0c0c] flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-16 h-16 bg-[#1a1a1a] border border-[#333] rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">
                Authentication failed
              </h1>
              <p className="text-balance text-sm text-gray-400">
                There was an issue with the authentication process
              </p>
            </div>

            <div className="bg-[#1a1a1a] border border-[#333] p-6 rounded">
              <div className="text-sm text-white font-medium mb-3">What might have happened:</div>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-500 rounded-full" />
                  <span>The authentication link has expired</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-500 rounded-full" />
                  <span>The link has already been used</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-gray-500 rounded-full" />
                  <span>There was a network error</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => router.push('/signup')}
                className="w-full bg-white hover:bg-gray-100 text-black h-12 text-sm font-medium"
              >
                Create new account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <Button
                onClick={() => router.push('/login')}
                variant="ghost"
                className="w-full text-gray-400 hover:text-white h-12 text-sm"
              >
                Try signing in instead
              </Button>
            </div>

            <div className="text-center text-xs text-gray-500">
              <p>If you continue having issues, please contact support.</p>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
} 