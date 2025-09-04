'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Eye, EyeOff, Lock } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type NotificationType = "error" | "success" | "info" | null;

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [notificationType, setNotificationType] = useState<NotificationType>(null)
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null)
  const [resetComplete, setResetComplete] = useState(false)
  const [resetToken, setResetToken] = useState<string | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Suppress auth session errors for this page
    const originalError = console.error;
    console.error = (...args) => {
      const message = args[0]?.toString() || '';
      if (message.includes('Auth session missing') || 
          message.includes('AuthSessionMissingError') ||
          message.includes('session missing')) {
        // Silently ignore auth session errors on reset password page
        return;
      }
      originalError.apply(console, args);
    };

    // Get reset token from URL parameters
    const token = searchParams.get('token')
    if (!token) {
      showNotification("error", "Invalid reset link. Please request a new password reset.")
      return
    }
    setResetToken(token)

    // Cleanup error suppression when component unmounts
    return () => {
      console.error = originalError;
    };
  }, [searchParams])

  const showNotification = (type: NotificationType, message: string) => {
    setNotificationType(type)
    setNotificationMessage(message)
  }

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long"
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return "Password must contain at least one lowercase letter"
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return "Password must contain at least one uppercase letter"
    }
    if (!/(?=.*\d)/.test(password)) {
      return "Password must contain at least one number"
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setNotificationMessage(null)

    // Validation
    if (!password || !confirmPassword) {
      showNotification("error", "Please fill in all fields")
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      showNotification("error", passwordError)
      return
    }

    if (password !== confirmPassword) {
      showNotification("error", "Passwords do not match")
      return
    }

    if (!resetToken) {
      showNotification("error", "Invalid reset token")
      return
    }

    setIsLoading(true)

    try {
      // Use our custom reset password API
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token: resetToken, 
          password: password 
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResetComplete(true)
        showNotification("success", "Password reset successful! Redirecting to login...")
        
        // Redirect to login after successful reset
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        showNotification("error", data.error || "Failed to reset password. Please try again.")
      }

    } catch (err: any) {
      console.error('Reset password error:', err)
      showNotification("error", "Failed to reset password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (resetComplete) {
    return (
      <div className="flex items-center justify-center min-h-svh bg-[#0c0c0c] text-white">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-4">
            <Link href="/" className="flex items-center gap-2 font-medium">
              <Image src="/images/split-icon-white.svg" width={36} height={36} alt="Split Logo" />
            </Link>
          </div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h1 className="text-2xl font-bold text-white mb-2">
              Password Reset Complete!
            </h1>
            <p className="text-gray-400 mb-6">
              Your password has been successfully updated. You can now sign in with your new password.
            </p>
            <Button 
              onClick={() => router.push('/login')}
              className="w-full bg-white hover:bg-gray-100 text-[#0c0c0c] font-medium"
            >
              Go to Sign In
            </Button>
          </motion.div>
        </div>
      </div>
    )
  }

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
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-2xl font-bold text-white">
                    Reset Your Password
                  </h1>
                  <p className="text-balance text-sm text-gray-400">
                    Enter your new password below
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
                        <span>{notificationMessage}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="grid gap-2">
                    <Label htmlFor="password" className="text-white">New Password</Label>
                    <div className="relative">
                      <Input 
                        id="password" 
                        type={showPassword ? "text" : "password"}
                        required 
                        placeholder="••••••••"
                        className="bg-[#161616] border-[#333333] text-white placeholder:text-gray-500 focus:border-white pr-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Must be at least 8 characters with uppercase, lowercase, and numbers
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password" className="text-white">Confirm Password</Label>
                    <div className="relative">
                      <Input 
                        id="confirm-password" 
                        type={showConfirmPassword ? "text" : "password"}
                        required 
                        placeholder="••••••••"
                        className="bg-[#161616] border-[#333333] text-white placeholder:text-gray-500 focus:border-white pr-10"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-white hover:bg-gray-100 text-[#0c0c0c] font-medium transition-colors"
                    disabled={isLoading}
                  >
                    {isLoading 
                      ? "Updating Password..." 
                      : "Update Password"}
                  </Button>

                  <div className="text-center">
                    <Link 
                      href="/login"
                      className="text-sm text-gray-400 hover:text-white hover:underline underline-offset-4 transition-colors"
                    >
                      Back to Sign In
                    </Link>
                  </div>
                </div>
              </form>
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

// Error boundary wrapper for the reset password page
function ResetPasswordErrorBoundary({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Global error handler for auth session errors
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.includes('Auth session missing') ||
          event.error?.message?.includes('AuthSessionMissingError')) {
        event.preventDefault();
        console.log('[Reset Password] Suppressed auth session error - this is expected for password reset');
      }
    };

    window.addEventListener('error', handleError);
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  return <>{children}</>;
}

export default function ResetPasswordPage() {
  return (
    <ResetPasswordErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </ResetPasswordErrorBoundary>
  )
} 