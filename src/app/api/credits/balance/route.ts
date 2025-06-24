import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user credit balance
    const { data: balance, error: balanceError } = await supabase
      .rpc('get_lead_credit_balance', { p_user_id: user.id })
      .single()

    if (balanceError) {
      console.error('Error fetching credit balance:', balanceError)
      return NextResponse.json(
        { error: 'Failed to fetch credit balance' },
        { status: 500 }
      )
    }

    // If no active billing period found, return zero balance
    if (!balance) {
      return NextResponse.json({
        credits_included: 0,
        credits_used: 0,
        credits_purchased: 0,
        credits_remaining: 0,
        billing_period_end: null
      })
    }

    return NextResponse.json(balance)
  } catch (error) {
    console.error('Error in credit balance API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 