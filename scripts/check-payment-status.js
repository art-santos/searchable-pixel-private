#!/usr/bin/env node

/**
 * Diagnostic script to check payment status of all users
 * This will show:
 * - Users with payment issues
 * - Users with mismatched Stripe/Supabase data
 * - Overall health of payment system
 */

require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')
const Stripe = require('stripe')

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

// Initialize Supabase with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
}

async function checkPaymentStatus() {
  console.log(`${colors.blue}🔍 Checking payment status for all users...${colors.reset}\n`)

  try {
    // Get all profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching profiles:', error)
      return
    }

    console.log(`Found ${profiles.length} total profiles\n`)

    // Categorize users
    const categories = {
      healthy: [],
      missingCustomerId: [],
      missingSubscription: [],
      paymentNotVerified: [],
      mismatchedData: [],
      errors: []
    }

    // Check each profile
    for (const profile of profiles) {
      const issues = []
      
      // Skip admins
      if (profile.is_admin) {
        categories.healthy.push({ profile, status: 'Admin user' })
        continue
      }

      // Check for missing Stripe customer ID
      if (!profile.stripe_customer_id) {
        if (profile.subscription_id || profile.subscription_status === 'active') {
          issues.push('Has subscription but no customer ID')
          categories.missingCustomerId.push({ profile, issues })
        }
        continue
      }

      // Verify with Stripe
      try {
        const customer = await stripe.customers.retrieve(profile.stripe_customer_id)
        
        if (customer.deleted) {
          issues.push('Stripe customer is deleted')
          categories.errors.push({ profile, issues })
          continue
        }

        // Check subscriptions
        const subscriptions = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          limit: 10
        })

        const activeSubscriptions = subscriptions.data.filter(s => s.status === 'active')
        
        // Check for mismatches
        if (profile.subscription_status === 'active' && activeSubscriptions.length === 0) {
          issues.push('Profile shows active but no active subscription in Stripe')
          categories.mismatchedData.push({ profile, issues })
        } else if (profile.subscription_status !== 'active' && activeSubscriptions.length > 0) {
          issues.push('Profile shows inactive but has active subscription in Stripe')
          categories.mismatchedData.push({ profile, issues })
        }

        // Check payment method verification
        if (profile.requires_payment_method && !profile.payment_method_verified) {
          if (activeSubscriptions.length > 0) {
            issues.push('Has active subscription but payment not marked as verified')
            categories.paymentNotVerified.push({ profile, issues })
          }
        }

        // If no issues, mark as healthy
        if (issues.length === 0) {
          categories.healthy.push({ 
            profile, 
            status: activeSubscriptions.length > 0 ? 'Active subscriber' : 'No subscription'
          })
        }

      } catch (stripeError) {
        issues.push(`Stripe error: ${stripeError.message}`)
        categories.errors.push({ profile, issues })
      }
    }

    // Display results
    console.log(`\n${colors.green}✅ Healthy Users (${categories.healthy.length})${colors.reset}`)
    console.log('─'.repeat(50))
    if (categories.healthy.length > 0) {
      console.log(`${categories.healthy.length} users with correct payment status`)
    }

    if (categories.missingCustomerId.length > 0) {
      console.log(`\n${colors.red}❌ Missing Customer ID (${categories.missingCustomerId.length})${colors.reset}`)
      console.log('─'.repeat(50))
      categories.missingCustomerId.forEach(({ profile, issues }) => {
        console.log(`- ${profile.email || profile.id}`)
        console.log(`  Issues: ${issues.join(', ')}`)
      })
    }

    if (categories.paymentNotVerified.length > 0) {
      console.log(`\n${colors.yellow}⚠️  Payment Not Verified (${categories.paymentNotVerified.length})${colors.reset}`)
      console.log('─'.repeat(50))
      categories.paymentNotVerified.forEach(({ profile, issues }) => {
        console.log(`- ${profile.email || profile.id}`)
        console.log(`  Issues: ${issues.join(', ')}`)
      })
    }

    if (categories.mismatchedData.length > 0) {
      console.log(`\n${colors.yellow}⚠️  Mismatched Data (${categories.mismatchedData.length})${colors.reset}`)
      console.log('─'.repeat(50))
      categories.mismatchedData.forEach(({ profile, issues }) => {
        console.log(`- ${profile.email || profile.id}`)
        console.log(`  Issues: ${issues.join(', ')}`)
      })
    }

    if (categories.errors.length > 0) {
      console.log(`\n${colors.red}❌ Errors (${categories.errors.length})${colors.reset}`)
      console.log('─'.repeat(50))
      categories.errors.forEach(({ profile, issues }) => {
        console.log(`- ${profile.email || profile.id}`)
        console.log(`  Issues: ${issues.join(', ')}`)
      })
    }

    // Summary
    console.log(`\n${colors.blue}📊 Summary${colors.reset}`)
    console.log('─'.repeat(50))
    console.log(`Total profiles: ${profiles.length}`)
    console.log(`${colors.green}Healthy: ${categories.healthy.length}${colors.reset}`)
    console.log(`${colors.red}Missing Customer ID: ${categories.missingCustomerId.length}${colors.reset}`)
    console.log(`${colors.yellow}Payment Not Verified: ${categories.paymentNotVerified.length}${colors.reset}`)
    console.log(`${colors.yellow}Mismatched Data: ${categories.mismatchedData.length}${colors.reset}`)
    console.log(`${colors.red}Errors: ${categories.errors.length}${colors.reset}`)

    // Recommendations
    if (categories.missingCustomerId.length > 0 || 
        categories.paymentNotVerified.length > 0 || 
        categories.mismatchedData.length > 0) {
      console.log(`\n${colors.blue}💡 Recommendations${colors.reset}`)
      console.log('─'.repeat(50))
      console.log('1. Run the backfill script: node scripts/backfill-stripe-customers.js')
      console.log('2. Check Stripe webhook logs for any failed events')
      console.log('3. Ensure webhook endpoint is properly configured')
    }

  } catch (error) {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error)
  }
}

// Run the script
checkPaymentStatus()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Script failed:', err)
    process.exit(1)
  }) 