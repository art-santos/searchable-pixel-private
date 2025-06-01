'use client'

import { useState, useCallback } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAuth } from '@/contexts/AuthContext'
import { uploadAvatar, deleteAvatar, getUserInitials } from '@/lib/profile/avatar'
import { Camera, Loader2, Trash2, Upload } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface AvatarUploadProps {
  profilePictureUrl?: string | null
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  onAvatarUpdate?: (url: string | null) => void
  size?: 'sm' | 'md' | 'lg'
}

export function AvatarUpload({
  profilePictureUrl,
  firstName,
  lastName,
  email,
  onAvatarUpdate,
  size = 'lg'
}: AvatarUploadProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-16 w-16', 
    lg: 'h-20 w-20'
  }

  const initials = getUserInitials(firstName, lastName, email)

  const handleFileUpload = useCallback(async (file: File) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to upload a profile picture",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)

    try {
      const result = await uploadAvatar(file, user.id)
      
      if (result.success && result.url) {
        toast({
          title: "Success",
          description: "Profile picture updated successfully"
        })
        onAvatarUpdate?.(result.url)
      } else {
        toast({
          title: "Upload failed",
          description: result.error || "Failed to upload profile picture",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }, [user, toast, onAvatarUpdate])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleDelete = async () => {
    if (!user || !profilePictureUrl) return

    setIsDeleting(true)

    try {
      const result = await deleteAvatar(user.id, profilePictureUrl)
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Profile picture removed successfully"
        })
        onAvatarUpdate?.(null)
      } else {
        toast({
          title: "Delete failed",
          description: result.error || "Failed to remove profile picture",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file)
    } else {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="flex items-center gap-4">
      {/* Avatar with upload overlay */}
      <div className="relative group">
        <Avatar className={`${sizeClasses[size]} border-2 border-[#333] transition-all`}>
          <AvatarImage 
            src={profilePictureUrl || undefined} 
            alt={`${firstName || 'User'}'s profile picture`}
          />
          <AvatarFallback className="bg-[#1a1a1a] text-white text-lg font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        
        {/* Upload overlay */}
        <div 
          className={`absolute inset-0 rounded-full bg-black bg-opacity-60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${
            dragActive ? 'opacity-100 bg-opacity-80' : ''
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('avatar-upload')?.click()}
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </div>
        
        {/* Hidden file input */}
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
      </div>

      {/* Upload/Delete buttons */}
      <div className="flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => document.getElementById('avatar-upload')?.click()}
          disabled={isUploading}
          className="bg-[#0a0a0a] border-[#333] text-white hover:bg-[#1a1a1a] h-8"
        >
          {isUploading ? (
            <Loader2 className="h-3 w-3 animate-spin mr-2" />
          ) : (
            <Upload className="h-3 w-3 mr-2" />
          )}
          Upload
        </Button>
        
        {profilePictureUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-[#0a0a0a] border-[#333] text-red-400 hover:bg-red-500/10 hover:border-red-500/50 h-8"
          >
            {isDeleting ? (
              <Loader2 className="h-3 w-3 animate-spin mr-2" />
            ) : (
              <Trash2 className="h-3 w-3 mr-2" />
            )}
            Remove
          </Button>
        )}
      </div>
    </div>
  )
} 