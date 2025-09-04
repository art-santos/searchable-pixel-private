import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Tables, TablesInsert } from '../../../supabase/supabase'
import { isValidDomain } from '@/lib/utils/domain'

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

    if (!isValidDomain(cleanDomain)) {
      console.error('❌ Invalid domain provided:', cleanDomain)
      return { success: false, error: 'Invalid domain provided' }
    }

    // 1. Create primary workspace FIRST (source of truth for domain/workspace data)
    console.log('🏢 Creating primary workspace for user:', user.id)
    
    // Check if user already has a primary workspace
    const { data: existingWorkspace, error: workspaceCheckError } = await supabase
      .from('workspaces')
      .select('id, domain, workspace_name')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .single()
    
    let workspaceId: string
    
    if (existingWorkspace && !workspaceCheckError) {
      console.log('✅ Found existing primary workspace:', existingWorkspace)
      
      // Update the existing workspace with new data if needed
      const { error: updateError } = await supabase
        .from('workspaces')
        .update({
          domain: cleanDomain,
          workspace_name: onboardingData.workspaceName
        })
        .eq('id', existingWorkspace.id)
      
      if (updateError) {
        console.error('❌ Error updating workspace:', updateError)
        return { success: false, error: `Failed to update workspace: ${updateError.message}` }
      }
      
      workspaceId = existingWorkspace.id
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
            
            workspaceId = foundWorkspace.id
            console.log('✅ Existing workspace set as primary')
          } else {
            return { success: false, error: `Failed to create workspace: ${createError.message}` }
          }
        } else {
          return { success: false, error: `Failed to create workspace: ${createError.message}` }
        }
      } else {
        workspaceId = newWorkspace.id
        console.log('✅ New primary workspace created with ID:', newWorkspace.id)
      }
    }
    
    // 2. Create/Update user profile (workspace trigger will sync domain/workspace_name)
    const profileData: TablesInsert<'profiles'> = {
      id: user.id,
      email: onboardingData.userEmail,
      first_name: onboardingData.userName || onboardingData.profileData?.first_name || onboardingData.userEmail.split('@')[0],
      last_name: onboardingData.profileData?.last_name || null,
      team_size: onboardingData.profileData?.team_size ? parseInt(onboardingData.profileData.team_size) : null,
      created_by: user.id,
      updated_by: user.id,
      workspace_id: workspaceId, // Link to the workspace we just created/updated
      onboarding_completed: false, // Will be set to true after workspace setup
      onboarding_completed_at: null,
      // Initialize usage tracking fields (defaults will be set by database)
      monthly_articles_used: 0,
      monthly_scans_used: 0,
      monthly_snapshots_used: 0,
      // Set default subscription fields (database will set defaults for timestamps)
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

    // 3. Create company entry using workspace name and domain (optional, non-blocking)
    let companyId: string | undefined
    
    try {
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
        companyId = existingCompany.id
        
        // Check if we should update the company with new information
        const newCompanyName = onboardingData.profileData?.company_name?.trim() || onboardingData.workspaceName
        const needsUpdate = existingCompany.company_name !== newCompanyName || existingCompany.root_url !== domainUrl
        
        if (needsUpdate) {
          console.log('🔄 Updating existing company with new information')
          const { error: updateError } = await supabase
            .from('companies')
            .update({
              company_name: newCompanyName,
              root_url: domainUrl
            })
            .eq('id', existingCompany.id)
          
          if (updateError) {
            console.warn('⚠️ Warning: Could not update company:', updateError)
            // Don't fail the entire onboarding for this
          } else {
            console.log('✅ Company updated successfully')
          }
        }
      } else {
        // No existing company found, create a new one
        const companyName = onboardingData.profileData?.company_name?.trim() || onboardingData.workspaceName
        
        const companyData: TablesInsert<'companies'> = {
          company_name: companyName,
          root_url: domainUrl,
          submitted_by: user.id,
        }

        console.log('🏢 Creating new company:', companyName)
        const { data: companyResult, error: companyError } = await supabase
          .from('companies')
          .insert(companyData)
          .select('id')
          .single()

        if (companyError) {
          console.warn('⚠️ Warning: Could not create company:', companyError)
          // Don't fail the entire onboarding for this - company creation is optional
        } else {
          console.log('✅ Company created successfully with ID:', companyResult.id)
          companyId = companyResult.id
        }
      }
    } catch (error) {
      console.warn('⚠️ Warning: Company operations failed, continuing without company:', error)
      // Company creation is optional - don't fail the entire onboarding
    }

    // Workspace already created in step 1, so we skip this duplicate section

    // 4. Initialize subscription system (skipped - tables don't exist yet)
    console.log('💳 Skipping subscription initialization - tables not implemented yet')
    
    // TODO: Uncomment when subscription_info and subscription_usage tables are created
    // This is optional and should not block user onboarding

    // 5. Mark onboarding as completed
    console.log('🎯 Marking onboarding as completed...')
    const { error: completionError } = await supabase
      .from('profiles')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString()
      })
      .eq('id', user.id)
    
    if (completionError) {
      console.error('❌ Error marking onboarding as completed:', completionError)
      return { success: false, error: `Failed to finalize onboarding: ${completionError.message}` }
    } else {
      console.log('✅ Onboarding marked as completed')
    }

    console.log('🎉 Onboarding data save completed successfully')
    return { 
      success: true, 
      companyId,
      workspaceId: workspaceId
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