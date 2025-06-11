'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'

interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'ghost' | 'outline'
  className?: string
}

export function ThemeToggle({ 
  size = 'md', 
  variant = 'ghost',
  className = '' 
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9', 
    lg: 'h-10 w-10'
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  return (
    <Button
      variant={variant}
      size="icon"
      onClick={toggleTheme}
      className={`${sizeClasses[size]} ${className} relative overflow-hidden transition-all duration-300 hover:scale-105`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative flex items-center justify-center w-full h-full">
        {/* Sun Icon */}
        <Sun 
          className={`${iconSizes[size]} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
            theme === 'light' 
              ? 'rotate-0 scale-100 opacity-100' 
              : 'rotate-90 scale-0 opacity-0'
          }`}
        />
        {/* Moon Icon */}
        <Moon 
          className={`${iconSizes[size]} absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
            theme === 'dark' 
              ? 'rotate-0 scale-100 opacity-100' 
              : '-rotate-90 scale-0 opacity-0'
          }`}
        />
      </div>
    </Button>
  )
} 