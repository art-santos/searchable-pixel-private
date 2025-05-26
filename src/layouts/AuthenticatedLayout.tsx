'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0c0c0c]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-white" />
      </div>
    )
  }
  
  // Only render content if user is authenticated
  if (!user) {
    return null
  }
  
  return (
    <div className="h-screen bg-[#0c0c0c] flex">
      {children}
    </div>
  )
} 