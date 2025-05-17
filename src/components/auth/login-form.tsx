import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, XCircle, AlertCircle, CheckCircle, Mail } from "lucide-react"

type NotificationType = "error" | "success" | "info" | null;

interface PasswordRequirement {
  label: string;
  met: boolean;
  regex: RegExp;
}

export function LoginForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [notificationType, setNotificationType] = useState<NotificationType>(null)
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null)
  const [isSignUp, setIsSignUp] = useState(false)
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

  // Reset confirm password field when switching modes
  useEffect(() => {
    if (!isSignUp) {
      setShowConfirmPassword(false)
      setConfirmPassword("")
    }
    setNotificationMessage(null)
  }, [isSignUp])

  // Check password requirements when password changes
  useEffect(() => {
    if (isSignUp) {
      const updatedRequirements = passwordRequirements.map(req => ({
        ...req,
        met: req.regex.test(password)
      }))
      setPasswordRequirements(updatedRequirements)
    }
  }, [password, isSignUp])

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)
    
    // Show confirm password field when user starts typing in sign-up mode
    if (isSignUp && value.length > 0 && !showConfirmPassword) {
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
      
      if (isSignUp) {
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
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`
          }
        })

        if (signUpError) {
          showNotification("error", signUpError.message)
          return
        }

        // Show success message
        showNotification("success", "Check your email for confirmation link")
      } else {
        // Handle login
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        })

        if (signInError) {
          showNotification("error", signInError.message)
          return
        }

        // Auth state change listener in AuthContext will handle navigation
        showNotification("success", "Login successful")
      }
    } catch (err: any) {
      showNotification("error", err.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    setNotificationMessage(null)
    setPassword("")
    setConfirmPassword("")
    setShowConfirmPassword(false)
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <AnimatePresence mode="wait">
        <motion.div
          key={isSignUp ? "signup" : "login"}
          initial={{ x: isSignUp ? -300 : 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: isSignUp ? 300 : -300, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-2xl font-bold text-white">
                {isSignUp ? "Create an account" : "Sign in"}
              </h1>
              <p className="text-balance text-sm text-gray-400">
                {isSignUp 
                  ? "Join Split to access AEO tools" 
                  : "Login to your account to continue"}
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
                    {notificationType === "info" && <Mail className="h-5 w-5 shrink-0 text-blue-400" />}
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
                <div className="flex items-center">
                  <Label htmlFor="password" className="text-white">
                    {isSignUp ? "Create Password" : "Password"}
                  </Label>
                  {!isSignUp && (
                    <a
                      href="#"
                      className="ml-auto text-sm text-gray-400 hover:text-gray-200 hover:underline underline-offset-4 transition-colors"
                    >
                      Forgot password?
                    </a>
                  )}
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  placeholder="••••••••"
                  className="bg-[#161616] border-[#333333] text-white placeholder:text-gray-500 focus:border-white"
                  value={password}
                  onChange={handlePasswordChange}
                />

                {isSignUp && password.length > 0 && (
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
                {isSignUp && showConfirmPassword && (
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
                      required={isSignUp}
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
                disabled={isLoading || (isSignUp && (!isPasswordValid() || password !== confirmPassword))}
              >
                {isLoading 
                  ? "Processing..." 
                  : isSignUp ? "Create Account" : "Login"}
              </Button>
            </div>
            <div className="text-center text-sm text-gray-400">
              {isSignUp 
                ? "Already have an account?" 
                : "Don't have an account?"}{" "}
              <button 
                type="button"
                onClick={toggleMode}
                className="text-white hover:text-gray-200 hover:underline underline-offset-4 transition-colors"
                disabled={isLoading}
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </div>
          </form>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
