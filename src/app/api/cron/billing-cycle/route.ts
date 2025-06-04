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
        // Calculate new billing period
        const newPeriodStart = new Date(subscription.billing_period_end)
        const newPeriodEnd = new Date(newPeriodStart)
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1)

        // Calculate overage charges
        let overageAmount = 0
        const articlesUsed = subscription.article_credits_used || 0
        const articlesIncluded = subscription.article_credits_included || 0
        const articlesPurchased = subscription.article_credits_purchased || 0
        const totalArticlesAllowed = articlesIncluded + articlesPurchased

        if (articlesUsed > totalArticlesAllowed) {
          const overageArticles = articlesUsed - totalArticlesAllowed
          overageAmount += overageArticles * 1000 // $10 per article in cents
        }

        // Log billing cycle completion event
        await supabase.rpc('track_usage_event', {
          p_user_id: subscription.user_id,
          p_event_type: 'billing_cycle_reset',
          p_amount: 1,
          p_metadata: {
            previous_period_start: subscription.billing_period_start,
            previous_period_end: subscription.billing_period_end,
            articles_used: articlesUsed,
            overage_amount_cents: overageAmount
          }
        })

        // Reset usage counters for new billing period
        const { error: updateError } = await supabase
          .from('subscription_usage')
          .update({
            billing_period_start: newPeriodStart.toISOString(),
            billing_period_end: newPeriodEnd.toISOString(),
            next_billing_date: newPeriodEnd.toISOString(),
            
            // Reset usage counters
            article_credits_used: 0,
            max_scans_used: 0,
            daily_scans_used: 0,
            
            // Carry over purchased add-ons (they persist)
            // article_credits_purchased stays the same
            // domains_purchased stays the same
            
            // Store overage amount for billing
            overage_amount_cents: overageAmount,
            
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id)

        if (updateError) {
          console.error(`Error updating subscription ${subscription.id}:`, updateError)
          results.errors++
          continue
        }

        // Send usage alerts if user is approaching limits
        const newUsagePercentage = {
          articles: totalArticlesAllowed > 0 ? (articlesUsed / totalArticlesAllowed) * 100 : 0,
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