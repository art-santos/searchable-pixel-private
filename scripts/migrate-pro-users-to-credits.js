const { createClient } = require('@supabase/supabase-js')
const Stripe = require('stripe')

// Initialize clients
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!supabaseUrl || !supabaseServiceKey || !stripeSecretKey) {
  console.error('❌ Missing required environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const stripe = new Stripe(stripeSecretKey, { apiVersion: '2025-05-28.basil' })

// Price ID mappings - hardcoded because old env vars were removed
const OLD_TO_NEW_PRICE_IDS = {
  // Monthly - old Pro price ID to new 250-credit Pro price ID
  'price_1RYCOVDItjqY6n3DSnieQZLr': process.env.STRIPE_PRO_250_MONTHLY_PRICE_ID,
  // Annual - add if you have annual users (check your Stripe dashboard)
  // 'price_1RYCOWDItjqY6n3DxxxxXXXX': process.env.STRIPE_PRO_250_ANNUAL_PRICE_ID,
}

async function migrateProUsersToCredits() {
  console.log('🚀 Starting Pro user migration to credit system...')
  
  try {
    // Step 1: Get all Pro users from database
    console.log('📋 Step 1: Finding Pro users in database...')
    const { data: proUsers, error: dbError } = await supabase
      .from('profiles')
      .select('id, email, stripe_customer_id, subscription_plan, subscription_id')
      .eq('subscription_plan', 'pro')
      .not('stripe_customer_id', 'is', null)
      .not('subscription_id', 'is', null)
    
    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`)
    }
    
    console.log(`✅ Found ${proUsers.length} Pro users to migrate`)
    
    if (proUsers.length === 0) {
      console.log('✨ No Pro users found to migrate. Migration complete!')
      return
    }
    
    // Step 2: Process each user
    let migrated = 0
    let errors = 0
    
    for (const user of proUsers) {
      console.log(`\n👤 Processing user: ${user.email} (${user.id})`)
      
      try {
        // Get Stripe subscription
        const subscription = await stripe.subscriptions.retrieve(user.subscription_id)
        console.log(`   📄 Current subscription: ${subscription.id}`)
        console.log(`   💰 Current price ID: ${subscription.items.data[0]?.price.id}`)
        console.log(`   📅 Status: ${subscription.status}`)
        
        // Check if this subscription needs migration
        const currentPriceId = subscription.items.data[0]?.price.id
        const newPriceId = OLD_TO_NEW_PRICE_IDS[currentPriceId]
        
        if (!newPriceId) {
          console.log(`   ⚠️  No migration needed - already using new price ID or unrecognized price`)
          continue
        }
        
        if (currentPriceId === newPriceId) {
          console.log(`   ✅ Already migrated - using new price ID`)
          continue
        }
        
        // Only migrate active subscriptions
        if (!['active', 'trialing'].includes(subscription.status)) {
          console.log(`   ⏭️  Skipping - subscription not active (status: ${subscription.status})`)
          continue
        }
        
        console.log(`   🔄 Migrating from ${currentPriceId} to ${newPriceId}`)
        
        // Step 3: Update Stripe subscription
        const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
          items: [{
            id: subscription.items.data[0].id,
            price: newPriceId,
          }],
          proration_behavior: 'none', // No proration to avoid charges
          metadata: {
            ...subscription.metadata,
            credits: '250', // Add credit metadata
            migrated_from: currentPriceId,
            migrated_at: new Date().toISOString(),
          }
        })
        
        console.log(`   ✅ Stripe subscription updated successfully`)
        
        // Step 4: Update database with credit allocation
        const { error: updateError } = await supabase
          .from('subscription_usage')
          .update({
            lead_credits_included: 250,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .eq('stripe_subscription_id', user.subscription_id)
        
        if (updateError) {
          console.log(`   ⚠️  Database update warning: ${updateError.message}`)
          // Don't fail the migration for database issues
        } else {
          console.log(`   ✅ Database updated with 250 credits`)
        }
        
        migrated++
        console.log(`   🎉 Migration completed successfully!`)
        
      } catch (error) {
        console.error(`   ❌ Error migrating user ${user.email}:`, error.message)
        errors++
      }
      
      // Add a small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    // Summary
    console.log('\n📊 Migration Summary:')
    console.log(`✅ Successfully migrated: ${migrated} users`)
    console.log(`❌ Errors: ${errors} users`)
    console.log(`📋 Total processed: ${proUsers.length} users`)
    
    if (errors === 0) {
      console.log('\n🎉 Migration completed successfully!')
    } else {
      console.log('\n⚠️  Migration completed with some errors. Please review the logs above.')
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

// Run migration
if (require.main === module) {
  migrateProUsersToCredits()
    .then(() => {
      console.log('\n✨ Migration script finished')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Migration script failed:', error)
      process.exit(1)
    })
}

module.exports = { migrateProUsersToCredits } 