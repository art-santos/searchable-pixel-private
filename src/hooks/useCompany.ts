import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'

interface Company {
  id: string
  company_name: string
  root_url: string
  submitted_by?: string
}

interface UseCompanyResult {
  company: Company | null
  isLoading: boolean
  error: string | null
  createCompany: (companyData: Omit<Company, 'id'>) => Promise<Company>
}

export function useCompany(): UseCompanyResult {
  const { user } = useAuth()
  const [company, setCompany] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createCompany = async (companyData: Omit<Company, 'id'>): Promise<Company> => {
    const supabase = createClient()
    
    if (!supabase) {
      throw new Error('Failed to create Supabase client')
    }
    
    const { data, error } = await supabase
      .from('companies')
      .insert({
        company_name: companyData.company_name,
        root_url: companyData.root_url,
        submitted_by: user?.id
      })
      .select('*')
      .single()

    if (error) {
      console.error('Create company error:', error)
      throw new Error(`Failed to create company: ${error.message}`)
    }

    setCompany(data)
    return data
  }

  useEffect(() => {
    if (!user) {
      console.log('useCompany: No user, clearing company')
      setCompany(null)
      setIsLoading(false)
      return
    }

    const fetchCompany = async () => {
      console.log('useCompany: Starting fetch for user:', user.id)
      setIsLoading(true)
      setError(null)
      
      try {
        const supabase = createClient()
        
        if (!supabase) {
          throw new Error('Failed to create Supabase client')
        }
        
        console.log('useCompany: Executing Supabase query...')
        const startTime = Date.now()
        
        // Fetch ALL companies for this user, then pick the first one
        const { data: companies, error: fetchError } = await supabase
          .from('companies')
          .select('*')
          .eq('submitted_by', user.id)

        const queryTime = Date.now() - startTime
        console.log(`useCompany: Query completed in ${queryTime}ms`)

        if (fetchError) {
          console.error('useCompany: Company fetch error:', fetchError)
          throw fetchError
        }

        console.log(`useCompany: Found ${companies?.length || 0} companies for user`)
        
        if (companies && companies.length > 0) {
          // Use the first company
          const selectedCompany = companies[0]
          console.log('useCompany: Using company:', selectedCompany.id, selectedCompany.company_name)
          setCompany(selectedCompany)
          
          // Log if there are multiple companies (for debugging)
          if (companies.length > 1) {
            console.warn(`useCompany: User has ${companies.length} companies. Using first one:`, selectedCompany.company_name)
          }
        } else {
          // No companies found - this should trigger onboarding
          console.log('useCompany: No companies found for user. Onboarding should appear.')
          setCompany(null)
        }
      } catch (err) {
        console.error('useCompany: Error fetching company:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setCompany(null)
      } finally {
        console.log('useCompany: Setting isLoading to false')
        setIsLoading(false)
      }
    }

    fetchCompany()
  }, [user?.id]) // Only depend on user.id, not the entire user object

  return {
    company,
    isLoading,
    error,
    createCompany
  }
} 