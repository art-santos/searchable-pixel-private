'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Check, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'

// Check if waitlist is enabled via environment variable
// Set NEXT_PUBLIC_WAITLIST_ENABLED=true to enable waitlist
// By default, it redirects to signup
function useWaitlistCheck() {
  useEffect(() => {
    const waitlistEnabled = process.env.NEXT_PUBLIC_WAITLIST_ENABLED === 'true'
    if (!waitlistEnabled) {
      redirect('/signup')
    }
  }, [])
}

const hostingPlatforms = [
  // Popular no-code platforms
  { id: 'vercel', name: 'Vercel' },
  { id: 'netlify', name: 'Netlify' },
  { id: 'webflow', name: 'Webflow' },
  { id: 'framer', name: 'Framer' },
  { id: 'wix', name: 'Wix' },
  { id: 'squarespace', name: 'Squarespace' },
  { id: 'wordpress', name: 'WordPress' },
  { id: 'shopify', name: 'Shopify' },
  { id: 'ghost', name: 'Ghost' },
  { id: 'notion', name: 'Notion' },
  // Cloud providers
  { id: 'aws', name: 'AWS' },
  { id: 'gcp', name: 'Google Cloud' },
  { id: 'azure', name: 'Microsoft Azure' },
  { id: 'digitalocean', name: 'DigitalOcean' },
  // PaaS platforms
  { id: 'heroku', name: 'Heroku' },
  { id: 'railway', name: 'Railway' },
  { id: 'render', name: 'Render' },
  { id: 'fly', name: 'Fly.io' },
  // Static hosting
  { id: 'cloudflare', name: 'Cloudflare Pages' },
  { id: 'github-pages', name: 'GitHub Pages' },
  { id: 'gitlab-pages', name: 'GitLab Pages' },
  // Other
  { id: 'self-hosted', name: 'Self-hosted' },
  { id: 'other', name: 'Other' }
]

const interestOptions = [
  { id: 'llm-visitors', label: 'Seeing what LLMs are visiting my site' },
  { id: 'visibility-score', label: 'Checking my site\'s overall visibility score' },
  { id: 'improve-aeo', label: 'Improving my AEO visibility' },
  { id: 'ai-content', label: 'Getting AI-generated content recommendations' },
  { id: 'competitor-tracking', label: 'Tracking competitor AI visibility' },
  { id: 'citation-sources', label: 'Understanding AI citation sources' }
]

export default function WaitlistPage() {
  // Check if waitlist is enabled, redirect to signup if not
  useWaitlistCheck()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    website: '',
    hosting: '',
    interests: [] as string[]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [waitlistPosition, setWaitlistPosition] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const supabase = createClientComponentClient()

  // Load email from sessionStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEmail = sessionStorage.getItem('waitlistEmail')
      if (savedEmail) {
        setFormData(prev => ({ ...prev, email: savedEmail }))
        sessionStorage.removeItem('waitlistEmail')
      }
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInterestToggle = (interestId: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      // Validate website URL
      let websiteUrl = formData.website.trim()
      if (!websiteUrl.startsWith('http://') && !websiteUrl.startsWith('https://')) {
        websiteUrl = `https://${websiteUrl}`
      }

      // 1. Submit to Supabase waitlist table
      const { data, error: supabaseError } = await supabase
        .from('waitlist')
        .insert([{
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          email: formData.email.trim().toLowerCase(),
          website_url: websiteUrl,
          hosting_platform: formData.hosting,
          interests: formData.interests
        }])
        .select()
        .single()

      if (supabaseError) {
        if (supabaseError.code === '23505') { // Unique constraint violation
          setError('This email is already on the waitlist!')
        } else {
          setError('Something went wrong. Please try again.')
        }
        setIsSubmitting(false)
        return
      }

      // Get the waitlist count to show real position
      const { count } = await supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true })
      
      // Set position starting at 46
      setWaitlistPosition((count || 0) + 46)

      // 2. Submit to Loops (non-blocking)
      const loopsFormBody = new URLSearchParams({
        email: formData.email.trim().toLowerCase(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        websiteUrl: websiteUrl,
        hostingPlatform: formData.hosting,
        interests: formData.interests.join(', '),
        userGroup: 'Waitlist',
        source: 'Early Access Waitlist'
      }).toString()

      fetch('https://app.loops.so/api/newsletter-form/cmb5vrlua29icyq0iha1pm14f', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: loopsFormBody,
      }).then(async response => {
        if (response.ok) {
          // Update Supabase record to mark Loops submission
          await supabase
            .from('waitlist')
            .update({ 
              loops_submitted: true,
              loops_submitted_at: new Date().toISOString()
            })
            .eq('id', data.id)
        }
      }).catch(error => {
        // Don't block the flow on Loops errors
      })

      // Show success state
      setIsSubmitted(true)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = () => {
    return formData.firstName.trim() && 
           formData.lastName.trim() && 
           formData.email.trim() && 
           formData.website.trim() && 
           formData.hosting &&
           formData.interests.length > 0 &&
           !isSubmitting
  }

  const selectedPlatform = hostingPlatforms.find(p => p.id === formData.hosting)

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <Check className="w-6 h-6 text-green-500" />
          </div>
          <h1 className="text-2xl font-medium text-white mb-2">You're on the list</h1>
          <p className="text-[#888] text-sm mb-8">
            We'll send more info to {formData.email} about early access.
          </p>
          <div className="text-left space-y-3 text-sm text-[#666] mb-8">
            <div className="flex items-start gap-3">
              <div className="w-px h-4 bg-[#333] mt-0.5" />
              <p>You're in position #{waitlistPosition} on the waitlist</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-px h-4 bg-[#333] mt-0.5" />
              <p>Early access includes free visibility analysis</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-px h-4 bg-[#333] mt-0.5" />
              <p>Priority support for early adopters</p>
            </div>
          </div>
          
          {/* Resources CTA */}
          <div className="mt-8 p-6 bg-[#111] border border-[#1a1a1a] rounded-lg">
            <h3 className="text-white font-medium mb-2">Want to improve your AI visibility now?</h3>
            <p className="text-[#888] text-sm mb-4">
              Check out our free resources and guides while you wait.
            </p>
            <Link 
              href="/resources" 
              className="inline-flex items-center gap-2 text-white hover:text-white/80 transition-colors text-sm font-medium"
            >
              Browse free resources
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="max-w-md w-full px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo and Header */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-6">
              <Link href="/" className="inline-block opacity-80 hover:opacity-100 transition-opacity">
                <Image 
                  src="/images/split-full-text.svg" 
                  alt="Split" 
                  width={80} 
                  height={28}
                />
              </Link>
            </div>
            <h1 className="text-3xl font-medium text-white mb-2">
              Sign up for early access
            </h1>
            <p className="text-[#888] text-sm">
              Be among the first to track your AI visibility.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="First name"
                  className="h-10 bg-transparent border-[#1a1a1a] text-white placeholder:text-[#666] focus:border-[#333] transition-colors"
                  required
                />
              </div>
              <div>
                <Input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Last name"
                  className="h-10 bg-transparent border-[#1a1a1a] text-white placeholder:text-[#666] focus:border-[#333] transition-colors"
                  required
                />
              </div>
            </div>

            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Email"
              className="h-10 bg-transparent border-[#1a1a1a] text-white placeholder:text-[#666] focus:border-[#333] transition-colors"
              required
            />

            <Input
              type="text"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="Website"
              className="h-10 bg-transparent border-[#1a1a1a] text-white placeholder:text-[#666] focus:border-[#333] transition-colors"
              required
            />

            {/* Custom Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`w-full h-10 px-3 pr-8 bg-transparent border rounded-md text-left transition-colors flex items-center justify-between ${
                  dropdownOpen ? 'border-[#333]' : 'border-[#1a1a1a]'
                } ${selectedPlatform ? 'text-white' : 'text-[#666]'}`}
              >
                <span className="truncate">
                  {selectedPlatform ? selectedPlatform.name : 'How is your site hosted?'}
                </span>
                <ChevronDown className={`w-4 h-4 text-[#666] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-10 w-full mt-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded-md shadow-lg max-h-60 overflow-auto"
                  >
                    <div className="py-1">
                      {hostingPlatforms.map((platform) => (
                        <button
                          key={platform.id}
                          type="button"
                          onClick={() => {
                            setFormData({ ...formData, hosting: platform.id })
                            setDropdownOpen(false)
                          }}
                          className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                            formData.hosting === platform.id
                              ? 'bg-[#1a1a1a] text-white'
                              : 'text-[#888] hover:bg-[#1a1a1a] hover:text-white'
                          }`}
                        >
                          {platform.name}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Interest Checkboxes */}
            <div>
              <label className="block text-sm text-[#888] mb-3">What are you most interested in?</label>
              <div className="space-y-2">
                {interestOptions.map((interest) => (
                  <button
                    key={interest.id}
                    type="button"
                    onClick={() => handleInterestToggle(interest.id)}
                    className={`w-full py-2.5 px-3 rounded-lg border text-left transition-all duration-200 group ${
                      formData.interests.includes(interest.id)
                        ? 'border-[#333] bg-[#111]'
                        : 'border-[#1a1a1a] hover:border-[#2a2a2a] hover:bg-[#0f0f0f]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative flex items-center justify-center">
                        <div className={`w-4 h-4 rounded border-2 transition-all duration-200 ${
                          formData.interests.includes(interest.id)
                            ? 'border-white bg-transparent'
                            : 'border-[#333] bg-transparent group-hover:border-[#444]'
                        }`} />
                        <AnimatePresence>
                          {formData.interests.includes(interest.id) && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ 
                                type: "spring",
                                stiffness: 500,
                                damping: 30
                              }}
                              className="absolute inset-0 flex items-center justify-center"
                            >
                              <motion.div
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.2, delay: 0.1 }}
                              >
                                <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <span className={`text-sm transition-colors duration-200 ${
                        formData.interests.includes(interest.id)
                          ? 'text-white'
                          : 'text-[#888] group-hover:text-[#aaa]'
                      }`}>
                        {interest.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={!canSubmit()}
              className="w-full h-10 bg-white text-black hover:bg-white/90 transition-colors font-medium text-sm"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                  Joining...
                </>
              ) : (
                <>
                  Join waitlist
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </>
              )}
            </Button>
          </form>

          {/* Footer info */}
          <div className="mt-12 pt-8 border-t border-[#1a1a1a]">
            <div className="flex items-center justify-between text-xs text-[#666]">
              <span>Free during early access</span>
              <span>Limited spots available</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 