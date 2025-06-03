import { createServiceRoleClient } from './src/lib/supabase/server.js'

async function clearMaxData() {
  const supabase = createServiceRoleClient()
  
  console.log('🗑️ Clearing MAX visibility data...')
  
  try {
    // Clear in reverse dependency order
    const { error: e1 } = await supabase.from('max_visibility_citations').delete().gte('created_at', '2000-01-01')
    console.log('Citations cleared:', e1 ? e1.message : 'success')
    
    const { error: e2 } = await supabase.from('max_visibility_competitors').delete().gte('created_at', '2000-01-01')
    console.log('Competitors cleared:', e2 ? e2.message : 'success')
    
    const { error: e3 } = await supabase.from('max_visibility_responses').delete().gte('created_at', '2000-01-01')
    console.log('Responses cleared:', e3 ? e3.message : 'success')
    
    const { error: e4 } = await supabase.from('max_visibility_questions').delete().gte('created_at', '2000-01-01')
    console.log('Questions cleared:', e4 ? e4.message : 'success')
    
    const { error: e5 } = await supabase.from('max_visibility_runs').delete().gte('created_at', '2000-01-01')
    console.log('Runs cleared:', e5 ? e5.message : 'success')
    
    console.log('✅ All MAX visibility data cleared')
  } catch (error) {
    console.error('❌ Error clearing data:', error)
  }
}

clearMaxData().catch(console.error) 