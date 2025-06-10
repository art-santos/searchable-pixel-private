import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Tables, TablesInsert } from '../../../supabase/supabase'

export interface OnboardingData {
  // User and workspace data
  userEmail: string
  userName?: string
  workspaceName: string
  domain: string
  
  // Profile data
  profileData: {
    first_name?: string
    last_name?: string
    company_name?: string
    role?: string
    team_size?: string
    use_case?: string
  }
  
  // Analytics/tracking data
  analyticsData?: {
    provider?: 'google' | 'plausible' | 'vercel'
    tracking_id?: string
    domain?: string
  }
  
  // Content preferences
  contentData?: {
    cms?: string
    keywords?: string[]
    competitors?: string[]
  }
}

/**
 * Saves onboarding data to the database
 * Creates/updates profile and company
 */
export async function saveOnboardingData(
  user: User, 
  onboardingData: OnboardingData
): Promise<{ success: boolean; companyId?: string; workspaceId?: string; error?: string }> {
  const supabase = createClient()
  
  if (!supabase) {
    return { success: false, error: 'Supabase client not available' }
  }

  try {
    console.log('💾 Starting onboarding data save...')
    
    // Clean domain for consistent formatting
    let cleanDomain = onboardingData.domain
    if (cleanDomain.startsWith('http://')) {
      cleanDomain = cleanDomain.substring(7)
    } else if (cleanDomain.startsWith('https://')) {
      cleanDomain = cleanDomain.substring(8)
    }
    cleanDomain = cleanDomain.replace(/\/$/, '')
    
    // 1. Create/Update user profile with comprehensive data
    const profileData: TablesInsert<'profiles'> = {
      id: user.id,
      email: onboardingData.userEmail,
      first_name: onboardingData.userName || onboardingData.profileData?.first_name || onboardingData.userEmail.split('@')[0],
      last_name: onboardingData.profileData?.last_name || null,
      workspace_name: onboardingData.workspaceName,
      domain: cleanDomain, // Associate profile with domain
      team_size: onboardingData.profileData?.team_size ? parseInt(onboardingData.profileData.team_size) : null,
      created_by: user.id,
      updated_by: user.id,
      onboarding_completed: false, // Will be set to true after workspace setup
      onboarding_completed_at: null,
      // Initialize usage tracking fields
      monthly_articles_used: 0,
      monthly_scans_used: 0,
      monthly_snapshots_used: 0,
      last_articles_reset_at: new Date().toISOString(),
      last_scan_reset_at: new Date().toISOString(),
      last_snapshot_reset_at: new Date().toISOString(),
      // Set default subscription fields
      subscription_plan: null,
      subscription_status: 'active',
    }

    console.log('👤 Upserting profile for user:', user.id)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileData)

    if (profileError) {
      console.error('❌ Error saving profile:', profileError)
      return { success: false, error: `Failed to save profile: ${profileError.message}` }
    }
    console.log('✅ Profile saved successfully')

    // 2. Create company entry using workspace name and domain
    let domainUrl = onboardingData.domain
    
    // Ensure proper URL format
    if (!domainUrl.startsWith('http')) {
      domainUrl = `https://${domainUrl}`
    }
    
    // Clean up domain (remove trailing slashes, etc.)
    try {
      const url = new URL(domainUrl)
      domainUrl = `${url.protocol}//${url.hostname}`
    } catch (e) {
      // If URL parsing fails, use as-is
    }

    console.log('🏢 Checking for existing company for user:', user.id)
    
    // First, check if user already has a company
    const { data: existingCompany, error: checkError } = await supabase
      .from('companies')
      .select('id, company_name, root_url')
      .eq('submitted_by', user.id)
      .limit(1)
      .single()
    
    if (existingCompany && !checkError) {
      console.log('✅ Found existing company:', existingCompany)
      
      // Check if we should update the company with new information
      const newCompanyName = onboardingData.profileData?.company_name?.trim() || onboardingData.workspaceName
      const needsUpdate = existingCompany.company_name !== newCompanyName || existingCompany.root_url !== domainUrl
      
      if (needsUpdate) {
        console.log('🔄 Updating existing company with new information')
        const { error: updateError } = await supabase
          .from('companies')
          .update({
            company_name: newCompanyName,
            root_url: domainUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingCompany.id)
        
        if (updateError) {
          console.warn('⚠️ Warning: Could not update company:', updateError)
          // Don't fail the entire onboarding for this
        } else {
          console.log('✅ Company updated successfully')
        }
      }
      
      // Also check for existing workspace
      const { data: existingWorkspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .single()
      
      return { 
        success: true, 
        companyId: existingCompany.id,
        workspaceId: existingWorkspace?.id
      }
    }
    
    // No existing company found, create a new one
    // Use company_name from profileData if available, otherwise fall back to workspaceName
    const companyName = onboardingData.profileData?.company_name?.trim() || onboardingData.workspaceName
    
    const companyData: TablesInsert<'companies'> = {
      company_name: companyName,
      root_url: domainUrl,
      submitted_by: user.id,
    }

    console.log('🏢 Creating new company:', companyName)
    console.log('🏢 Company data:', companyData)
    const { data: companyResult, error: companyError } = await supabase
      .from('companies')
      .insert(companyData)
      .select('id')
      .single()

    if (companyError) {
      console.error('❌ Error creating company:', companyError)
      
      // If insert failed due to duplicate, try to find the existing one
      if (companyError.code === '23505') { // Unique constraint violation
        console.log('🔍 Duplicate detected, finding existing company...')
        const { data: foundCompany, error: findError } = await supabase
          .from('companies')
          .select('id')
          .eq('submitted_by', user.id)
          .limit(1)
          .single()
        
        if (foundCompany && !findError) {
          console.log('✅ Found existing company after duplicate error:', foundCompany.id)
          
          // Also check for existing workspace
          const { data: existingWorkspace } = await supabase
            .from('workspaces')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_primary', true)
            .single()
          
          return { 
            success: true, 
            companyId: foundCompany.id,
            workspaceId: existingWorkspace?.id
          }
        }
      }
      
      return { success: false, error: `Failed to save company: ${companyError.message}` }
    }
    
    console.log('✅ Company created successfully with ID:', companyResult.id)
    const companyId = companyResult.id

    // 3. Create or update workspace record - CRITICAL FOR NEW USERS
    console.log('🏢 Creating/updating workspace for user:', user.id)
    
    // Check if user already has a primary workspace
    const { data: existingWorkspace, error: workspaceCheckError } = await supabase
      .from('workspaces')
      .select('id, domain, workspace_name')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .single()
    
    if (existingWorkspace && !workspaceCheckError) {
      console.log('✅ Found existing primary workspace:', existingWorkspace)
      
      // Update the existing workspace with new data if needed
      const { error: updateError } = await supabase
        .from('workspaces')
        .update({
          domain: cleanDomain,
          workspace_name: onboardingData.workspaceName,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingWorkspace.id)
      
      if (updateError) {
        console.error('❌ Error updating workspace:', updateError)
        return { success: false, error: `Failed to update workspace: ${updateError.message}` }
      }
      
      console.log('✅ Workspace updated successfully')
    } else {
      // Create new primary workspace
      const workspaceData = {
        user_id: user.id,
        domain: cleanDomain,
        workspace_name: onboardingData.workspaceName,
        is_primary: true
      }
      
      console.log('🏢 Creating new primary workspace:', workspaceData)
      const { data: newWorkspace, error: createError } = await supabase
        .from('workspaces')
        .insert(workspaceData)
        .select('id')
        .single()
      
      if (createError) {
        console.error('❌ Error creating workspace:', createError)
        
        // Handle duplicate domain constraint
        if (createError.code === '23505') {
          console.log('🔍 Domain conflict detected, trying to find existing workspace...')
          const { data: foundWorkspace, error: findWorkspaceError } = await supabase
            .from('workspaces')
            .select('id')
            .eq('user_id', user.id)
            .eq('domain', cleanDomain)
            .single()
          
          if (foundWorkspace && !findWorkspaceError) {
            console.log('✅ Found existing workspace with same domain:', foundWorkspace.id)
            
            // Update it to be primary
            const { error: makePrimaryError } = await supabase
              .from('workspaces')
              .update({ is_primary: true, workspace_name: onboardingData.workspaceName })
              .eq('id', foundWorkspace.id)
            
            if (makePrimaryError) {
              console.error('❌ Error making workspace primary:', makePrimaryError)
              return { success: false, error: `Failed to set workspace as primary: ${makePrimaryError.message}` }
            }
            
            console.log('✅ Existing workspace set as primary')
          } else {
            return { success: false, error: `Failed to create workspace: ${createError.message}` }
          }
        } else {
          return { success: false, error: `Failed to create workspace: ${createError.message}` }
        }
      } else {
        console.log('✅ New primary workspace created with ID:', newWorkspace.id)
      }
    }

    // 4. Initialize comprehensive subscription system
    console.log('💳 Initializing subscription system for user:', user.id)
    
    // First check if subscription_info already exists
    const { data: existingSubscription } = await supabase
      .from('subscription_info')
      .select('id')
      .eq('user_id', user.id)
      .single()
    
    if (!existingSubscription) {
      // Create new subscription_info record
      const subscriptionData: TablesInsert<'subscription_info'> = {
        user_id: user.id,
        plan_type: 'free',
        plan_status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
        domains_included: 1,
        domains_used: 1, // Count the primary domain
        workspaces_included: 1,
        workspaces_used: 1, // Count the primary workspace
        team_members_included: 1,
        team_members_used: 1, // Count the user themselves
        ai_logs_included: 100,
        ai_logs_used: 0,
        extra_domains: 0,
        edge_alerts_enabled: false,
        cancel_at_period_end: false,
      }
      
      const { error: subscriptionError } = await supabase
        .from('subscription_info')
        .insert(subscriptionData)
      
      if (subscriptionError && subscriptionError.code !== '23505') {
        console.error('⚠️ Warning: Could not create subscription_info:', subscriptionError)
        // Don't fail the entire onboarding for this
      } else {
        console.log('✅ Subscription info created successfully')
      }
    }

    // Initialize subscription usage tracking (separate table for billing periods)
    const { data: existingUsage } = await supabase
      .from('subscription_usage')
      .select('id')
      .eq('user_id', user.id)
      .gte('billing_period_end', new Date().toISOString())
      .single()
    
    if (!existingUsage) {
      const usageData: TablesInsert<'subscription_usage'> = {
        user_id: user.id,
        plan_type: 'free',
        plan_status: 'active',
        billing_period_start: new Date().toISOString(),
        billing_period_end: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
        next_billing_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
        domains_included: 1,
        domains_used: 1, // Count the primary domain
        domains_purchased: 0,
        ai_logs_included: 100,
        ai_logs_used: 0,
        article_credits_included: 10,
        article_credits_used: 0,
        article_credits_purchased: 0,
        daily_scans_used: 0,
        max_scans_used: 0,
        overage_amount_cents: 0,
        overage_blocked: false,
      }
      
      const { error: usageError } = await supabase
        .from('subscription_usage')
        .insert(usageData)

      if (usageError && usageError.code !== '23505') {
        console.error('⚠️ Warning: Could not create subscription_usage:', usageError)
        // Don't fail the entire onboarding for this
      } else {
        console.log('✅ Subscription usage tracking initialized')
      }
    }

    // 5. Mark onboarding as completed
    console.log('🎯 Marking onboarding as completed...')
    const { error: completionError } = await supabase
      .from('profiles')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        updated_by: user.id
      })
      .eq('id', user.id)
    
    if (completionError) {
      console.error('⚠️ Warning: Could not mark onboarding as completed:', completionError)
      // Don't fail for this
    } else {
      console.log('✅ Onboarding marked as completed')
    }

    // Get the workspace ID to return
    const { data: finalWorkspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .single()
    
    console.log('🎉 Onboarding data save completed successfully')
    return { 
      success: true, 
      companyId,
      workspaceId: finalWorkspace?.id
    }

  } catch (error) {
    console.error('❌ Unexpected error saving onboarding data:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

// NOTE: All AEO-related functions below are commented out as the corresponding 
// database tables (aeo_runs, aeo_questions, aeo_results) do not exist in the current schema.
// Uncomment and update these when the AEO tables are added to the database.

/*
export async function updateAeoScore(
  runId: string,
  totalScore: number,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  // Implementation would go here when aeo_runs table exists
}

export function extractQuestionsFromPipelineData(pipelineData: any): string[] {
  // Implementation would go here when needed
    return []
}

export function extractResultsFromPipelineData(
  pipelineData: any,
  questionIds: Map<string, string>
): Array<{
  questionId: string
  rank: number
  url: string
  title?: string
  snippet?: string
  domain: string
  bucket: 'owned' | 'operated' | 'earned'
}> {
  // Implementation would go here when needed
    return []
}

function extractDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace(/^www\./, '')
  } catch (e) {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
  }
}

function isOperatedDomain(domain: string, targetDomain: string): boolean {
  const operatedDomains = [
    'linkedin.com',
    'twitter.com', 
    'facebook.com',
    'instagram.com',
    'youtube.com',
    'github.com',
    'medium.com',
    'substack.com',
    'trustpilot.com',
    'producthunt.com'
  ]
  
  if (operatedDomains.some(od => domain.includes(od))) {
    return true
  }
  
  if (domain.includes(targetDomain) && domain !== targetDomain) {
    return true
  }
  
  return false
}

export async function saveCompleteAeoAnalysis(
  companyId: string,
  pipelineData: any,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  // Implementation would go here when AEO tables exist
  return { success: false, error: 'AEO analysis not available - database tables not implemented' }
}

export async function getLatestAeoRun(companyId: string): Promise<{
  success: boolean
  data?: any
  error?: string
}> {
  // Implementation would go here when aeo_runs table exists
  return { success: false, error: 'AEO runs not available - database table not implemented' }
}
*/ 