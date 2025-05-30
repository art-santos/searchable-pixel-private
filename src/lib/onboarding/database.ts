import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Tables, TablesInsert } from '../../../supabase/supabase'

export interface OnboardingData {
  // Workspace data
  workspaceName: string
  userEmail: string
  
  // Analytics data
  analyticsProvider?: 'vercel' | 'ga4' | 'plausible' | null
  domain: string
  isAnalyticsConnected: boolean
  
  // Content data
  keywords: string[]
  businessOffering: string
  knownFor: string
  competitors: string[]
  knowledgeBase?: string
  
  // CMS data
  cms?: string
}

/**
 * Saves onboarding data to the database
 * Creates/updates profile, company, and initiates AEO run
 */
export async function saveOnboardingData(
  user: User, 
  onboardingData: OnboardingData
): Promise<{ success: boolean; companyId?: string; runId?: string; error?: string }> {
  const supabase = createClient()
  
  if (!supabase) {
    return { success: false, error: 'Supabase client not available' }
  }

  try {
    // 1. Create/Update user profile
    const profileData: TablesInsert<'profiles'> = {
      id: user.id,
      email: onboardingData.userEmail,
      first_name: onboardingData.userEmail.split('@')[0], // Extract name from email
      created_by: user.id,
      updated_by: user.id,
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(profileData)

    if (profileError) {
      console.error('Error saving profile:', profileError)
      return { success: false, error: `Failed to save profile: ${profileError.message}` }
    }

    // 2. Create company entry
    const companyData: TablesInsert<'companies'> = {
      company_name: onboardingData.workspaceName,
      root_url: onboardingData.domain.startsWith('http') 
        ? onboardingData.domain 
        : `https://${onboardingData.domain}`,
      submitted_by: user.id,
    }

    const { data: companyResult, error: companyError } = await supabase
      .from('companies')
      .insert(companyData)
      .select('id')
      .single()

    if (companyError) {
      console.error('Error saving company:', companyError)
      return { success: false, error: `Failed to save company: ${companyError.message}` }
    }

    const companyId = companyResult.id

    // 3. Create AEO run entry
    const aeoRunData: TablesInsert<'aeo_runs'> = {
      company_id: companyId,
      question_count: 0, // Will be updated when questions are generated
      triggered_by: user.id,
      total_score: null, // Will be calculated after analysis
    }

    const { data: runResult, error: runError } = await supabase
      .from('aeo_runs')
      .insert(aeoRunData)
      .select('id')
      .single()

    if (runError) {
      console.error('Error creating AEO run:', runError)
      return { success: false, error: `Failed to create AEO run: ${runError.message}` }
    }

    const runId = runResult.id

    // 4. Store onboarding metadata in profile for later use
    const { error: metadataError } = await supabase
      .from('profiles')
      .update({
        // Store additional onboarding data as JSON in a custom field if needed
        // For now, we'll just mark the profile as having completed onboarding
        updated_by: user.id,
      })
      .eq('id', user.id)

    if (metadataError) {
      console.error('Error updating profile metadata:', metadataError)
      // Don't fail the whole operation for this
    }

    return { 
      success: true, 
      companyId, 
      runId 
    }

  } catch (error) {
    console.error('Unexpected error saving onboarding data:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

/**
 * Saves generated questions to the database
 */
export async function saveAeoQuestions(
  runId: string,
  questions: string[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  
  if (!supabase) {
    return { success: false, error: 'Supabase client not available' }
  }

  try {
    // Prepare questions data
    const questionsData: TablesInsert<'aeo_questions'>[] = questions.map((question, index) => ({
      run_id: runId,
      question: question,
      position: index + 1,
    }))

    // Insert questions
    const { error: questionsError } = await supabase
      .from('aeo_questions')
      .insert(questionsData)

    if (questionsError) {
      console.error('Error saving questions:', questionsError)
      return { success: false, error: `Failed to save questions: ${questionsError.message}` }
    }

    // Update run with question count
    const { error: updateError } = await supabase
      .from('aeo_runs')
      .update({ question_count: questions.length })
      .eq('id', runId)

    if (updateError) {
      console.error('Error updating question count:', updateError)
      // Don't fail for this
    }

    return { success: true }

  } catch (error) {
    console.error('Unexpected error saving questions:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

/**
 * Saves AEO analysis results to the database
 */
export async function saveAeoResults(
  runId: string,
  results: Array<{
    questionId: string
    rank: number
    url: string
    title?: string
    snippet?: string
    domain: string
    bucket: 'owned' | 'operated' | 'earned'
  }>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  
  if (!supabase) {
    return { success: false, error: 'Supabase client not available' }
  }

  try {
    // Prepare results data
    const resultsData: TablesInsert<'aeo_results'>[] = results.map(result => ({
      question_id: result.questionId,
      rank: result.rank,
      url: result.url,
      title: result.title || null,
      snippet: result.snippet || null,
      domain: result.domain,
      bucket: result.bucket,
    }))

    // Insert results
    const { error: resultsError } = await supabase
      .from('aeo_results')
      .insert(resultsData)

    if (resultsError) {
      console.error('Error saving results:', resultsError)
      return { success: false, error: `Failed to save results: ${resultsError.message}` }
    }

    return { success: true }

  } catch (error) {
    console.error('Unexpected error saving results:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

/**
 * Updates the total score for an AEO run
 */
export async function updateAeoScore(
  runId: string,
  totalScore: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  
  if (!supabase) {
    return { success: false, error: 'Supabase client not available' }
  }

  try {
    const { error } = await supabase
      .from('aeo_runs')
      .update({ total_score: totalScore })
      .eq('id', runId)

    if (error) {
      console.error('Error updating AEO score:', error)
      return { success: false, error: `Failed to update score: ${error.message}` }
    }

    return { success: true }

  } catch (error) {
    console.error('Unexpected error updating score:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

/**
 * Retrieves the latest AEO run for a company
 */
export async function getLatestAeoRun(companyId: string): Promise<{
  success: boolean
  data?: Tables<'aeo_runs'>
  error?: string
}> {
  const supabase = createClient()
  
  if (!supabase) {
    return { success: false, error: 'Supabase client not available' }
  }

  try {
    const { data, error } = await supabase
      .from('aeo_runs')
      .select('*')
      .eq('company_id', companyId)
      .order('computed_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error('Error fetching latest AEO run:', error)
      return { success: false, error: `Failed to fetch AEO run: ${error.message}` }
    }

    return { success: true, data }

  } catch (error) {
    console.error('Unexpected error fetching AEO run:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
} 