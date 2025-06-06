import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Tables, TablesInsert } from '../../../supabase/supabase'

export interface OnboardingData {
  // Profile data
  profileData: {
    first_name?: string
    last_name?: string
    company_name?: string
    role?: string
    team_size?: string
    use_case?: string
    domain?: string
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
): Promise<{ success: boolean; companyId?: string; error?: string }> {
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
      first_name: onboardingData.userName || onboardingData.userEmail.split('@')[0], // Use actual name if provided, fallback to email stem
      workspace_name: onboardingData.workspaceName,
      domain: onboardingData.domain,
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
      return { 
        success: true, 
        companyId: existingCompany.id
      }
    }
    
    // No existing company found, create a new one
    const companyData: TablesInsert<'companies'> = {
      company_name: onboardingData.workspaceName,
      root_url: domainUrl,
      submitted_by: user.id,
    }

    console.log('🏢 Creating new company:', onboardingData.workspaceName)
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
          return { 
            success: true, 
            companyId: foundCompany.id
          }
        }
      }
      
      return { success: false, error: `Failed to save company: ${companyError.message}` }
    }
    
    console.log('✅ Company created successfully with ID:', companyResult.id)
    const companyId = companyResult.id

    console.log('🎉 Onboarding data save completed successfully')
    return { 
      success: true, 
      companyId
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
 * Creates an AEO run with the specified question count
 */
export async function createAeoRun(
  companyId: string,
  questionCount: number,
  userId: string
): Promise<{ success: boolean; runId?: string; error?: string }> {
  const supabase = createClient()
  
  if (!supabase) {
    return { success: false, error: 'Supabase client not available' }
  }

  try {
    console.log(`🎯 Creating AEO run for company ${companyId} with ${questionCount} questions`)
    
    const aeoRunData: TablesInsert<'aeo_runs'> = {
      company_id: companyId,
      question_count: questionCount,
      triggered_by: userId,
      total_score: null, // Will be calculated after analysis
      raw_json_path: null, // Could store path to detailed results JSON
    }

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
    return { success: true, runId: runResult.id }

  } catch (error) {
    console.error('❌ Unexpected error creating AEO run:', error)
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
  companyId: string,
  questions: string[],
  userId: string
): Promise<{ success: boolean; runId?: string; error?: string }> {
  console.log('💾 🚨 === STARTING AEO QUESTIONS SAVE === 🚨')
  console.log(`📝 Input: companyId=${companyId}, questions count=${questions.length}, userId=${userId}`)
  
  const supabase = createClient()
  
  if (!supabase) {
    console.error('❌ 🚨 Supabase client not available for questions save!')
    return { success: false, error: 'Supabase client not available' }
  }

  try {
    // 1. First create the AEO run with the correct question count
    console.log('🎯 Creating AEO run before saving questions...')
    const runResult = await createAeoRun(companyId, questions.length, userId)
    
    if (!runResult.success || !runResult.runId) {
      console.error('❌ Failed to create AEO run:', runResult.error)
      return { success: false, error: runResult.error }
    }
    
    const runId = runResult.runId
    console.log('✅ AEO run created with ID:', runId)
    
    // 2. Now save the questions
    console.log(`💾 Preparing ${questions.length} questions for database insertion...`)
    
    // Prepare questions data
    const questionsData: TablesInsert<'aeo_questions'>[] = questions.map((question, index) => ({
      run_id: runId,
      question: question,
      position: index + 1,
    }))

    console.log('📋 Questions data prepared:', {
      count: questionsData.length,
      sample: questionsData.slice(0, 2),
      runId
    })

    // 🚨 CRITICAL: Attempt database insertion
    console.log('💾 🚨 ATTEMPTING DATABASE INSERT FOR QUESTIONS 🚨')
    const { error: questionsError } = await supabase
      .from('aeo_questions')
      .insert(questionsData)

    console.log('📋 Database insert result:', {
      success: !questionsError,
      error: questionsError?.message || 'none',
      errorDetails: questionsError ? {
        code: questionsError.code,
        details: questionsError.details,
        hint: questionsError.hint
      } : null
    })

    if (questionsError) {
      console.error('❌ 🚨 DATABASE INSERT FAILED for questions:', questionsError)
      console.error('🔍 Full error object:', questionsError)
      return { success: false, error: `Failed to save questions: ${questionsError.message}` }
    }

    console.log('✅ 🎉 AEO QUESTIONS SAVE COMPLETED SUCCESSFULLY! 🎉')
    return { success: true, runId }

  } catch (error) {
    console.error('❌ 🚨 EXCEPTION during questions save:', error)
    console.error('🔍 Exception details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      companyId,
      questionsCount: questions.length,
      userId
    })
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
  console.log('📊 Pipeline data structure:', {
    keys: Object.keys(pipelineData),
    hasQuestions: !!pipelineData.questions,
    hasAeoData: !!pipelineData.aeoData,
    hasBreakdown: !!pipelineData.breakdown,
    hasSerpResults: !!pipelineData.serpResults
  })
  
  try {
    // Check for questions array directly in pipeline data (new format)
    if (pipelineData.questions && Array.isArray(pipelineData.questions)) {
      console.log(`✅ Found ${pipelineData.questions.length} questions in pipeline data.questions`)
      return pipelineData.questions
    }
    
    // Check serpResults and extract questions from there
    if (pipelineData.serpResults && typeof pipelineData.serpResults === 'object') {
      const questions = Object.keys(pipelineData.serpResults)
      if (questions.length > 0) {
        console.log(`✅ Found ${questions.length} questions from serpResults keys`)
        return questions
      }
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
    console.log('📊 Full data sample:', JSON.stringify(pipelineData, null, 2).substring(0, 500))
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
  console.log('📊 Pipeline data structure for results:', {
    keys: Object.keys(pipelineData),
    hasSerpResults: !!pipelineData.serpResults,
    serpResultsType: typeof pipelineData.serpResults,
    serpResultsKeys: pipelineData.serpResults ? Object.keys(pipelineData.serpResults) : null,
    questionIdsCount: questionIds.size
  })
  
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
    
    const targetDomain = pipelineData.targetDomain || extractDomainFromUrl(pipelineData.crawlUrl || '')
    console.log('🎯 Target domain for classification:', targetDomain)
    
    // Handle serpResults as object (question -> results mapping)
    if (pipelineData.serpResults && typeof pipelineData.serpResults === 'object') {
      console.log(`📊 Processing serpResults object with ${Object.keys(pipelineData.serpResults).length} questions`)
      
      Object.entries(pipelineData.serpResults).forEach(([question, serpData]: [string, any]) => {
        const questionId = questionIds.get(question)
        
        if (!questionId) {
          console.log(`⚠️ No question ID found for: ${question}`)
          return
        }
        
        // Handle both array format and object with results property
        const serpResults = Array.isArray(serpData) ? serpData : (serpData?.results || serpData?.organic || [])
        
        if (Array.isArray(serpResults)) {
          console.log(`📊 Processing ${serpResults.length} results for question: ${question}`)
          
          serpResults.forEach((result: any, index: number) => {
            // Classify URL as owned, operated, or earned
            const resultDomain = extractDomainFromUrl(result.url || result.link || '')
            let bucket: 'owned' | 'operated' | 'earned' = 'earned'
            
            if (resultDomain === targetDomain) {
              bucket = 'owned'
            } else if (isOperatedDomain(resultDomain, targetDomain)) {
              bucket = 'operated'
            }
            
            results.push({
              questionId,
              rank: index + 1, // SERP position (1-based)
              url: result.url || result.link || '',
              title: result.title || null,
              snippet: result.snippet || result.description || null,
              domain: resultDomain,
              bucket
            })
          })
        }
      })
    }
    
    // Extract from SERP results (array format - legacy)
    if (pipelineData.serpResults && Array.isArray(pipelineData.serpResults) && results.length === 0) {
      console.log(`📊 Processing ${pipelineData.serpResults.length} SERP results (array format)`)
      
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
  companyId: string,
  pipelineData: any,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  console.log('💾 🚨 === STARTING COMPLETE AEO ANALYSIS SAVE === 🚨')
  console.log('📊 Input parameters:', {
    companyId,
    userId,
    hasPipelineData: !!pipelineData,
    pipelineDataType: typeof pipelineData,
    pipelineDataKeys: pipelineData ? Object.keys(pipelineData) : []
  })
  
  // 🚨 CRITICAL: Check Supabase client availability
  const supabase = createClient()
  console.log('🔍 Supabase client check:', {
    clientExists: !!supabase,
    clientType: typeof supabase
  })
  
  if (!supabase) {
    console.error('❌ 🚨 CRITICAL: Supabase client not available!')
    return { success: false, error: 'Supabase client not available' }
  }
  
  console.log('📊 Pipeline data received:', {
    keys: Object.keys(pipelineData),
    hasAeoData: !!pipelineData.aeoData,
    hasBreakdown: !!pipelineData.aeoData?.breakdown,
    hasQuestions: !!pipelineData.questions,
    hasResults: !!pipelineData.results,
    structure: JSON.stringify(pipelineData, null, 2).substring(0, 1000) + '...'
  })
  
  try {
    // 1. Extract and save questions (this will create the AEO run)
    console.log('🔍 🚨 STEP 1: EXTRACTING QUESTIONS 🚨')
    const questions = extractQuestionsFromPipelineData(pipelineData)
    console.log(`📝 Extracted ${questions.length} questions:`, questions.slice(0, 5))
    
    if (questions.length > 0) {
      console.log('💾 🚨 STEP 1A: SAVING QUESTIONS TO DATABASE (THIS CREATES AEO RUN) 🚨')
      const questionsResult = await saveAeoQuestions(companyId, questions, userId)
      console.log('📋 Questions save result:', questionsResult)
      
      if (!questionsResult.success || !questionsResult.runId) {
        console.error('❌ 🚨 STEP 1A FAILED: Questions save failed:', questionsResult.error)
        return questionsResult
      }
      
      const runId = questionsResult.runId
      console.log('✅ 🎉 STEP 1A SUCCESS: Questions saved successfully with runId:', runId)
      
      // 2. Get question IDs for results mapping
      console.log('🔍 🚨 STEP 2: FETCHING SAVED QUESTIONS FOR MAPPING 🚨')
      const { data: savedQuestions, error: fetchError } = await supabase
        .from('aeo_questions')
        .select('id, question')
        .eq('run_id', runId)
      
      console.log('📋 Fetch questions result:', {
        savedQuestions: savedQuestions?.length || 0,
        fetchError: fetchError?.message || 'none',
        runId
      })
      
      if (fetchError) {
        console.error('❌ 🚨 STEP 2 FAILED: Error fetching saved questions:', fetchError)
        return { success: false, error: `Failed to fetch questions: ${fetchError.message}` }
      }
      
      console.log(`📋 🎉 STEP 2 SUCCESS: Found ${savedQuestions?.length || 0} saved questions`)
      
      // Create question ID mapping
      const questionIds = new Map<string, string>()
      savedQuestions?.forEach(q => {
        questionIds.set(q.question, q.id)
      })
      console.log('🗂️ Question ID mapping created:', Array.from(questionIds.entries()).slice(0, 3))
      
      // 3. Extract and save results
      console.log('🔍 🚨 STEP 3: EXTRACTING RESULTS 🚨')
      const results = extractResultsFromPipelineData(pipelineData, questionIds)
      console.log(`📊 Extracted ${results.length} results:`, results.slice(0, 3))
      
      if (results.length > 0) {
        console.log('💾 🚨 STEP 3A: SAVING RESULTS TO DATABASE 🚨')
        const resultsResult = await saveAeoResults(runId, results)
        console.log('📋 Results save result:', resultsResult)
        
        if (!resultsResult.success) {
          console.error('❌ 🚨 STEP 3A FAILED: Results save failed:', resultsResult.error)
          return resultsResult
        }
        console.log('✅ 🎉 STEP 3A SUCCESS: Results saved successfully! 🎉')
      } else {
        console.warn('⚠️ 🚨 STEP 3 WARNING: No results found to save 🚨')
      }
      
      // 4. Update total score and complete onboarding
      const totalScore = pipelineData.overallScore ?? pipelineData.aeoData?.aeo_score ?? pipelineData.aeo_score ?? 0
      console.log('📈 🚨 STEP 4: UPDATING SCORE 🚨')
      console.log('📈 Total score to save:', totalScore)
      
      if (totalScore > 0) {
        console.log('💾 🚨 STEP 4A: UPDATING AEO SCORE AND COMPLETING ONBOARDING 🚨')
        const scoreResult = await updateAeoScore(runId, totalScore, userId)
        console.log('📋 Score update result:', scoreResult)
        
        if (!scoreResult.success) {
          console.error('❌ 🚨 STEP 4A FAILED: Score update failed:', scoreResult.error)
          return scoreResult
        }
        console.log('✅ 🎉 STEP 4A SUCCESS: Score updated and onboarding completed! 🎉')
      } else {
        console.warn('⚠️ 🚨 STEP 4 WARNING: No valid score found to save 🚨')
      }
      
    } else {
      console.warn('⚠️ 🚨 STEP 1 WARNING: No questions found to save 🚨')
      return { success: false, error: 'No questions found in pipeline data' }
    }
    
    console.log('🎉 🚨 === COMPLETE AEO ANALYSIS SAVE COMPLETED SUCCESSFULLY === 🚨')
    return { success: true }
    
  } catch (error) {
    console.error('❌ 🚨 CRITICAL ERROR in complete AEO analysis save:', error)
    console.error('🔍 Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      companyId,
      userId
    })
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