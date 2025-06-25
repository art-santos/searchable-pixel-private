'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import Image from 'next/image'
import { getCalApi } from "@calcom/embed-react"

interface LeadsEarlyAccessDialogProps {
  isOpen: boolean
  onClose: () => void
}

interface FormData {
  contactName: string
  contactEmail: string
  companyName: string
  websiteUrl: string
  activeSplitUser: string
  monthlyTraffic: string
  averageContractValue: string
  idealCustomerProfile: string
  sellingTo: string
  customEnrichments: string
  techStack: string
  additionalInfo: string
}

export function LeadsEarlyAccessDialog({ isOpen, onClose }: LeadsEarlyAccessDialogProps) {
  const [showPreview, setShowPreview] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCalEmbed, setShowCalEmbed] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    contactName: '',
    contactEmail: '',
    companyName: '',
    websiteUrl: '',
    activeSplitUser: '',
    monthlyTraffic: '',
    averageContractValue: '',
    idealCustomerProfile: '',
    sellingTo: '',
    customEnrichments: '',
    techStack: '',
    additionalInfo: ''
  })

  // Load Cal.com API when component mounts
  useEffect(() => {
    (async function () {
      const cal = await getCalApi({"namespace":"split"});
      cal("ui", {"hideEventTypeDetails":false,"layout":"month_view"});
    })();
  }, [])

  const handleClose = () => {
    if (!isSubmitting) {
      setShowPreview(true)
      setShowCalEmbed(false)
      setIsSuccess(false)
      setFormData({
        contactName: '',
        contactEmail: '',
        companyName: '',
        websiteUrl: '',
        activeSplitUser: '',
        monthlyTraffic: '',
        averageContractValue: '',
        idealCustomerProfile: '',
        sellingTo: '',
        customEnrichments: '',
        techStack: '',
        additionalInfo: ''
      })
      onClose()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('leads_early_access')
        .insert({
          contact_name: formData.contactName,
          contact_email: formData.contactEmail,
          company_name: formData.companyName,
          website_url: formData.websiteUrl,
          active_split_user: formData.activeSplitUser,
          monthly_traffic: formData.monthlyTraffic,
          average_contract_value: formData.averageContractValue,
          ideal_customer_profile: formData.idealCustomerProfile,
          selling_to: formData.sellingTo,
          custom_enrichments: formData.customEnrichments,
          tech_stack: formData.techStack,
          additional_info: formData.additionalInfo
        })

      if (error) {
        throw error
      }

      setShowCalEmbed(true)
    } catch (error) {
      console.error('Error submitting form:', error)
      // You could add error handling here
    } finally {
      setIsSubmitting(false)
    }
  }

  // Cal.com embed step
  if (showCalEmbed) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg mx-auto bg-white border border-gray-200 rounded-lg">
          <VisuallyHidden>
            <DialogTitle>Schedule a Call with Sam</DialogTitle>
          </VisuallyHidden>
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-10 mx-auto mb-4 flex items-center justify-center">
                <Image
                  src="/images/split-icon-black.svg"
                  alt="Split"
                  width={52}
                  height={31}
                  className="object-contain"
                />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Get your first month free
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                15-minute chat with Sam (founder) → free month of Leads
              </p>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-6 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Strategy session</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Free month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Custom setup</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                data-cal-namespace="split"
                data-cal-link="sam-hogan/split"
                data-cal-config='{"layout":"month_view"}'
                type="button"
                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 border border-gray-900 hover:border-gray-800 hover:shadow-lg"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Yes, schedule call
              </Button>
              
              <div className="text-center mt-4">
                <button 
                  onClick={handleClose}
                  type="button"
                  className="text-gray-500 hover:text-gray-700 text-sm transition-colors cursor-pointer underline"
                >
                  No thanks, I'll pay.
                </button>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 text-center mt-4">
              Either way, you're getting priority access to Leads
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Success state
  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-lg relative">
          <VisuallyHidden>
            <DialogTitle>Request Submitted Successfully</DialogTitle>
          </VisuallyHidden>
          
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Amazing!
              </h2>
              <p className="text-gray-600 text-base mb-6 max-w-lg mx-auto">
                We've received your request and have placed you on our priority access list. Thank you for choosing to support Split!
              </p>
            </div>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-2 h-2 bg-gray-900 rounded-full flex-shrink-0"></div>
                <span className="text-gray-800 text-sm font-medium">Priority access when Leads launches</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-2 h-2 bg-gray-900 rounded-full flex-shrink-0"></div>
                <span className="text-gray-800 text-sm font-medium">Exclusive early adopter pricing</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-2 h-2 bg-gray-900 rounded-full flex-shrink-0"></div>
                <span className="text-gray-800 text-sm font-medium">Direct input on feature development</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <p className="text-gray-600 text-sm mb-4">
                If you change your mind, you can schedule a call here:
              </p>
              <Button 
                data-cal-namespace="split"
                data-cal-link="sam-hogan/split"
                data-cal-config='{"layout":"month_view"}'
                className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 border border-gray-900 hover:border-gray-800 hover:shadow-lg"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Schedule a call</span>
                </div>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Preview page
  if (showPreview) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-5xl mx-auto bg-white border border-gray-200 rounded-lg">
          <VisuallyHidden>
            <DialogTitle>Introducing Leads</DialogTitle>
          </VisuallyHidden>
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left side - Image */}
              <div className="order-1 lg:order-1">
                <div className="relative w-full h-80 lg:h-96">
                  <Image
                    src="/images/section2.svg"
                    alt="Leads Feature Preview"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>

              {/* Right side - Content */}
              <div className="order-2">
                <div className="mb-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 font-mono">
                    NEW FEATURE
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                  Introducing <span className="italic font-serif">Leads</span>
                </h2>
                <p className="text-gray-600 leading-relaxed mb-6 text-lg">
                  Turn AI crawler traffic into actionable leads—built for the AI-first web.
                </p>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-2 h-2 bg-gray-900 rounded-full flex-shrink-0"></div>
                    <span className="text-gray-800 text-sm font-medium">Detect visits from ChatGPT, Perplexity and 25+ AI engines</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-2 h-2 bg-gray-900 rounded-full flex-shrink-0"></div>
                    <span className="text-gray-800 text-sm font-medium">Enrich each hit with contact names, titles, social profiles and firmographics</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-2 h-2 bg-gray-900 rounded-full flex-shrink-0"></div>
                    <span className="text-gray-800 text-sm font-medium">Deliver qualified leads straight into your CRM or Slack</span>
                  </div>
                </div>

                <Button 
                  onClick={() => setShowPreview(false)}
                  className="bg-gray-900 hover:bg-gray-800 text-white px-8 py-3 text-sm font-mono font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl uppercase tracking-wider"
                >
                  REQUEST EARLY ACCESS
                </Button>
                <p className="text-xs text-gray-500 mt-3 font-mono">
                  JOIN 500+ COMPANIES ON THE WAITLIST
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-6 border-b border-gray-100">
          <div className="mb-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200 font-mono">
              EARLY ACCESS
            </span>
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900 mb-3">
            Secure your spot for <span className="italic font-serif">Leads</span>
          </DialogTitle>
          <p className="text-gray-600 text-base">
            Help us build the perfect lead attribution platform for your business
          </p>
        </DialogHeader>
        
        <div className="px-6 pb-6">
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8 mt-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                <span className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold font-mono">01</span>
                Tell us about yourself
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactName" className="text-sm font-medium text-gray-900 mb-2 block">Your Name *</Label>
                  <Input
                    id="contactName"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleInputChange}
                    required
                    placeholder="John Doe"
                    className="border-gray-300 focus:border-gray-900 focus:ring-gray-900 bg-white text-gray-900 placeholder-gray-400 h-11 font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail" className="text-sm font-medium text-gray-900 mb-2 block">Work Email *</Label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    required
                    placeholder="john@company.com"
                    className="border-gray-300 focus:border-gray-900 focus:ring-gray-900 bg-white text-gray-900 placeholder-gray-400 h-11 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                <span className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold font-mono">02</span>
                About your company
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName" className="text-sm font-medium text-gray-900 mb-2 block">Company Name *</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    required
                    placeholder="Acme Corp"
                    className="border-gray-300 focus:border-gray-900 focus:ring-gray-900 bg-white text-gray-900 placeholder-gray-400 h-11 font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="websiteUrl" className="text-sm font-medium text-gray-900 mb-2 block">Website URL *</Label>
                  <Input
                    id="websiteUrl"
                    name="websiteUrl"
                    value={formData.websiteUrl}
                    onChange={handleInputChange}
                    required
                    placeholder="https://company.com"
                    className="border-gray-300 focus:border-gray-900 focus:ring-gray-900 bg-white text-gray-900 placeholder-gray-400 h-11 font-mono"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="activeSplitUser" className="text-sm font-medium text-gray-900 mb-2 block">Are you currently using Split? *</Label>
                <select
                  id="activeSplitUser"
                  name="activeSplitUser"
                  value={formData.activeSplitUser}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white text-gray-900 h-11"
                >
                  <option value="" className="text-gray-500">Select your status</option>
                  <option value="yes-active" className="text-gray-900">Yes, active user</option>
                  <option value="yes-inactive" className="text-gray-900">Yes, but inactive</option>
                  <option value="no-interested" className="text-gray-900">No, but interested</option>
                  <option value="no-first-time" className="text-gray-900">No, first time hearing about Split</option>
                </select>
              </div>
            </div>

            {/* Business Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                <span className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold font-mono">03</span>
                Your business details
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="monthlyTraffic" className="text-sm font-medium text-gray-900 mb-2 block">Monthly website traffic *</Label>
                  <Input
                    id="monthlyTraffic"
                    name="monthlyTraffic"
                    value={formData.monthlyTraffic}
                    onChange={handleInputChange}
                    required
                    placeholder="10,000 visits/month"
                    className="border-gray-300 focus:border-gray-900 focus:ring-gray-900 bg-white text-gray-900 placeholder-gray-400 h-11 font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="averageContractValue" className="text-sm font-medium text-gray-900 mb-2 block">Average deal size *</Label>
                  <Input
                    id="averageContractValue"
                    name="averageContractValue"
                    value={formData.averageContractValue}
                    onChange={handleInputChange}
                    required
                    placeholder="$5,000 annual"
                    className="border-gray-300 focus:border-gray-900 focus:ring-gray-900 bg-white text-gray-900 placeholder-gray-400 h-11 font-mono"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="idealCustomerProfile" className="text-sm font-medium text-gray-900 mb-2 block">Who are your ideal customers? *</Label>
                <Textarea
                  id="idealCustomerProfile"
                  name="idealCustomerProfile"
                  value={formData.idealCustomerProfile}
                  onChange={handleInputChange}
                  required
                  placeholder="B2B SaaS companies, 50-500 employees, North America"
                  rows={3}
                  className="border-gray-300 focus:border-gray-900 focus:ring-gray-900 bg-white text-gray-900 placeholder-gray-400 font-mono"
                />
              </div>

              <div>
                <Label htmlFor="sellingTo" className="text-sm font-medium text-gray-900 mb-2 block">What roles do you typically sell to? *</Label>
                <Textarea
                  id="sellingTo"
                  name="sellingTo"
                  value={formData.sellingTo}
                  onChange={handleInputChange}
                  required
                  placeholder="VP of Marketing, Head of Growth, Marketing Directors"
                  rows={3}
                  className="border-gray-300 focus:border-gray-900 focus:ring-gray-900 bg-white text-gray-900 placeholder-gray-400 font-mono"
                />
              </div>
            </div>

            {/* Wishlist */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
                <span className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold font-mono">04</span>
                Your wishlist
              </h3>

              <div>
                <Label htmlFor="customEnrichments" className="text-sm font-medium text-gray-900 mb-2 block">What data would be most valuable to enrich leads with? *</Label>
                <Textarea
                  id="customEnrichments"
                  name="customEnrichments"
                  value={formData.customEnrichments}
                  onChange={handleInputChange}
                  required
                  placeholder="Funding stage, tech stack, intent scores, employee count"
                  rows={3}
                  className="border-gray-300 focus:border-gray-900 focus:ring-gray-900 bg-white text-gray-900 placeholder-gray-400 font-mono"
                />
              </div>

              <div>
                <Label htmlFor="techStack" className="text-sm font-medium text-gray-900 mb-2 block">Current tech stack *</Label>
                <Textarea
                  id="techStack"
                  name="techStack"
                  value={formData.techStack}
                  onChange={handleInputChange}
                  required
                  placeholder="HubSpot, Salesforce, Clearbit, ZoomInfo, Intercom"
                  rows={3}
                  className="border-gray-300 focus:border-gray-900 focus:ring-gray-900 bg-white text-gray-900 placeholder-gray-400 font-mono"
                />
              </div>

              <div>
                <Label htmlFor="additionalInfo" className="text-sm font-medium text-gray-900 mb-2 block">Anything else we should know?</Label>
                <Textarea
                  id="additionalInfo"
                  name="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={handleInputChange}
                  placeholder="Special requirements, integration needs, timeline"
                  rows={3}
                  className="border-gray-300 focus:border-gray-900 focus:ring-gray-900 bg-white text-gray-900 placeholder-gray-400 font-mono"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <Button 
                type="submit" 
                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-4 text-sm font-mono font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl uppercase tracking-wider" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'SECURING SPOT...' : 'SECURE EARLY ACCESS'}
              </Button>

              <p className="text-xs text-gray-500 text-center mt-4 font-mono uppercase tracking-wider">
                PRIORITY ACCESS + LIFETIME BENEFITS
              </p>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
} 