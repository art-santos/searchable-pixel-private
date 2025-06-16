#!/usr/bin/env node

/**
 * Script to backfill Stripe customer IDs for existing users
 * This will:
 * 1. Find users with active subscriptions but no stripe_customer_id
 * 2. Look up their customer in Stripe by email
 * 3. Update their profile with the customer ID
 * 4. Verify their payment method status
 */

require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')
const Stripe = require('stripe')

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Initialize Supabase with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function backfillStripeCustomers() {
  console.log('🔄 Starting Stripe customer ID backfill...\n')

  try {
    // 1. Get all users from profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError)
      return
    }

    console.log(`📊 Found ${profiles.length} total profiles\n`)

    // 2. Filter users who need attention
    const usersNeedingFix = profiles.filter(profile => {
      // Users with subscription but no customer ID
      const hasSubscription = profile.subscription_id && profile.subscription_status === 'active'
      const noCustomerId = !profile.stripe_customer_id
      
      // Users marked as needing payment but might have one
      const needsPaymentButMightHaveOne = profile.requires_payment_method && !profile.payment_method_verified
      
      return (hasSubscription && noCustomerId) || needsPaymentButMightHaveOne
    })

    console.log(`🔍 Found ${usersNeedingFix.length} users needing attention\n`)

    // 3. Process each user
    for (const profile of usersNeedingFix) {
      console.log(`\n👤 Processing user: ${profile.email || profile.id}`)
      console.log(`   Current state:`)
      console.log(`   - Stripe Customer ID: ${profile.stripe_customer_id || 'MISSING'}`)
      console.log(`   - Subscription ID: ${profile.subscription_id || 'none'}`)
      console.log(`   - Subscription Status: ${profile.subscription_status || 'none'}`)
      console.log(`   - Payment Verified: ${profile.payment_method_verified}`)

      // Get user email from auth.users if not in profile
      let email = profile.email
      if (!email) {
        const { data: authUser } = await supabase.auth.admin.getUserById(profile.id)
        email = authUser?.user?.email
      }

      if (!email) {
        console.log(`   ⚠️  No email found for user, skipping...`)
        continue
      }

      console.log(`   - Email: ${email}`)

      // Search for customer in Stripe by email
      console.log(`   🔍 Searching Stripe for customer...`)
      const customers = await stripe.customers.list({
        email: email,
        limit: 10
      })

      if (customers.data.length === 0) {
        console.log(`   ❌ No Stripe customer found with email: ${email}`)
        
        // If they have a subscription ID, try to get customer from subscription
        if (profile.subscription_id) {
          try {
            const subscription = await stripe.subscriptions.retrieve(profile.subscription_id)
            if (subscription && subscription.customer) {
              console.log(`   ✅ Found customer from subscription: ${subscription.customer}`)
              await updateProfile(profile.id, subscription.customer, subscription.status)
              continue
            }
          } catch (subError) {
            console.log(`   ❌ Could not retrieve subscription: ${subError.message}`)
          }
        }
        continue
      }

      // Find the most relevant customer (prefer one with active subscription)
      let selectedCustomer = customers.data[0]
      for (const customer of customers.data) {
        // Check if this customer has active subscriptions
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          status: 'active',
          limit: 1
        })
        
        if (subscriptions.data.length > 0) {
          selectedCustomer = customer
          console.log(`   ✅ Found customer with active subscription: ${customer.id}`)
          break
        }
      }

      if (!selectedCustomer) {
        console.log(`   ⚠️  Found ${customers.data.length} customers but none selected`)
        continue
      }

      // Update the profile with Stripe customer ID
      await updateProfile(profile.id, selectedCustomer.id, 'active')

      // Also check for active subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: selectedCustomer.id,
        status: 'active',
        limit: 1
      })

      if (subscriptions.data.length > 0) {
        const subscription = subscriptions.data[0]
        console.log(`   📋 Found active subscription: ${subscription.id}`)
        
        // Update with subscription details
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_id: subscription.id,
            subscription_status: subscription.status,
            subscription_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            payment_method_verified: true,
            payment_method_verified_at: new Date().toISOString()
          })
          .eq('id', profile.id)

        if (updateError) {
          console.error(`   ❌ Error updating subscription details:`, updateError)
        } else {
          console.log(`   ✅ Updated subscription details`)
        }
      }
    }

    // 4. Final summary
    console.log('\n\n📊 Backfill Summary:')
    console.log('===================')
    
    // Re-fetch to see current state
    const { data: updatedProfiles } = await supabase
      .from('profiles')
      .select('*')

    const stats = {
      total: updatedProfiles.length,
      withCustomerId: updatedProfiles.filter(p => p.stripe_customer_id).length,
      withActiveSubscription: updatedProfiles.filter(p => p.subscription_status === 'active').length,
      paymentVerified: updatedProfiles.filter(p => p.payment_method_verified).length,
      needingAttention: updatedProfiles.filter(p => 
        p.requires_payment_method && !p.payment_method_verified && !p.is_admin
      ).length
    }

    console.log(`Total profiles: ${stats.total}`)
    console.log(`With Stripe customer ID: ${stats.withCustomerId}`)
    console.log(`With active subscription: ${stats.withActiveSubscription}`)
    console.log(`Payment verified: ${stats.paymentVerified}`)
    console.log(`Still needing attention: ${stats.needingAttention}`)

    // List users still having issues
    if (stats.needingAttention > 0) {
      console.log('\n⚠️  Users still needing attention:')
      const needingAttention = updatedProfiles.filter(p => 
        p.requires_payment_method && !p.payment_method_verified && !p.is_admin
      )
      
      for (const profile of needingAttention) {
        console.log(`- ${profile.email || profile.id}: No payment method verified`)
      }
    }

    console.log('\n✅ Backfill complete!')

  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

async function updateProfile(userId, stripeCustomerId, status) {
  const { error } = await supabase
    .from('profiles')
    .update({
      stripe_customer_id: stripeCustomerId,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)

  if (error) {
    console.error(`   ❌ Error updating profile:`, error)
  } else {
    console.log(`   ✅ Updated profile with customer ID: ${stripeCustomerId}`)
  }
}

// Run the script
backfillStripeCustomers()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Script failed:', err)
    process.exit(1)
  }) 