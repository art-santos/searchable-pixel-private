import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request (in production, add proper auth)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceRoleClient()
    
    console.log('🔄 Starting monthly billing cycle processing...')

    // Get all subscription usage records that need billing cycle reset
    const today = new Date()
    const { data: subscriptionsToReset, error: fetchError } = await supabase
      .from('subscription_usage')
      .select('*')
      .lt('billing_period_end', today.toISOString())
      .eq('plan_status', 'active')

    if (fetchError) {
      console.error('Error fetching subscriptions to reset:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
    }

    if (!subscriptionsToReset || subscriptionsToReset.length === 0) {
      console.log('✅ No billing cycles to process')
      return NextResponse.json({ message: 'No billing cycles to process' })
    }

    console.log(`📋 Processing ${subscriptionsToReset.length} billing cycles...`)

    const results = {
      processed: 0,
      errors: 0,
      usageAlerts: 0
    }

    for (const subscription of subscriptionsToReset) {
      try {
        // Calculate overage costs for the billing period
        const aiLogsUsed = subscription.ai_logs_used || 0
        const aiLogsIncluded = subscription.ai_logs_included || 0
        const aiLogsOverage = Math.max(0, aiLogsUsed - aiLogsIncluded)

        // Calculate total overage cost
        const totalOverageCost = aiLogsOverage * 0.008 // $0.008 per AI log

        // Create billing summary
        const billingSummary = {
          period_start: subscription.period_start,
          period_end: subscription.period_end,
          plan_type: subscription.plan_type,
          ai_logs_used: aiLogsUsed,
          ai_logs_overage: aiLogsOverage,
          total_overage_cost_cents: Math.round(totalOverageCost * 100),
          user_id: subscription.user_id
          }

        // Reset usage counters for new billing period
        const { error: resetError } = await supabase
          .from('subscription_usage')
          .update({
            ai_logs_used: 0,
            updated_at: 'NOW()'
          })
          .eq('id', subscription.id)

        if (resetError) {
          console.error(`Error updating subscription ${subscription.id}:`, resetError)
          results.errors++
          continue
        }

        // Send usage alerts if user is approaching limits
        const newUsagePercentage = {
          articles: (subscription.articles_used / (subscription.articles_included + subscription.articles_purchased)) * 100,
          domains: (subscription.domains_used / (subscription.domains_included + subscription.domains_purchased)) * 100
        }

        if (newUsagePercentage.articles >= 80 || newUsagePercentage.domains >= 80) {
          // Here you would typically send an email alert
          console.log(`⚠️  Usage alert for user ${subscription.user_id}: Articles: ${newUsagePercentage.articles}%, Domains: ${newUsagePercentage.domains}%`)
          results.usageAlerts++
        }

        results.processed++
        console.log(`✅ Processed billing cycle for user ${subscription.user_id}`)

      } catch (error) {
        console.error(`Error processing subscription ${subscription.id}:`, error)
        results.errors++
      }
    }

    console.log('🎉 Billing cycle processing complete:', results)

    return NextResponse.json({
      message: 'Billing cycle processing complete',
      results
    })

  } catch (error) {
    console.error('Error in billing cycle cron job:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// For development/testing - remove in production
export async function GET() {
  return NextResponse.json({ 
    message: 'Billing cycle cron job endpoint', 
    note: 'Use POST method to trigger billing cycle processing' 
  })
} 