import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// Temporary admin endpoint to upgrade user subscription
// DELETE THIS FILE AFTER USE FOR SECURITY
export async function POST(req: NextRequest) {
  try {
    const { userId, plan } = await req.json()
    
    // Basic validation
    if (!userId || !plan) {
      return NextResponse.json({ error: 'Missing userId or plan' }, { status: 400 })
    }
    
    // Validate plan
    const validPlans = ['free', 'visibility', 'plus', 'pro']
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }
    
    // Use service client to bypass RLS
    const supabase = createServiceClient()
    
    // Get current user data first
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, subscription_plan, subscription_status')
      .eq('id', userId)
      .single()
    
    if (fetchError || !currentProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    console.log('Current profile:', currentProfile)
    
    // Update subscription safely
    const { data, error } = await supabase
      .from('profiles')
      .update({
        subscription_plan: plan,
        subscription_status: plan === 'free' ? 'free' : 'active',
        subscription_period_end: plan === 'free' ? null : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        updated_by: userId
      })
      .eq('id', userId)
      .select()
    
    if (error) {
      console.error('Error updating subscription:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `User upgraded to ${plan} plan`,
      data: data[0]
    })
    
  } catch (error) {
    console.error('Error in upgrade endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 