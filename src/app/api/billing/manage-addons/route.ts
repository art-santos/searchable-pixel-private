import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { getUserSubscription } from '@/lib/stripe-profiles'
import { stripe, getAddOnPriceId } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const { action, addonType, quantity } = await req.json()

    // Validate input
    if (!action || !addonType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['add', 'update', 'remove'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (!['extra_articles', 'extra_domains'].includes(addonType)) {
      return NextResponse.json({ error: 'Invalid addon type' }, { status: 400 })
    }

    // Use regular client for user auth
    const supabase = createClient()
    
    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's subscription details
    const userSubscription = await getUserSubscription(user.id)
    
    // Allow admin users to test add-ons functionality even without a subscription
    if (userSubscription?.is_admin) {
      console.log('👑 Admin user detected, allowing add-on management without subscription')
    } else if (!userSubscription?.subscription_id || userSubscription.subscription_status !== 'active') {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 })
    }

    // Get the add-on price ID for this addon type (fixed monthly pricing)
    const priceId = getAddOnPriceId(addonType as 'extra_articles' | 'extra_domains')
    
    if (!priceId) {
      return NextResponse.json({ error: `No price configured for ${addonType}` }, { status: 400 })
    }

    // For admin users without a subscription, mock the add-on management
    if (userSubscription?.is_admin && !userSubscription?.subscription_id) {
      console.log(`🧪 Admin testing: Mocking ${action} for ${addonType} with quantity ${quantity}`)
      
      // Just record in database for admin testing
      const serviceSupabase = createServiceRoleClient()
      const { data: billingPeriod, error: billingError } = await serviceSupabase
        .rpc('get_current_billing_period', { p_user_id: user.id })
        .single()

      if (!billingError && billingPeriod) {
        if (action === 'remove') {
          await serviceSupabase
            .from('subscription_add_ons')
            .update({ status: 'cancelled' })
            .eq('user_id', user.id)
            .eq('add_on_type', addonType)
            .eq('status', 'active')
        } else {
          const addonData = {
            user_id: user.id,
            subscription_usage_id: billingPeriod.usage_id,
            add_on_type: addonType,
            quantity: quantity || 1,
            unit_price_cents: addonType === 'extra_articles' ? 1000 : 10000,
            total_price_cents: (quantity || 1) * (addonType === 'extra_articles' ? 1000 : 10000),
            stripe_subscription_item_id: `mock_${Date.now()}`, // Mock Stripe ID for admin
            status: 'active',
            billing_period_start: billingPeriod.period_start,
            billing_period_end: billingPeriod.period_end
          }

          await serviceSupabase
            .from('subscription_add_ons')
            .upsert(addonData, {
              onConflict: 'user_id,add_on_type,status'
            })
        }
      }

      return NextResponse.json({ 
        success: true, 
        action,
        addonType,
        quantity: action === 'remove' ? 0 : quantity || 1,
        message: `🧪 Admin test: Successfully ${action}ed ${addonType}`,
        isAdminTest: true
      })
    }

    // Get the subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(userSubscription.subscription_id, {
      expand: ['items']
    })

    // Find existing subscription item for this addon
    const existingItem = subscription.items.data.find(item => item.price.id === priceId)

    let result
    
    switch (action) {
      case 'add':
        if (existingItem) {
          return NextResponse.json({ error: 'Addon already exists' }, { status: 400 })
        }
        
        // Add new subscription item with immediate prorated billing
        result = await stripe.subscriptionItems.create({
          subscription: userSubscription.subscription_id,
          price: priceId,
          quantity: quantity || 1,
          proration_behavior: 'always_invoice'
        })
        
        console.log(`✅ Added ${addonType} addon with quantity ${quantity || 1}`)
        break

      case 'update':
        if (!existingItem) {
          return NextResponse.json({ error: 'Addon not found' }, { status: 404 })
        }
        
        if (!quantity || quantity < 0) {
          return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
        }
        
        // Update existing subscription item with prorated billing
        result = await stripe.subscriptionItems.update(existingItem.id, {
          quantity: quantity,
          proration_behavior: 'always_invoice'
        })
        
        console.log(`✅ Updated ${addonType} addon quantity to ${quantity}`)
        break

      case 'remove':
        if (!existingItem) {
          return NextResponse.json({ error: 'Addon not found' }, { status: 404 })
        }
        
        // Remove subscription item with prorated credit
        result = await stripe.subscriptionItems.del(existingItem.id, {
          proration_behavior: 'always_invoice'
        })
        
        console.log(`✅ Removed ${addonType} addon`)
        break
    }

    // Use service role client for database operations
    const serviceSupabase = createServiceRoleClient()

    // Get current billing period
    const { data: billingPeriod, error: billingError } = await serviceSupabase
      .rpc('get_current_billing_period', { p_user_id: user.id })
      .single()

    if (!billingError && billingPeriod) {
      // Record the add-on change in our database
      if (action === 'remove') {
        // Mark existing add-on as cancelled
        await serviceSupabase
          .from('subscription_add_ons')
          .update({ status: 'cancelled' })
          .eq('user_id', user.id)
          .eq('add_on_type', addonType)
          .eq('status', 'active')
      } else {
        // Create or update add-on record
        const addonData = {
          user_id: user.id,
          subscription_usage_id: billingPeriod.usage_id,
          add_on_type: addonType,
          quantity: quantity || 1,
          unit_price_cents: addonType === 'extra_articles' ? 1000 : 10000, // $10 or $100
          total_price_cents: (quantity || 1) * (addonType === 'extra_articles' ? 1000 : 10000),
          stripe_subscription_item_id: result?.id,
          status: 'active',
          billing_period_start: billingPeriod.period_start,
          billing_period_end: billingPeriod.period_end
        }

        await serviceSupabase
          .from('subscription_add_ons')
          .upsert(addonData, {
            onConflict: 'user_id,add_on_type,status'
          })
      }
    }

    return NextResponse.json({ 
      success: true, 
      action,
      addonType,
      quantity: action === 'remove' ? 0 : quantity || 1,
      message: `Successfully ${action}ed ${addonType}`,
      stripeResult: result ? {
        id: result.id,
        priceId: result.price?.id,
        quantity: result.quantity
      } : null
    })

  } catch (error) {
    console.error('Error managing addon:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 