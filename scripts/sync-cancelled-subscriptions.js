#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const Stripe = require('stripe')

// Debug environment variables
console.log('Environment check:')
console.log('STRIPE_SECRET_KEY exists:', !!process.env.STRIPE_SECRET_KEY)
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment')
  process.exit(1)
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function syncCancelledSubscriptions() {
  console.log('🔄 Starting sync of cancelled subscriptions...')
  
  try {
    // Get all active subscriptions from the database
    const { data: subscriptions, error } = await supabase
      .from('subscription_info')
      .select('user_id, stripe_subscription_id, cancel_at_period_end')
      .eq('plan_status', 'active')
      .not('stripe_subscription_id', 'is', null)
    
    if (error) {
      console.error('❌ Error fetching subscriptions:', error)
      return
    }
    
    // Get user emails for the subscriptions
    const userIds = subscriptions.map(s => s.user_id)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', userIds)
    
    // Create a map for quick email lookup
    const emailMap = {}
    profiles.forEach(p => { emailMap[p.id] = p.email })
    
    // Add emails to subscriptions
    subscriptions.forEach(s => { s.email = emailMap[s.user_id] || 'unknown' })
    
    console.log(`📊 Found ${subscriptions.length} active subscriptions to check`)
    
    let updatedCount = 0
    
    for (const sub of subscriptions) {
      try {
        // Get the subscription from Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id)
        
        // Check if the cancel_at_period_end status differs
        if (stripeSubscription.cancel_at_period_end !== sub.cancel_at_period_end) {
          console.log(`⚠️  Mismatch found for ${sub.email}:`)
          console.log(`   Database: cancel_at_period_end = ${sub.cancel_at_period_end}`)
          console.log(`   Stripe:   cancel_at_period_end = ${stripeSubscription.cancel_at_period_end}`)
          
          // Highlight the specific user we're looking for
          if (sub.email === 'hogansam17@gmail.com') {
            console.log(`   🎯 This is the user we're specifically fixing!`)
          }
          
          // Update the database to match Stripe
          const updateData = {
            cancel_at_period_end: stripeSubscription.cancel_at_period_end,
            updated_at: new Date().toISOString()
          }
          
          // Only update current_period_end if it's valid
          if (stripeSubscription.current_period_end) {
            updateData.current_period_end = new Date(stripeSubscription.current_period_end * 1000).toISOString()
          }
          
          const { error: updateError } = await supabase
            .from('subscription_info')
            .update(updateData)
            .eq('user_id', sub.user_id)
          
          if (updateError) {
            console.error(`❌ Error updating ${sub.email}:`, updateError)
          } else {
            console.log(`✅ Updated ${sub.email} - set cancel_at_period_end to ${stripeSubscription.cancel_at_period_end}`)
            updatedCount++
          }
        }
      } catch (stripeError) {
        if (stripeError.code === 'resource_missing') {
          console.log(`⚠️  Subscription ${sub.stripe_subscription_id} not found in Stripe for ${sub.email}`)
          // Consider marking as cancelled in database
        } else {
          console.error(`❌ Error checking ${sub.email}:`, stripeError.message)
        }
      }
    }
    
    console.log(`\n✅ Sync complete. Updated ${updatedCount} subscriptions.`)
    
  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
  
  process.exit(0)
}

// Run the sync
syncCancelledSubscriptions() 