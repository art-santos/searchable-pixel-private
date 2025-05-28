import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, XCircle, AlertCircle, CheckCircle, Lock } from "lucide-react"

type NotificationType = "error" | "success" | "info" | null;

interface PasswordRequirement {
  label: string;
  met: boolean;
  regex: RegExp;
}

interface SignupFormProps {
  className?: string;
  lockedEmail?: string;
  onSignupSuccess?: () => void;
}

export function SignupForm({
  className,
  lockedEmail,
  onSignupSuccess,
  ...props
}: SignupFormProps & React.HTMLAttributes<HTMLDivElement>) {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState(lockedEmail || "")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [notificationType, setNotificationType] = useState<NotificationType>(null)
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirement[]>([
    { label: "At least 8 characters", met: false, regex: /^.{8,}$/ },
    { label: "At least one uppercase letter", met: false, regex: /[A-Z]/ },
    { label: "At least one lowercase letter", met: false, regex: /[a-z]/ },
    { label: "At least one number", met: false, regex: /[0-9]/ },
    { label: "At least one special character", met: false, regex: /[\W_]/ },
  ])
  const router = useRouter()
  const supabase = createClient()

  // Load onboarding data on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !lockedEmail) {
      const onboardingData = localStorage.getItem('onboardingData')
      if (onboardingData) {
        const data = JSON.parse(onboardingData)
        setEmail(data.email || '')
      }
    }
  }, [lockedEmail])

  // Check password requirements when password changes
  useEffect(() => {
    const updatedRequirements = passwordRequirements.map(req => ({
      ...req,
      met: req.regex.test(password)
    }))
    setPasswordRequirements(updatedRequirements)
  }, [password])

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)
    
    // Show confirm password field when user starts typing
    if (value.length > 0 && !showConfirmPassword) {
      setShowConfirmPassword(true)
    }
  }

  const isPasswordValid = () => {
    return passwordRequirements.every(req => req.met)
  }

  const showNotification = (type: NotificationType, message: string) => {
    setNotificationType(type)
    setNotificationMessage(message)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setNotificationMessage(null)
    setIsLoading(true)

    try {
      if (!supabase) {
        showNotification("error", "Authentication client not available")
        return
      }
      
      // Handle signup
      if (password !== confirmPassword) {
        showNotification("error", "Passwords don't match")
        setIsLoading(false)
        return
      }

      if (!isPasswordValid()) {
        showNotification("error", "Password doesn't meet all requirements")
        setIsLoading(false)
        return
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        showNotification("error", signUpError.message)
        return
      }

      // Check if user was created and signed in
      if (data.user) {
        // Merge onboarding data with user record (this would be handled by backend)
        if (typeof window !== 'undefined') {
          const onboardingData = localStorage.getItem('onboardingData')
          if (onboardingData) {
            // TODO: Send onboarding data to backend to associate with user
            console.log('Onboarding data to merge:', JSON.parse(onboardingData))
          }
        }

        // Set a flag to indicate user just signed up (for onboarding overlay)
        sessionStorage.setItem('justSignedUp', 'true')
        
        // Call success callback
        onSignupSuccess?.()
        
        // Redirect to dashboard immediately
        router.push('/dashboard')
      } else {
        showNotification("error", "Failed to create account")
      }

    } catch (err: any) {
      showNotification("error", err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-bold text-white">
              Create your account
            </h1>
            <p className="text-balance text-sm text-gray-400">
              Almost there! Create your account to see your AI visibility score.
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
              <div className="relative">
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="you@example.com" 
                  required 
                  className="bg-[#161616] border-[#333333] text-white placeholder:text-gray-500 focus:border-white pr-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!!lockedEmail}
                />
                {lockedEmail && (
                  <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                )}
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="password" className="text-white">
                Create Password
              </Label>
              <Input 
                id="password" 
                type="password" 
                required 
                placeholder="••••••••"
                className="bg-[#161616] border-[#333333] text-white placeholder:text-gray-500 focus:border-white"
                value={password}
                onChange={handlePasswordChange}
              />

              {password.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2"
                >
                  <p className="text-xs text-gray-300 mb-1">Password requirements:</p>
                  <ul className="grid gap-1">
                    {passwordRequirements.map((req, index) => (
                      <li key={index} className="flex items-center gap-2 text-xs">
                        {req.met ? (
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                        )}
                        <span className={req.met ? "text-green-400" : "text-gray-400"}>
                          {req.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </div>
            
            <AnimatePresence>
              {showConfirmPassword && (
                <motion.div 
                  className="grid gap-2"
                  initial={{ opacity: 0, y: -20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -20, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    required
                    placeholder="••••••••"
                    className={cn(
                      "bg-[#161616] border-[#333333] text-white placeholder:text-gray-500 focus:border-white",
                      confirmPassword && password !== confirmPassword && "border-red-500 focus:border-red-500"
                    )}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            
            <Button 
              type="submit" 
              className="w-full bg-white hover:bg-gray-100 text-[#0c0c0c] font-medium transition-colors"
              disabled={isLoading || !isPasswordValid() || password !== confirmPassword}
            >
              {isLoading 
                ? "Creating Account..." 
                : "Create Account & See Score"}
            </Button>
          </div>
          
          <div className="text-center text-sm text-gray-400">
            Already have an account?{" "}
            <button 
              type="button"
              onClick={() => router.push('/login')}
              className="text-white hover:text-gray-200 hover:underline underline-offset-4 transition-colors"
              disabled={isLoading}
            >
              Sign in
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
} 