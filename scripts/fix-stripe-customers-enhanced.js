#!/usr/bin/env node

/**
 * Enhanced script to fix Stripe customer ID issues
 * This will:
 * 1. Update all Stripe customers with Supabase user ID metadata
 * 2. Ensure all profiles have emails
 * 3. Link orphaned subscriptions to users
 * 4. Fix payment verification status
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

// Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
}

async function fixStripeCustomers() {
  console.log(`${colors.blue}🔧 Starting enhanced Stripe customer fix...${colors.reset}\n`)

  try {
    // Step 1: Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return
    }

    console.log(`Found ${profiles.length} total profiles\n`)

    // Step 2: Get all auth users to ensure we have emails
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers()
    const authUserMap = new Map(authUsers.map(u => [u.id, u]))

    // Step 3: Fix each profile
    let fixed = 0
    let errors = 0

    for (const profile of profiles) {
      console.log(`\n${colors.blue}Processing user: ${profile.email || profile.id}${colors.reset}`)
      
      // Get auth user data
      const authUser = authUserMap.get(profile.id)
      const email = profile.email || authUser?.email
      
      if (!email) {
        console.log(`${colors.red}  ❌ No email found for user${colors.reset}`)
        errors++
        continue
      }

      // Update profile email if missing
      if (!profile.email && email) {
        await supabase
          .from('profiles')
          .update({ email })
          .eq('id', profile.id)
        console.log(`${colors.green}  ✅ Updated profile email${colors.reset}`)
      }

      // If user has a Stripe customer ID, update Stripe metadata
      if (profile.stripe_customer_id) {
        try {
          const customer = await stripe.customers.retrieve(profile.stripe_customer_id)
          
          if (!customer.deleted) {
            // Update customer metadata with Supabase user ID
            if (customer.metadata?.supabase_user_id !== profile.id) {
              await stripe.customers.update(profile.stripe_customer_id, {
                metadata: {
                  supabase_user_id: profile.id
                }
              })
              console.log(`${colors.green}  ✅ Updated Stripe customer metadata${colors.reset}`)
              fixed++
            }

            // Check for active subscriptions
            const subscriptions = await stripe.subscriptions.list({
              customer: profile.stripe_customer_id,
              status: 'active',
              limit: 10
            })

            if (subscriptions.data.length > 0) {
              const sub = subscriptions.data[0]
              
              // Update profile with subscription info if missing or outdated
              if (profile.subscription_id !== sub.id || 
                  profile.subscription_status !== 'active' ||
                  !profile.payment_method_verified) {
                
                const updateData = {
                  subscription_id: sub.id,
                  subscription_status: 'active',
                  payment_method_verified: true,
                  payment_method_verified_at: new Date().toISOString()
                }
                
                // Handle subscription period end date
                if (sub.current_period_end) {
                  try {
                    updateData.subscription_period_end = new Date(sub.current_period_end * 1000).toISOString()
                  } catch (e) {
                    console.log(`${colors.yellow}  ⚠️  Invalid subscription end date${colors.reset}`)
                  }
                }
                
                // Get the plan from subscription
                const priceId = sub.items.data[0]?.price.id
                if (priceId) {
                  // Map price ID to plan name
                  let planName = 'starter' // default
                  if (priceId.includes('pro')) {
                    planName = 'pro'
                  } else if (priceId.includes('team') || priceId.includes('enterprise')) {
                    planName = 'team'
                  }
                  updateData.subscription_plan = planName
                  console.log(`${colors.blue}  📋 Detected plan: ${planName}${colors.reset}`)
                }
                
                await supabase
                  .from('profiles')
                  .update(updateData)
                  .eq('id', profile.id)
                
                console.log(`${colors.green}  ✅ Updated subscription info${colors.reset}`)
                fixed++
              }
            }
          }
        } catch (stripeError) {
          console.log(`${colors.red}  ❌ Stripe error: ${stripeError.message}${colors.reset}`)
          errors++
        }
      } else if (email) {
        // No Stripe customer ID - try to find by email
        console.log(`${colors.yellow}  ⚠️  No Stripe customer ID, searching by email...${colors.reset}`)
        
        const customers = await stripe.customers.list({
          email: email,
          limit: 100
        })

        if (customers.data.length > 0) {
          // Find customer with active subscription
          let selectedCustomer = null
          let activeSubscription = null

          for (const customer of customers.data) {
            const subs = await stripe.subscriptions.list({
              customer: customer.id,
              status: 'active',
              limit: 1
            })

            if (subs.data.length > 0) {
              selectedCustomer = customer
              activeSubscription = subs.data[0]
              break
            }
          }

          // If no active subscription, just take the first customer
          if (!selectedCustomer && customers.data.length > 0) {
            selectedCustomer = customers.data[0]
          }

          if (selectedCustomer) {
            // Update Stripe customer metadata
            await stripe.customers.update(selectedCustomer.id, {
              metadata: {
                supabase_user_id: profile.id
              }
            })

            // Update profile
            const updateData = {
              stripe_customer_id: selectedCustomer.id,
              email: email
            }

            if (activeSubscription) {
              updateData.subscription_id = activeSubscription.id
              updateData.subscription_status = 'active'
              
              // Handle subscription period end date
              if (activeSubscription.current_period_end) {
                try {
                  updateData.subscription_period_end = new Date(activeSubscription.current_period_end * 1000).toISOString()
                } catch (e) {
                  console.log(`${colors.yellow}  ⚠️  Invalid subscription end date${colors.reset}`)
                }
              }
              
              updateData.payment_method_verified = true
              updateData.payment_method_verified_at = new Date().toISOString()
              
              // Get the plan from subscription
              const priceId = activeSubscription.items.data[0]?.price.id
              if (priceId) {
                // Map price ID to plan name
                let planName = 'starter' // default
                if (priceId.includes('pro')) {
                  planName = 'pro'
                } else if (priceId.includes('team') || priceId.includes('enterprise')) {
                  planName = 'team'
                }
                updateData.subscription_plan = planName
                console.log(`${colors.blue}  📋 Detected plan: ${planName}${colors.reset}`)
              }
            }

            await supabase
              .from('profiles')
              .update(updateData)
              .eq('id', profile.id)

            console.log(`${colors.green}  ✅ Linked Stripe customer: ${selectedCustomer.id}${colors.reset}`)
            fixed++
          } else {
            console.log(`${colors.yellow}  ⚠️  No Stripe customer found for email: ${email}${colors.reset}`)
          }
        }
      }
    }

    // Step 4: Find orphaned Stripe customers (customers without linked Supabase users)
    console.log(`\n${colors.blue}🔍 Checking for orphaned Stripe customers...${colors.reset}`)
    
    let hasMore = true
    let startingAfter = undefined
    let orphanedCount = 0

    while (hasMore) {
      const customers = await stripe.customers.list({
        limit: 100,
        starting_after: startingAfter
      })

      for (const customer of customers.data) {
        if (!customer.metadata?.supabase_user_id && customer.email) {
          orphanedCount++
          console.log(`\n${colors.yellow}Orphaned customer: ${customer.id} (${customer.email})${colors.reset}`)
          
          // Try to find user by email
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', customer.email)
            .single()

          if (profile) {
            // Link the customer
            await stripe.customers.update(customer.id, {
              metadata: {
                supabase_user_id: profile.id
              }
            })

            await supabase
              .from('profiles')
              .update({ stripe_customer_id: customer.id })
              .eq('id', profile.id)

            console.log(`${colors.green}  ✅ Linked to user: ${profile.id}${colors.reset}`)
            fixed++
          } else {
            console.log(`${colors.red}  ❌ No user found for email: ${customer.email}${colors.reset}`)
          }
        }
      }

      hasMore = customers.has_more
      if (hasMore) {
        startingAfter = customers.data[customers.data.length - 1].id
      }
    }

    // Final summary
    console.log(`\n${colors.blue}📊 Summary${colors.reset}`)
    console.log('─'.repeat(50))
    console.log(`Total profiles processed: ${profiles.length}`)
    console.log(`${colors.green}Fixed: ${fixed}${colors.reset}`)
    console.log(`${colors.red}Errors: ${errors}${colors.reset}`)
    console.log(`${colors.yellow}Orphaned Stripe customers found: ${orphanedCount}${colors.reset}`)

    // Re-run check to see current state
    console.log(`\n${colors.blue}Running final check...${colors.reset}`)
    const { data: finalProfiles } = await supabase
      .from('profiles')
      .select('*')

    const stats = {
      withCustomerId: finalProfiles.filter(p => p.stripe_customer_id).length,
      withEmail: finalProfiles.filter(p => p.email).length,
      withActiveSubscription: finalProfiles.filter(p => p.subscription_status === 'active').length,
      paymentVerified: finalProfiles.filter(p => p.payment_method_verified).length,
      needingAttention: finalProfiles.filter(p => 
        p.requires_payment_method && !p.payment_method_verified && !p.is_admin
      ).length
    }

    console.log(`\nFinal state:`)
    console.log(`- With Stripe customer ID: ${stats.withCustomerId}/${finalProfiles.length}`)
    console.log(`- With email: ${stats.withEmail}/${finalProfiles.length}`)
    console.log(`- With active subscription: ${stats.withActiveSubscription}`)
    console.log(`- Payment verified: ${stats.paymentVerified}`)
    console.log(`- Still needing attention: ${stats.needingAttention}`)

    if (stats.needingAttention > 0) {
      console.log(`\n${colors.yellow}⚠️  Users still needing manual attention:${colors.reset}`)
      const needingAttention = finalProfiles.filter(p => 
        p.requires_payment_method && !p.payment_method_verified && !p.is_admin
      )
      
      for (const profile of needingAttention) {
        console.log(`- ${profile.email || profile.id}`)
      }
    }

    console.log(`\n${colors.green}✅ Enhanced fix complete!${colors.reset}`)

  } catch (error) {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error)
  }
}

// Run the script
fixStripeCustomers()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Script failed:', err)
    process.exit(1)
  }) 