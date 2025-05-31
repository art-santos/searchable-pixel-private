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
    console.log('💾 Starting onboarding data save...')
    
    // 1. Create/Update user profile with comprehensive data
    const profileData: TablesInsert<'profiles'> = {
      id: user.id,
      email: onboardingData.userEmail,
      first_name: onboardingData.userEmail.split('@')[0], // Extract name from email
      workspace_name: onboardingData.workspaceName,
      created_by: user.id,
      updated_by: user.id,
      onboarding_completed: false, // Will be set to true after AEO analysis
      onboarding_completed_at: null,
      // Initialize usage tracking
      monthly_scans_used: 1, // Count this first scan
      monthly_articles_used: 0,
      last_scan_reset_at: new Date().toISOString(),
      last_articles_reset_at: new Date().toISOString(),
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

    const companyData: TablesInsert<'companies'> = {
      company_name: onboardingData.workspaceName,
      root_url: domainUrl,
      submitted_by: user.id,
    }

    console.log('🏢 Creating company:', onboardingData.workspaceName)
    const { data: companyResult, error: companyError } = await supabase
      .from('companies')
      .insert(companyData)
      .select('id')
      .single()

    if (companyError) {
      console.error('❌ Error saving company:', companyError)
      return { success: false, error: `Failed to save company: ${companyError.message}` }
    }
    console.log('✅ Company saved successfully with ID:', companyResult.id)

    const companyId = companyResult.id

    // 3. Create AEO run entry for the visibility analysis
    const aeoRunData: TablesInsert<'aeo_runs'> = {
      company_id: companyId,
      question_count: 0, // Will be updated when questions are generated
      triggered_by: user.id,
      total_score: null, // Will be calculated after analysis
      raw_json_path: null, // Could store path to detailed results JSON
    }

    console.log('🎯 Creating AEO run for company:', companyId)
    const { data: runResult, error: runError } = await supabase
      .from('aeo_runs')
      .insert(aeoRunData)
      .select('id')
      .single()

    if (runError) {
      console.error('❌ Error creating AEO run:', runError)
      return { success: false, error: `Failed to create AEO run: ${runError.message}` }
    }
    console.log('✅ AEO run created successfully with ID:', runResult.id)

    const runId = runResult.id

    console.log('🎉 Onboarding data save completed successfully')
    return { 
      success: true, 
      companyId, 
      runId 
    }

  } catch (error) {
    console.error('❌ Unexpected error saving onboarding data:', error)
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
    console.log(`💾 Saving ${questions.length} questions for run:`, runId)
    
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
      console.error('❌ Error saving questions:', questionsError)
      return { success: false, error: `Failed to save questions: ${questionsError.message}` }
    }

    // Update run with question count
    const { error: updateError } = await supabase
      .from('aeo_runs')
      .update({ question_count: questions.length })
      .eq('id', runId)

    if (updateError) {
      console.error('❌ Error updating question count:', updateError)
      // Don't fail for this - questions are saved
    }

    console.log('✅ Questions saved successfully')
    return { success: true }

  } catch (error) {
    console.error('❌ Unexpected error saving questions:', error)
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
    console.log(`💾 Saving ${results.length} results for run:`, runId)
    
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

    // Insert results in batches (Supabase has limits)
    const batchSize = 1000
    for (let i = 0; i < resultsData.length; i += batchSize) {
      const batch = resultsData.slice(i, i + batchSize)
      
      const { error: resultsError } = await supabase
        .from('aeo_results')
        .insert(batch)

      if (resultsError) {
        console.error(`❌ Error saving results batch ${i / batchSize + 1}:`, resultsError)
        return { success: false, error: `Failed to save results: ${resultsError.message}` }
      }
    }

    console.log('✅ Results saved successfully')
    return { success: true }

  } catch (error) {
    console.error('❌ Unexpected error saving results:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

/**
 * Updates the total score for an AEO run and marks profile onboarding as complete
 */
export async function updateAeoScore(
  runId: string,
  totalScore: number,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()
  
  if (!supabase) {
    return { success: false, error: 'Supabase client not available' }
  }

  try {
    console.log(`💾 Updating AEO score to ${totalScore} for run:`, runId)
    
    // Update the run with the total score
    const { error: scoreError } = await supabase
      .from('aeo_runs')
      .update({ total_score: totalScore })
      .eq('id', runId)

    if (scoreError) {
      console.error('❌ Error updating AEO score:', scoreError)
      return { success: false, error: `Failed to update score: ${scoreError.message}` }
    }

    // If userId provided, mark onboarding as complete
    if (userId) {
      const { error: onboardingError } = await supabase
        .from('profiles')
        .update({ 
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          updated_by: userId
        })
        .eq('id', userId)

      if (onboardingError) {
        console.error('❌ Error updating onboarding status:', onboardingError)
        // Don't fail the whole operation for this
      } else {
        console.log('✅ Onboarding marked as complete for user:', userId)
      }
    }

    console.log('✅ AEO score updated successfully')
    return { success: true }

  } catch (error) {
    console.error('❌ Unexpected error updating score:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }
  }
}

/**
 * Extracts questions from AEO pipeline data structure
 */
export function extractQuestionsFromPipelineData(pipelineData: any): string[] {
  console.log('🔍 Extracting questions from pipeline data...')
  
  try {
    // Check for questions array directly in pipeline data (new format)
    if (pipelineData.questions && Array.isArray(pipelineData.questions)) {
      console.log(`✅ Found ${pipelineData.questions.length} questions in pipeline data.questions`)
      return pipelineData.questions
    }
    
    // Check for questions in aeoData (transformed format)
    if (pipelineData.aeoData?.questions && Array.isArray(pipelineData.aeoData.questions)) {
      console.log(`✅ Found ${pipelineData.aeoData.questions.length} questions in aeoData.questions`)
      return pipelineData.aeoData.questions
    }
    
    // Check various possible structures where questions might be stored
    if (pipelineData.aeoData?.breakdown?.by_question) {
      // Extract from question analysis breakdown
      const questions = pipelineData.aeoData.breakdown.by_question.map((q: any) => q.question)
      console.log(`✅ Found ${questions.length} questions in aeoData.breakdown.by_question`)
      return questions
    }
    
    if (pipelineData.breakdown?.by_question) {
      // Extract from breakdown
      const questions = pipelineData.breakdown.by_question.map((q: any) => q.question)
      console.log(`✅ Found ${questions.length} questions in breakdown.by_question`)
      return questions
    }
    
    // Check if there's a separate questions object with questions property
    if (pipelineData.questionsData?.questions) {
      console.log(`✅ Found ${pipelineData.questionsData.questions.length} questions in questionsData.questions`)
      return pipelineData.questionsData.questions
    }
    
    console.log('⚠️ No questions found in pipeline data structure')
    console.log('📊 Available data keys:', Object.keys(pipelineData))
    return []
    
  } catch (error) {
    console.error('❌ Error extracting questions:', error)
    return []
  }
}

/**
 * Extracts and formats results from AEO pipeline data structure
 */
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
  console.log('🔍 Extracting results from pipeline data...')
  
  try {
    const results: Array<{
      questionId: string
      rank: number
      url: string
      title?: string
      snippet?: string
      domain: string
      bucket: 'owned' | 'operated' | 'earned'
    }> = []
    
    const targetDomain = pipelineData.targetDomain || 'unknown'
    console.log('🎯 Target domain for classification:', targetDomain)
    
    // Extract from SERP results (new format)
    if (pipelineData.serpResults && Array.isArray(pipelineData.serpResults)) {
      console.log(`📊 Processing ${pipelineData.serpResults.length} SERP results`)
      
      pipelineData.serpResults.forEach((serpResult: any) => {
        const question = serpResult.question
        const questionId = questionIds.get(question)
        
        if (!questionId) {
          console.log(`⚠️ No question ID found for: ${question}`)
          return
        }
        
        if (serpResult.results && Array.isArray(serpResult.results)) {
          serpResult.results.forEach((result: any, index: number) => {
            // Classify URL as owned, operated, or earned
            const resultDomain = extractDomainFromUrl(result.url || '')
            let bucket: 'owned' | 'operated' | 'earned' = 'earned'
            
            if (resultDomain === targetDomain) {
              bucket = 'owned'
            } else if (isOperatedDomain(resultDomain, targetDomain)) {
              bucket = 'operated'
            }
            
            results.push({
              questionId,
              rank: index + 1, // SERP position (1-based)
              url: result.url || '',
              title: result.title || null,
              snippet: result.snippet || result.description || null,
              domain: resultDomain,
              bucket
            })
          })
        }
      })
    }
    
    // Extract from classified results (alternative format)
    if (pipelineData.classifiedResults && results.length === 0) {
      console.log('📊 Processing classified results')
      
      // This would need to be implemented based on the classified results structure
      // For now, we'll focus on the SERP results format above
    }
    
    // Extract from question breakdown (legacy format)
    if (pipelineData.aeoData?.breakdown?.by_question && results.length === 0) {
      console.log('📊 Processing legacy breakdown format')
      const questionData = pipelineData.aeoData.breakdown.by_question
      
      questionData.forEach((questionAnalysis: any) => {
        const question = questionAnalysis.question
        const questionId = questionIds.get(question)
        
        if (!questionId) {
          console.log(`⚠️ No question ID found for: ${question}`)
          return
        }
        
        // Add owned results
        if (questionAnalysis.owned_positions && questionAnalysis.owned_positions.length > 0) {
          questionAnalysis.owned_positions.forEach((position: number, index: number) => {
            results.push({
              questionId,
              rank: position,
              url: `owned-result-${index}`, // Would need actual URL from SERP data
              title: `Owned content for: ${question}`,
              snippet: questionAnalysis.snippet || null,
              domain: targetDomain,
              bucket: 'owned'
            })
          })
        }
        
        // Add operated results
        if (questionAnalysis.operated_positions && questionAnalysis.operated_positions.length > 0) {
          questionAnalysis.operated_positions.forEach((position: number, index: number) => {
            results.push({
              questionId,
              rank: position,
              url: `operated-result-${index}`, // Would need actual URL from SERP data
              title: `Operated content for: ${question}`,
              snippet: questionAnalysis.snippet || null,
              domain: `operated.${targetDomain}`,
              bucket: 'operated'
            })
          })
        }
      })
    }
    
    console.log(`✅ Extracted ${results.length} results from pipeline data`)
    console.log('📈 Results breakdown:', {
      owned: results.filter(r => r.bucket === 'owned').length,
      operated: results.filter(r => r.bucket === 'operated').length,
      earned: results.filter(r => r.bucket === 'earned').length
    })
    
    return results
    
  } catch (error) {
    console.error('❌ Error extracting results:', error)
    return []
  }
}

/**
 * Helper function to extract domain from URL
 */
function extractDomainFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.replace(/^www\./, '')
  } catch {
    // If URL parsing fails, try to extract domain manually
    return url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]
  }
}

/**
 * Helper function to check if a domain is operated (social media, directories, etc.)
 */
function isOperatedDomain(domain: string, targetDomain: string): boolean {
  const operatedDomains = [
    'linkedin.com',
    'twitter.com', 
    'x.com',
    'facebook.com',
    'instagram.com',
    'youtube.com',
    'github.com',
    'medium.com',
    'substack.com',
    'reddit.com',
    'quora.com',
    'stackoverflow.com',
    'crunchbase.com',
    'glassdoor.com',
    'yelp.com',
    'g2.com',
    'capterra.com',
    'trustpilot.com',
    'producthunt.com'
  ]
  
  // Check if it's a social media or directory domain
  if (operatedDomains.some(od => domain.includes(od))) {
    return true
  }
  
  // Check if it's a subdomain of the target domain
  if (domain.includes(targetDomain) && domain !== targetDomain) {
    return true
  }
  
  return false
}

/**
 * Comprehensive AEO data save - handles the complete pipeline data structure
 */
export async function saveCompleteAeoAnalysis(
  runId: string,
  pipelineData: any,
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  console.log('💾 Starting complete AEO analysis save...')
  console.log('📊 Pipeline data received:', {
    keys: Object.keys(pipelineData),
    hasAeoData: !!pipelineData.aeoData,
    hasBreakdown: !!pipelineData.aeoData?.breakdown,
    hasQuestions: !!pipelineData.questions,
    hasResults: !!pipelineData.results,
    structure: JSON.stringify(pipelineData, null, 2).substring(0, 1000) + '...'
  })
  
  try {
    // 1. Extract and save questions
    console.log('🔍 Extracting questions from pipeline data...')
    const questions = extractQuestionsFromPipelineData(pipelineData)
    console.log(`📝 Extracted ${questions.length} questions:`, questions.slice(0, 5))
    
    if (questions.length > 0) {
      console.log('💾 Saving questions to database...')
      const questionsResult = await saveAeoQuestions(runId, questions)
      if (!questionsResult.success) {
        console.error('❌ Failed to save questions:', questionsResult.error)
        return questionsResult
      }
      console.log('✅ Questions saved successfully')
    } else {
      console.warn('⚠️ No questions found to save')
    }
    
    // 2. Get question IDs for results mapping
    console.log('🔍 Fetching saved questions for results mapping...')
    const supabase = createClient()
    if (!supabase) {
      return { success: false, error: 'Supabase client not available' }
    }
    
    const { data: savedQuestions, error: fetchError } = await supabase
      .from('aeo_questions')
      .select('id, question')
      .eq('run_id', runId)
    
    if (fetchError) {
      console.error('❌ Error fetching saved questions:', fetchError)
      return { success: false, error: `Failed to fetch questions: ${fetchError.message}` }
    }
    
    console.log(`📋 Found ${savedQuestions?.length || 0} saved questions`)
    
    // Create question ID mapping
    const questionIds = new Map<string, string>()
    savedQuestions?.forEach(q => {
      questionIds.set(q.question, q.id)
    })
    console.log('🗂️ Question ID mapping created:', Array.from(questionIds.entries()).slice(0, 3))
    
    // 3. Extract and save results
    console.log('🔍 Extracting results from pipeline data...')
    const results = extractResultsFromPipelineData(pipelineData, questionIds)
    console.log(`📊 Extracted ${results.length} results:`, results.slice(0, 3))
    
    if (results.length > 0) {
      console.log('💾 Saving results to database...')
      const resultsResult = await saveAeoResults(runId, results)
      if (!resultsResult.success) {
        console.error('❌ Failed to save results:', resultsResult.error)
        return resultsResult
      }
      console.log('✅ Results saved successfully')
    } else {
      console.warn('⚠️ No results found to save')
    }
    
    // 4. Update total score and complete onboarding
    const totalScore = pipelineData.overallScore ?? pipelineData.aeoData?.aeo_score ?? 0
    console.log('📈 Total score to save:', totalScore)
    
    if (totalScore > 0) {
      console.log('💾 Updating AEO score and completing onboarding...')
      const scoreResult = await updateAeoScore(runId, totalScore, userId)
      if (!scoreResult.success) {
        console.error('❌ Failed to update score:', scoreResult.error)
        return scoreResult
      }
      console.log('✅ Score updated and onboarding completed')
    } else {
      console.warn('⚠️ No valid score found to save')
    }
    
    console.log('🎉 Complete AEO analysis save completed successfully')
    return { success: true }
    
  } catch (error) {
    console.error('❌ Error in complete AEO analysis save:', error)
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