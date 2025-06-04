'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react'
import { Button } from './button'

interface Notification {
  type: string
  key: string
  title: string
  message: string
  level: 'info' | 'warning' | 'error' | 'success'
  dismissible: boolean
}

interface NotificationBannerProps {
  notification: Notification
  onDismiss?: (notificationType: string, notificationKey: string) => void
  className?: string
}

export function NotificationBanner({ 
  notification, 
  onDismiss, 
  className = '' 
}: NotificationBannerProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isDismissing, setIsDismissing] = useState(false)

  const handleDismiss = async () => {
    if (!notification.dismissible || isDismissing) return
    
    setIsDismissing(true)
    
    try {
      // Call API to dismiss notification
      if (onDismiss) {
        await onDismiss(notification.type, notification.key)
      }
      
      // Hide the banner
      setIsVisible(false)
    } catch (error) {
      console.error('Error dismissing notification:', error)
      setIsDismissing(false)
    }
  }

  const getIcon = () => {
    switch (notification.level) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />
      case 'error':
        return <AlertTriangle className="w-4 h-4" />
      case 'success':
        return <CheckCircle className="w-4 h-4" />
      default:
        return <Info className="w-4 h-4" />
    }
  }

  const getBannerStyles = () => {
    const baseStyles = "border border-l-4 font-mono tracking-tight"
    
    switch (notification.level) {
      case 'warning':
        return `${baseStyles} bg-yellow-500/5 border-yellow-500/20 border-l-yellow-500/60 text-yellow-200`
      case 'error':
        return `${baseStyles} bg-red-500/5 border-red-500/20 border-l-red-500/60 text-red-200`
      case 'success':
        return `${baseStyles} bg-green-500/5 border-green-500/20 border-l-green-500/60 text-green-200`
      default:
        return `${baseStyles} bg-blue-500/5 border-blue-500/20 border-l-blue-500/60 text-blue-200`
    }
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
        animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
        className={`${getBannerStyles()} rounded-sm px-4 py-3 ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-medium text-sm mb-1">
                  {notification.title}
                </h4>
                <p className="text-sm opacity-90 leading-relaxed">
                  {notification.message}
                </p>
              </div>
              
              {notification.dismissible && (
                <Button
                  onClick={handleDismiss}
                  disabled={isDismissing}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-white/10 flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

interface NotificationBannerListProps {
  notifications: Notification[]
  onDismiss?: (notificationType: string, notificationKey: string) => void
  className?: string
}

export function NotificationBannerList({ 
  notifications, 
  onDismiss, 
  className = '' 
}: NotificationBannerListProps) {
  if (!notifications || notifications.length === 0) return null

  return (
    <div className={className}>
      {notifications.map((notification, index) => (
        <NotificationBanner
          key={`${notification.type}-${notification.key}-${index}`}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  )
} 