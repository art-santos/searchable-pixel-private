import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserSubscription } from '@/lib/stripe-profiles'
import { reportMeteredUsage, getMeteredPriceId } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { action = 'check_setup' } = await req.json()

    // Use regular client for user auth
    const supabase = createClient()
    
    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results: any = {
      user_id: user.id,
      timestamp: new Date().toISOString(),
      action
    }

    switch (action) {
      case 'check_setup':
        // Check if all required environment variables are set
        const requiredEnvVars = [
          'STRIPE_SECRET_KEY',
          'STRIPE_AI_LOGS_METERED_PRICE_ID',
          'STRIPE_EXTRA_ARTICLES_PRICE_ID',
          'STRIPE_EXTRA_DOMAINS_PRICE_ID'
        ]

        const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])
        
        results.environment_check = {
          all_env_vars_set: missingEnvVars.length === 0,
          missing_vars: missingEnvVars,
          metered_price_ids: {
            ai_logs: getMeteredPriceId('ai_logs'),
            extra_articles: getMeteredPriceId('extra_articles'),
            extra_domains: getMeteredPriceId('extra_domains')
          }
        }

        // Check user's subscription status
        const userSubscription = await getUserSubscription(user.id)
        results.subscription_check = {
          has_subscription: !!userSubscription?.subscription_id,
          subscription_status: userSubscription?.subscription_status,
          subscription_plan: userSubscription?.subscription_plan,
          stripe_customer_id: userSubscription?.stripe_customer_id,
          is_admin: userSubscription?.is_admin
        }

        break

      case 'test_usage_tracking':
        // Test reporting usage to Stripe (only if user has active subscription)
        const testUserSubscription = await getUserSubscription(user.id)
        
        if (!testUserSubscription?.subscription_id || testUserSubscription.subscription_status !== 'active') {
          results.error = 'No active subscription found for testing'
          break
        }

        // Test reporting 1 AI log overage
        const testUsageRecord = await reportMeteredUsage({
          subscriptionId: testUserSubscription.subscription_id,
          meteredType: 'ai_logs',
          quantity: 1
        })

        results.usage_tracking_test = {
          success: !!testUsageRecord,
          usage_record_id: testUsageRecord?.id,
          subscription_id: testUserSubscription.subscription_id,
          quantity_reported: 1,
          message: testUsageRecord ? 'Successfully created test usage record' : 'Failed to create usage record'
        }

        break

      case 'check_billing_period':
        // Check current billing period and usage
        const serviceSupabase = createClient()
        
        const { data: billingPeriod, error: billingError } = await serviceSupabase
          .rpc('get_current_billing_period', { p_user_id: user.id })
          .single()

        results.billing_period_check = {
          has_billing_period: !billingError && !!billingPeriod,
          billing_error: billingError?.message,
          billing_period: billingPeriod ? {
            usage_id: billingPeriod.usage_id,
            period_start: billingPeriod.period_start,
            period_end: billingPeriod.period_end,
            plan_type: billingPeriod.plan_type,
            ai_logs_included: billingPeriod.ai_logs_included,
            ai_logs_used: billingPeriod.ai_logs_used,
            stripe_subscription_id: billingPeriod.stripe_subscription_id
          } : null
        }

        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true,
      ...results
    })

  } catch (error) {
    console.error('Error in metered billing test:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Metered Billing Test Endpoint',
    available_actions: [
      'check_setup - Verify environment variables and user subscription',
      'test_usage_tracking - Test reporting usage to Stripe',
      'check_billing_period - Check current billing period and usage data'
    ],
    usage: 'POST with {"action": "check_setup"}'
  })
} 