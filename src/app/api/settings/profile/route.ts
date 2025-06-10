import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/settings/profile - Get user profile settings
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, profile_picture_url, created_at, updated_at')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Get profile error:', profileError)
      return NextResponse.json(
        { error: 'Failed to get profile' },
        { status: 500 }
      )
    }

    // If no profile exists, return user email from auth
    const profileData = profile || {
      id: user.id,
      email: user.email,
      first_name: null,
      last_name: null,
      profile_picture_url: null
    }

    return NextResponse.json({
      success: true,
      data: profileData
    })

  } catch (error) {
    console.error('Get profile settings error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to get profile settings',
        message: (error as Error).message 
      },
      { status: 500 }
    )
  }
}

// PUT /api/settings/profile - Update user profile settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { first_name, last_name, profile_picture_url } = body

    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Build update object
    const updates: any = {
      id: user.id,
      email: user.email,
      updated_at: new Date().toISOString()
    }
    
    if (first_name !== undefined) updates.first_name = first_name
    if (last_name !== undefined) updates.last_name = last_name
    if (profile_picture_url !== undefined) updates.profile_picture_url = profile_picture_url

    // Update or insert profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .upsert(updates, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (updateError) {
      console.error('Update profile error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    // Check if user should be marked as having completed onboarding
    // Get the full profile to check all required fields
    const { data: fullProfile, error: profileFetchError } = await supabase
      .from('profiles')
      .select('first_name, workspace_name, domain, onboarding_completed')
      .eq('id', user.id)
      .single()

    if (!profileFetchError && fullProfile && !fullProfile.onboarding_completed) {
      // Check if user has sufficient information for onboarding completion
      const hasName = fullProfile.first_name && fullProfile.first_name.trim().length > 0
      const hasWorkspace = fullProfile.workspace_name && fullProfile.workspace_name.trim().length > 0
      const hasDomain = fullProfile.domain && fullProfile.domain.trim().length > 0

      if (hasName && hasWorkspace && hasDomain) {
        console.log('🎉 Auto-completing onboarding for existing user:', user.id)
        
        // Mark onboarding as completed
        const { error: onboardingError } = await supabase
          .from('profiles')
          .update({
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
            updated_by: user.id
          })
          .eq('id', user.id)
        
        if (onboardingError) {
          console.error('⚠️ Warning: Could not mark onboarding as completed:', onboardingError)
          // Don't fail the entire update for this
        } else {
          console.log('✅ Onboarding marked as completed for existing user')
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: 'Profile settings updated successfully'
    })

  } catch (error) {
    console.error('Update profile settings error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to update profile settings',
        message: (error as Error).message 
      },
      { status: 500 }
    )
  }
} 