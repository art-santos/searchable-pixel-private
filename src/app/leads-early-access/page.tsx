'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ArrowLeft, CheckCircle, Sparkles, Users, TrendingUp } from 'lucide-react'

export default function LeadsEarlyAccessPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    website: '',
    useCase: '',
    companySize: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // TODO: Implement form submission to database/email service
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIsSubmitted(true)
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">You're on the list!</h2>
            <p className="text-gray-600 mb-6">
              Thanks for your interest in early access to our AI-powered leads feature. We'll be in touch soon with updates.
            </p>
            <Button asChild className="w-full bg-gray-900 hover:bg-gray-800">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left side - Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-amber-600 uppercase tracking-wider">Early Access</span>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Get early access to
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">
                AI-powered leads
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Be among the first to experience our revolutionary lead attribution and enrichment platform. 
              Turn AI search traffic into qualified prospects with unprecedented insight and automation.
            </p>

            {/* Features list */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-3 h-3 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Real-time AI Attribution</h3>
                  <p className="text-sm text-gray-600">Track ChatGPT, Perplexity, Claude visits and convert them to leads</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Users className="w-3 h-3 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Contact Enrichment</h3>
                  <p className="text-sm text-gray-600">Automatic profile building with social, company, and intent data</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Pipeline Intelligence</h3>
                  <p className="text-sm text-gray-600">Intent scoring and behavioral analytics for smarter outreach</p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Limited spots available.</strong> Early access members get lifetime discounts and priority support.
              </p>
            </div>
          </div>

          {/* Right side - Form */}
          <Card>
            <CardHeader>
              <CardTitle>Join the waitlist</CardTitle>
              <CardDescription>
                Fill out the form below and we'll reach out when early access is available
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Work Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="john@company.com"
                  />
                </div>

                <div>
                  <Label htmlFor="company">Company *</Label>
                  <Input
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    required
                    placeholder="Acme Corp"
                  />
                </div>

                <div>
                  <Label htmlFor="website">Company Website</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://acme.com"
                  />
                </div>

                <div>
                  <Label htmlFor="companySize">Company Size</Label>
                  <select
                    id="companySize"
                    name="companySize"
                    value={formData.companySize}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="">Select size</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-1000">201-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="useCase">How do you plan to use AI leads? *</Label>
                  <Textarea
                    id="useCase"
                    name="useCase"
                    value={formData.useCase}
                    onChange={handleInputChange}
                    required
                    placeholder="Tell us about your use case and what you're hoping to achieve..."
                    rows={3}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gray-900 hover:bg-gray-800" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Join Early Access Waitlist'}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  By submitting, you agree to receive updates about our early access program. 
                  We'll never spam you or share your information.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 