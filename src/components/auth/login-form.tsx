import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, XCircle, AlertCircle, Eye, EyeOff, Mail } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type NotificationType = "error" | "success" | "info" | null;

interface LoginFormProps {
  className?: string;
  onLoginSuccess?: () => void;
}

export function LoginForm({
  className,
  onLoginSuccess,
  ...props
}: LoginFormProps & React.HTMLAttributes<HTMLDivElement>) {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [notificationType, setNotificationType] = useState<NotificationType>(null)
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null)
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Load email from URL params or onboarding data
  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    } else {
      // Try to get from onboarding data
      const onboardingData = localStorage.getItem('onboardingData')
      if (onboardingData) {
        const data = JSON.parse(onboardingData)
        setEmail(data.email || '')
      }
    }

    // Check if user was redirected from dashboard
    const redirectedFrom = searchParams.get('redirectedFrom')
    if (redirectedFrom === '/dashboard') {
      showNotification("info", "Please sign in to access your dashboard and see your AI visibility score.")
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

    try {
      console.log('🔍 LOGIN FORM DEBUG')
      console.log('='.repeat(50))
      console.log('📧 Email:', email)
      console.log('🔒 Password length:', password.length)
      
      if (!supabase) {
        console.error('❌ Supabase client is null')
        showNotification("error", "Authentication client not available")
        return
      }
      
      console.log('✅ Supabase client exists')
      
      // Check if we can access the auth methods
      console.log('🔧 Auth object:', !!supabase.auth)
      console.log('🔧 SignInWithPassword method:', typeof supabase.auth.signInWithPassword)
      
      // Log the actual request details
      console.log('📡 Making signInWithPassword request...')
      console.log('📡 URL should be: https://xeclltopgmpwjpvwdnxu.supabase.co/auth/v1/token?grant_type=password')

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('📋 Auth Response:')
      console.log('- Data exists:', !!data)
      console.log('- User exists:', !!data?.user)
      console.log('- Session exists:', !!data?.session)
      console.log('- Error exists:', !!error)

      if (error) {
        console.error('❌ Auth Error Details:')
        console.error('- Message:', error.message)
        console.error('- Status:', error.status)
        console.error('- Code:', error.code)
        console.error('- Full error object:', error)
        
        if (error.message.includes('Invalid login credentials')) {
          showNotification("error", "Invalid email or password. Please try again.")
        } else {
          showNotification("error", error.message)
        }
        return
      }

      if (data.user) {
        console.log('✅ Login successful!')
        console.log('👤 User ID:', data.user.id)
        console.log('📧 User email:', data.user.email)
        
        showNotification("success", "Welcome back! Redirecting to your dashboard...")
        
        // Call success callback
        onLoginSuccess?.()
        
        // Redirect to dashboard after a brief delay
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      }

    } catch (err: any) {
      console.error('💥 Catch block error:')
      console.error('- Error type:', typeof err)
      console.error('- Error message:', err.message)
      console.error('- Error stack:', err.stack)
      console.error('- Full error:', err)
      
      showNotification("error", err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      showNotification("error", "Please enter your email address first")
      return
    }

    if (!supabase) {
      showNotification("error", "Authentication client not available")
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        showNotification("error", error.message)
        setIsLoading(false)
      } else {
        setResetEmailSent(true)
        setShowForgotPasswordModal(true)
        setNotificationMessage(null) // Clear any existing notifications
        setIsLoading(false)
      }
    } catch (err: any) {
      showNotification("error", "Failed to send reset email. Please try again.")
      setIsLoading(false)
    }
  }

  const closeForgotPasswordModal = () => {
    setShowForgotPasswordModal(false)
    setResetEmailSent(false)
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {/* Forgot Password Modal */}
      <Dialog open={showForgotPasswordModal} onOpenChange={closeForgotPasswordModal}>
        <DialogContent className="bg-[#161616] border-[#333333] text-white max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-500/10 rounded-full">
              <Mail className="w-6 h-6 text-green-400" />
            </div>
            <DialogTitle className="text-center text-white">
              Check Your Email
            </DialogTitle>
            <DialogDescription className="text-center text-gray-400">
              We've sent a password reset link to <span className="text-white font-medium">{email}</span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-400">
                <strong>Next steps:</strong>
              </p>
              <ul className="mt-2 text-sm text-gray-300 space-y-1">
                <li>• Check your email inbox (and spam folder)</li>
                <li>• Click the "Reset Password" button in the email</li>
                <li>• Enter your new password on the reset page</li>
                <li>• You'll be automatically signed in</li>
              </ul>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={closeForgotPasswordModal}
                className="flex-1 bg-white hover:bg-gray-100 text-[#0c0c0c]"
              >
                Got it
              </Button>
              <Button 
                onClick={handleForgotPassword}
                variant="outline"
                className="flex-1 border-[#333333] bg-transparent text-gray-300 hover:bg-[#333333] hover:text-white"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Resend Email"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold text-white">
              Welcome back
            </h1>
            <p className="text-balance text-sm text-gray-400">
              Sign in to access your AI visibility dashboard
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
            
            <div className="grid gap-2">
              <Label htmlFor="password" className="text-white">Password</Label>
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
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-white hover:bg-gray-100 text-[#0c0c0c] font-medium transition-colors"
              disabled={isLoading}
            >
              {isLoading 
                ? "Signing in..." 
                : "Sign in"}
            </Button>

            <div className="text-center">
              <button 
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-gray-400 hover:text-white hover:underline underline-offset-4 transition-colors"
                disabled={isLoading}
              >
                Forgot your password?
              </button>
            </div>
          </div>
          
          <div className="text-center text-sm text-gray-400">
            Don't have an account?{" "}
            <button 
              type="button"
              onClick={() => router.push('/signup')}
              className="text-white hover:text-gray-200 hover:underline underline-offset-4 transition-colors"
              disabled={isLoading}
            >
              Sign up
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
