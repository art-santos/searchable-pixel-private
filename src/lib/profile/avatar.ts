import { createClient } from '@/lib/supabase/client'

const BUCKET_NAME = 'profile_pictures'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export interface UploadAvatarResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Upload a profile picture to Supabase storage
 */
export async function uploadAvatar(
  file: File,
  userId: string
): Promise<UploadAvatarResult> {
  try {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        error: 'File size must be less than 5MB'
      }
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'File must be an image'
      }
    }

    const supabase = createClient()
    if (!supabase) {
      return {
        success: false,
        error: 'Failed to initialize Supabase client'
      }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    // Upload file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        upsert: true,
        cacheControl: '3600'
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return {
        success: false,
        error: uploadError.message
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    if (!urlData?.publicUrl) {
      return {
        success: false,
        error: 'Failed to get public URL'
      }
    }

    // Update user profile with new avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        profile_picture_url: urlData.publicUrl,
        updated_by: userId
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Profile update error:', updateError)
      return {
        success: false,
        error: 'Failed to update profile'
      }
    }

    return {
      success: true,
      url: urlData.publicUrl
    }

  } catch (error) {
    console.error('Avatar upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Delete a profile picture from Supabase storage
 */
export async function deleteAvatar(
  userId: string,
  avatarUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    if (!supabase) {
      return {
        success: false,
        error: 'Failed to initialize Supabase client'
      }
    }

    // Extract file path from URL
    const url = new URL(avatarUrl)
    const pathSegments = url.pathname.split('/')
    const bucketIndex = pathSegments.findIndex(segment => segment === BUCKET_NAME)
    
    if (bucketIndex === -1) {
      return {
        success: false,
        error: 'Invalid avatar URL'
      }
    }

    const filePath = pathSegments.slice(bucketIndex + 1).join('/')

    // Delete file from storage
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath])

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return {
        success: false,
        error: deleteError.message
      }
    }

    // Update user profile to remove avatar URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        profile_picture_url: null,
        updated_by: userId
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Profile update error:', updateError)
      return {
        success: false,
        error: 'Failed to update profile'
      }
    }

    return { success: true }

  } catch (error) {
    console.error('Avatar delete error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Get user initials for fallback avatar
 */
export function getUserInitials(
  firstName?: string | null,
  lastName?: string | null,
  email?: string | null
): string {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }
  
  if (firstName) {
    return firstName.charAt(0).toUpperCase()
  }
  
  if (email) {
    return email.charAt(0).toUpperCase()
  }
  
  return 'U'
} 