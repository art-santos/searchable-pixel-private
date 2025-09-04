const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
)

async function checkTables() {
  try {
    console.log('Checking if leads tables exist...')
    
    // Check if leads table exists
    const { data: leadsData, error: leadsError } = await supabase
      .from('leads')
      .select('id')
      .limit(1)
    
    if (leadsError) {
      console.log('❌ Leads table does not exist:', leadsError.message)
      return false
    } else {
      console.log('✅ Leads table exists with', leadsData?.length || 0, 'sample records')
    }

    // Check if contacts table exists
    const { data: contactsData, error: contactsError } = await supabase
      .from('contacts')
      .select('id')
      .limit(1)
    
    if (contactsError) {
      console.log('❌ Contacts table does not exist:', contactsError.message)
      return false
    } else {
      console.log('✅ Contacts table exists with', contactsData?.length || 0, 'sample records')
    }

    // Check if user_visits table exists
    const { data: visitsData, error: visitsError } = await supabase
      .from('user_visits')
      .select('id')
      .limit(1)
    
    if (visitsError) {
      console.log('❌ User_visits table does not exist:', visitsError.message)
      return false
    } else {
      console.log('✅ User_visits table exists with', visitsData?.length || 0, 'sample records')
    }

    console.log('✅ All required tables exist!')
    return true
  } catch (error) {
    console.error('Error checking tables:', error)
    return false
  }
}

checkTables()