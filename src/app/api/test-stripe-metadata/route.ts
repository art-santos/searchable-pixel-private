import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId') || 'cus_SSBuyvlVTREq3f'
    
    console.log('🔍 Testing Stripe metadata for customer:', customerId)
    
    // Get subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10
    })
    
    console.log('📋 Found subscriptions:', subscriptions.data.length)
    
    const results = []
    
    for (const subscription of subscriptions.data) {
      console.log('📊 Processing subscription:', subscription.id)
      
      const subscriptionResult: any = {
        subscription_id: subscription.id,
        status: subscription.status,
        subscription_metadata: subscription.metadata,
        plan_id_from_subscription: subscription.metadata?.plan_id,
        items: []
      }
      
      for (const item of subscription.items.data) {
        const priceId = item.price.id
        console.log('💰 Processing price:', priceId)
        
        try {
          // Get price with expanded product
          const priceObject = await stripe.prices.retrieve(priceId, {
            expand: ['product']
          })
          
          const itemResult: any = {
            price_id: priceId,
            price_metadata: priceObject.metadata,
            product_id: typeof priceObject.product === 'string' ? priceObject.product : priceObject.product.id,
            product_metadata: null,
            plan_id_from_price: priceObject.metadata?.plan_id,
            plan_id_from_product: null
          }
          
          // Get product metadata
          if (priceObject.product && typeof priceObject.product === 'object') {
            itemResult.product_metadata = priceObject.product.metadata
            itemResult.plan_id_from_product = priceObject.product.metadata?.plan_id
          } else if (typeof priceObject.product === 'string') {
            const productObject = await stripe.products.retrieve(priceObject.product)
            itemResult.product_metadata = productObject.metadata
            itemResult.plan_id_from_product = productObject.metadata?.plan_id
          }
          
          // Determine final plan (subscription metadata takes precedence)
          itemResult.final_plan = subscriptionResult.plan_id_from_subscription || itemResult.plan_id_from_price || itemResult.plan_id_from_product || 'unknown'
          
          console.log('✅ Item result:', itemResult)
          subscriptionResult.items.push(itemResult)
          
        } catch (error) {
          console.error('❌ Error processing price:', priceId, error)
          subscriptionResult.items.push({
            price_id: priceId,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
              }
        
        // Determine final plan for this subscription
        subscriptionResult.final_subscription_plan = subscriptionResult.plan_id_from_subscription || 
          subscriptionResult.items[0]?.final_plan || 'unknown'
        
        results.push(subscriptionResult)
    }
    
    return NextResponse.json({
      success: true,
      customer_id: customerId,
      subscriptions: results
    })
    
  } catch (error) {
    console.error('❌ Test endpoint error:', error)
    return NextResponse.json({ 
      error: 'Internal error',
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
} 