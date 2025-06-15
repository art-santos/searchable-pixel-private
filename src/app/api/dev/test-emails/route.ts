import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Test endpoint not available in production' }, { status: 404 })
  }
  try {
    const body = await request.json()
    const { type, testEmail, userId } = body

    if (!testEmail) {
      return NextResponse.json({ error: 'testEmail is required' }, { status: 400 })
    }

    const supabase = createClient()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    // Create test user if needed - generate proper UUID
    const testUserId = userId || crypto.randomUUID()
    
    let result: any

    switch (type) {
      case 'first-crawler':
        // Ensure clean state
        await supabase.from('profiles').delete().eq('id', testUserId)
        await supabase.from('crawler_visits').delete().eq('user_id', testUserId)
        
        // Create test user
        await supabase.from('profiles').insert({
          id: testUserId,
          email: testEmail,
          first_name: 'Test User'
        })

        // Trigger first crawler email using external fetch
        const crawlerResponse = await fetch(`http://localhost:3000/api/emails/first-crawler`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: testUserId,
            crawlerName: 'Googlebot',
            page: '/test-page',
            userEmail: testEmail,
            userName: 'Test User'
          })
        })
        
        if (!crawlerResponse.ok) {
          throw new Error(`First crawler email failed: ${crawlerResponse.status}`)
        }
        
        result = await crawlerResponse.json()
        
        // Clean up
        await supabase.from('profiles').delete().eq('id', testUserId)
        break

      case 'weekly-report':
        // Create test user with activity
        await supabase.from('profiles').delete().eq('id', testUserId)
        await supabase.from('crawler_visits').delete().eq('user_id', testUserId)
        
        await supabase.from('profiles').insert({
          id: testUserId,
          email: testEmail,
          first_name: 'Weekly Test User',
          email_notifications: true
        })

        // Create sample visits
        const visits = Array(15).fill(0).map((_, i) => ({
          user_id: testUserId,
          crawler_name: ['Googlebot', 'Bingbot', 'DuckDuckBot'][i % 3],
          path: `/page-${i}`,
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        }))
        
        await supabase.from('crawler_visits').insert(visits)

        // Trigger weekly email
        const weeklyResponse = await fetch(`http://localhost:3000/api/emails/weekly-report`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: testUserId,
            userEmail: testEmail,
            userName: 'Weekly Test User',
            stats: {
              totalVisits: 15,
              uniqueCrawlers: 3,
              topPage: '/page-1',
              growth: 50
            }
          })
        })
        
        if (!weeklyResponse.ok) {
          throw new Error(`Weekly email failed: ${weeklyResponse.status}`)
        }
        
        result = await weeklyResponse.json()
        
        // Clean up
        await supabase.from('crawler_visits').delete().eq('user_id', testUserId)
        await supabase.from('profiles').delete().eq('id', testUserId)
        break

      case 'password-reset':
        // Create test token
        const token = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        await supabase.from('password_reset_tokens').insert({
          user_id: testUserId,
          token: token,
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
          email: testEmail
        })

        const resetResponse = await fetch(`http://localhost:3000/api/emails/password-reset`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testEmail,
            resetUrl: `http://localhost:3000/reset-password?token=${token}`
          })
        })
        
        if (!resetResponse.ok) {
          throw new Error(`Password reset email failed: ${resetResponse.status}`)
        }
        
        result = await resetResponse.json()
        
        // Clean up token
        await supabase.from('password_reset_tokens').delete().eq('token', token)
        break

      case 'welcome':
        const welcomeResponse = await fetch(`http://localhost:3000/api/emails/welcome`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: testEmail,
            userName: 'Welcome Test User'
          })
        })
        
        if (!welcomeResponse.ok) {
          throw new Error(`Welcome email failed: ${welcomeResponse.status}`)
        }
        
        result = await welcomeResponse.json()
        break

      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      type,
      testEmail,
      result
    })

  } catch (error) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send test email',
        message: (error as Error).message 
      },
      { status: 500 }
    )
  }
} 