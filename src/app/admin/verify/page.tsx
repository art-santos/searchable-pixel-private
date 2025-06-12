'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, Eye, EyeOff } from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'

export default function AdminVerifyPage() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      if (!supabase) {
        setError('Authentication client not available')
        return
      }

      // Call the Supabase function to verify password
      const { data, error } = await supabase.rpc('verify_admin_password', {
        submitted_password: password
      })

      if (error) {
        console.error('Error verifying password:', error)
        setError('Failed to verify password. Please try again.')
        return
      }

      if (data === true) {
        // Password is correct, set admin session flag
        localStorage.setItem('admin_verified', 'true')
        localStorage.setItem('admin_verified_at', new Date().toISOString())
        
        // Redirect to admin dashboard
        router.push('/admin/dashboard')
      } else {
        setError('Incorrect password. Please try again.')
      }
    } catch (err) {
      console.error('Verification error:', err)
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center p-4">
      <motion.div 
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="bg-[#111111] border border-[#222222] rounded-lg p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center mx-auto mb-4">
              <Image 
                src="/images/split-icon-white.svg" 
                width={24} 
                height={24} 
                alt="Split Logo" 
              />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Admin Access</h1>
            <p className="text-[#888888] text-sm">
              Enter the admin password to access the dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="password" className="text-[#888888] text-sm font-medium">
                Admin Password
              </Label>
              <div className="relative mt-2">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#0c0c0c] border-[#222222] text-white pr-10 focus:border-[#333333] placeholder:text-[#666666]"
                  placeholder="Enter admin password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#666666] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-red-900/10 border border-red-500/20 rounded-md text-red-400 text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !password}
              className="w-full bg-white text-[#0c0c0c] hover:bg-gray-200 font-medium disabled:opacity-50 transition-all duration-200"
            >
              {isLoading ? 'Verifying...' : 'Access Admin Dashboard'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#222222] text-center">
            <p className="text-xs text-[#666666]">
              Admin access is restricted to @split.dev email addresses
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
} 