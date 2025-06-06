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