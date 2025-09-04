'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, XCircle, AlertCircle, Mail, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

type NotificationType = "error" | "success" | "info" | null;

function ForgotPasswordContent() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [notificationType, setNotificationType] = useState<NotificationType>(null)
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Load email from URL params if available
  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  const showNotification = (type: NotificationType, message: string) => {
    setNotificationType(type)
    setNotificationMessage(message)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setNotificationMessage(null)
    setIsLoading(true)

    if (!email.trim()) {
      showNotification("error", "Please enter your email address")
      setIsLoading(false)
      return
    }

    try {
      // Use our custom forgot password API instead of Supabase
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setEmailSent(true)
        setNotificationMessage(null) // Clear any existing notifications
      } else {
        showNotification("error", data.error || "Failed to send reset email. Please try again.")
      }
    } catch (err: any) {
      showNotification("error", "Failed to send reset email. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendEmail = async () => {
    await handleSubmit(new Event('submit') as any)
  }

  if (emailSent) {
    return (
      <div className="grid min-h-svh lg:grid-cols-2">
        <div className="flex flex-col gap-4 p-6 md:p-10 bg-[#0c0c0c] text-white">
          <div className="flex justify-center gap-2 md:justify-start">
            <Link href="/" className="flex items-center gap-2 font-medium">
              <Image src="/images/split-icon-white.svg" width={36} height={36} alt="Split Logo" />
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-6"
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-2xl font-bold text-white">
                    Check Your Email
                  </h1>
                  <p className="text-balance text-sm text-gray-400">
                    We've sent a password reset link to <span className="text-white font-medium">{email}</span>
                  </p>
                </div>
                
                <div className="grid gap-6">
                  <Button 
                    onClick={handleResendEmail}
                    variant="outline"
                    className="w-full border-[#333333] bg-transparent text-gray-300 hover:bg-[#333333] hover:text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Resend Email"}
                  </Button>
                  
                  <div className="text-center">
                    <Link 
                      href="/login"
                      className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white hover:underline underline-offset-4 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Sign In
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
        <div className="relative hidden lg:block bg-[#0c0c0c] overflow-hidden">
          <div className="absolute inset-0 pattern-grid opacity-10"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Image 
              src="/images/signup.png" 
              fill
              alt="Signup" 
              className="object-cover filter grayscale brightness-50"
              priority
            />
          </div>
        </div>
        
        <style jsx>{`
          .pattern-grid {
            background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
            background-size: 30px 30px;
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-svh bg-[#0c0c0c] text-white">
      <div className="w-full max-w-xs">
        <div className="flex justify-center mb-4">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <Image src="/images/split-icon-white.svg" width={36} height={36} alt="Split Logo" />
          </Link>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-2xl font-bold text-white">
                Forgot Password?
              </h1>
              <p className="text-balance text-sm text-gray-400">
                Enter your email and we'll send you a reset link
              </p>
            </div>

            <div className="grid gap-6">
              <AnimatePresence>
                {notificationMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                      "p-3 rounded flex items-start gap-2 text-sm",
                      notificationType === "error" && "bg-red-500/10 border border-red-500/20 text-red-400",
                      notificationType === "success" && "bg-green-500/10 border border-green-500/20 text-green-400",
                      notificationType === "info" && "bg-blue-500/10 border border-blue-500/20 text-blue-400"
                    )}
                  >
                    {notificationType === "error" && <XCircle className="h-5 w-5 shrink-0 text-red-400" />}
                    {notificationType === "success" && <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />}
                    {notificationType === "info" && <AlertCircle className="h-5 w-5 shrink-0 text-blue-400" />}
                    <span>{notificationMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid gap-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="you@example.com" 
                  required 
                  className="bg-[#161616] border-[#333333] text-white placeholder:text-gray-500 focus:border-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-white hover:bg-gray-100 text-[#0c0c0c] font-medium transition-colors"
                disabled={isLoading}
              >
                {isLoading 
                  ? "Sending Reset Link..." 
                  : "Send Reset Link"}
              </Button>

              <div className="text-center">
                <Link 
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white hover:underline underline-offset-4 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Link>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ForgotPasswordContent />
    </Suspense>
  )
} 