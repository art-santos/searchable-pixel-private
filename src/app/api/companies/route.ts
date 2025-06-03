import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/companies - Get user's companies
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's companies
    const { data: companies, error } = await supabase
      .from('companies')
      .select('*')
      .eq('submitted_by', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: companies
    })

  } catch (error) {
    console.error('Get companies API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch companies',
        message: (error as Error).message 
      },
      { status: 500 }
    )
  }
}

// POST /api/companies - Create a new company
export async function POST(request: NextRequest) {
  try {
    const { company_name, root_url } = await request.json()

    if (!company_name || !root_url) {
      return NextResponse.json(
        { error: 'Company name and root URL are required' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create company
    const { data: company, error } = await supabase
      .from('companies')
      .insert({
        company_name,
        root_url,
        submitted_by: user.id
      })
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: company
    })

  } catch (error) {
    console.error('Create company API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to create company',
        message: (error as Error).message 
      },
      { status: 500 }
    )
  }
} 