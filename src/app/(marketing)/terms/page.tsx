'use client'

import Link from 'next/link'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white">
      {/* Header */}
      <section className="w-full py-16 md:py-24 bg-[#0c0c0c] border-b border-[#1a1a1a]">
        <div className="w-[92%] md:w-[80%] max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Terms of Service
            </h1>
            <p className="text-lg text-gray-300">
              Legal terms and conditions for using Split by 1000X LLC
            </p>
            <div className="text-sm text-gray-500 mt-4">
              Last updated: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="w-full py-16 bg-[#0c0c0c]">
        <div className="w-[92%] md:w-[80%] max-w-4xl mx-auto">
          <div className="prose prose-invert max-w-none">
            
            {/* Introduction */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Agreement to Terms</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  These Terms of Service ("Terms") govern your use of Split, a website visitor tracking and analytics platform operated by 1000X LLC ("Company," "we," "our," or "us"). By accessing or using our Service, you agree to be bound by these Terms.
                </p>
                <p>
                  If you do not agree to these Terms, please do not use our Service.
                </p>
              </div>
            </div>

            {/* Service Description */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Service Description</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>Split provides website visitor tracking and analytics services, including:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Visitor identification and company attribution</li>
                  <li>AI crawler and bot detection</li>
                  <li>Website analytics and reporting dashboards</li>
                  <li>Lead generation and visitor insights</li>
                  <li>API access for data integration</li>
                  <li>Team collaboration features</li>
                </ul>
                <p>
                  We reserve the right to modify, suspend, or discontinue any part of our Service at any time with reasonable notice.
                </p>
              </div>
            </div>

            {/* User Accounts */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">User Accounts</h2>
              
              <h3 className="text-xl font-medium text-white mb-3 mt-6">Account Creation</h3>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>To use our Service, you must:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Be at least 18 years old or have parental consent</li>
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Be responsible for all activity under your account</li>
                </ul>
              </div>

              <h3 className="text-xl font-medium text-white mb-3 mt-6">Account Responsibility</h3>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>You are responsible for:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Keeping your login credentials secure and confidential</li>
                  <li>All activities that occur under your account</li>
                  <li>Notifying us immediately of any unauthorized use</li>
                  <li>Ensuring your account information remains accurate and up-to-date</li>
                </ul>
              </div>
            </div>

            {/* Acceptable Use */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Acceptable Use Policy</h2>
              
              <h3 className="text-xl font-medium text-white mb-3 mt-6">Permitted Uses</h3>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>You may use our Service to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Track visitors to websites you own or have permission to monitor</li>
                  <li>Analyze website traffic and user behavior</li>
                  <li>Generate leads and business intelligence</li>
                  <li>Comply with legitimate business purposes</li>
                </ul>
              </div>

              <h3 className="text-xl font-medium text-white mb-3 mt-6">Prohibited Uses</h3>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>You may not use our Service to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Track websites you do not own without explicit permission</li>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe on the rights of others</li>
                  <li>Engage in spamming, phishing, or other malicious activities</li>
                  <li>Attempt to reverse engineer or hack our systems</li>
                  <li>Share your account access with unauthorized parties</li>
                  <li>Use our Service for harassment, stalking, or privacy violations</li>
                  <li>Overload our systems with excessive requests</li>
                </ul>
              </div>
            </div>

            {/* Data and Privacy */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Data and Privacy</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  You acknowledge that our Service collects and processes data about website visitors. You are responsible for:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Complying with all applicable privacy laws (GDPR, CCPA, etc.)</li>
                  <li>Providing appropriate privacy notices to your website visitors</li>
                  <li>Obtaining necessary consents for data collection</li>
                  <li>Ensuring you have the legal right to collect and process visitor data</li>
                </ul>
                <p>
                  We process data according to our <Link href="/privacy" className="text-white hover:text-gray-300 underline">Privacy Policy</Link>, but you remain responsible for compliance with applicable laws regarding data you collect.
                </p>
              </div>
            </div>

            {/* Payment Terms */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Payment Terms</h2>
              
              <h3 className="text-xl font-medium text-white mb-3 mt-6">Subscription Plans</h3>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>We offer several subscription plans:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Starter Plan:</strong> $30/month with 7-day free trial</li>
                  <li><strong>Pro Plan:</strong> $100/month</li>
                  <li><strong>Pro Plan:</strong> Starting at $100/month (credit-based pricing)</li>
                </ul>
                <p>
                  All fees are non-refundable unless otherwise specified. We reserve the right to change pricing with 30 days' notice.
                </p>
              </div>

              <h3 className="text-xl font-medium text-white mb-3 mt-6">Billing</h3>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Subscriptions are billed monthly or annually in advance</li>
                  <li>Payment is processed through Stripe, our payment processor</li>
                  <li>Failed payments may result in service suspension</li>
                  <li>You're responsible for applicable taxes</li>
                </ul>
              </div>

              <h3 className="text-xl font-medium text-white mb-3 mt-6">Cancellation</h3>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  You may cancel your subscription at any time through your account settings. Cancellation takes effect at the end of your current billing period. No refunds are provided for partial months.
                </p>
              </div>
            </div>

            {/* Intellectual Property */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Intellectual Property</h2>
              
              <h3 className="text-xl font-medium text-white mb-3 mt-6">Our Rights</h3>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  The Split service, including all software, designs, text, graphics, and other content, is owned by 1000X LLC and protected by intellectual property laws. You may not:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Copy, modify, or create derivative works of our Service</li>
                  <li>Reverse engineer any part of our platform</li>
                  <li>Remove any proprietary notices or labels</li>
                  <li>Use our trademarks without permission</li>
                </ul>
              </div>

              <h3 className="text-xl font-medium text-white mb-3 mt-6">Your Data</h3>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  You retain ownership of data you provide to our Service. By using our Service, you grant us a license to process, store, and analyze this data to provide you with our services.
                </p>
              </div>
            </div>

            {/* Service Availability */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Service Availability</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  We strive to maintain high service availability but cannot guarantee 100% uptime. We may perform maintenance that temporarily affects service availability. We are not liable for service interruptions, though we will make reasonable efforts to minimize downtime.
                </p>
                <p>
                  Service level targets and any applicable credits are outlined in your subscription agreement.
                </p>
              </div>
            </div>

            {/* API Terms */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">API Terms</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>If you use our API, you must:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Respect rate limits and usage quotas</li>
                  <li>Use API keys securely and not share them</li>
                  <li>Not abuse or overload our API endpoints</li>
                  <li>Comply with our API documentation and best practices</li>
                </ul>
                <p>
                  API access may be suspended or terminated for violations of these terms or excessive usage.
                </p>
              </div>
            </div>

            {/* Termination */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Termination</h2>
              
              <h3 className="text-xl font-medium text-white mb-3 mt-6">Termination by You</h3>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  You may terminate your account at any time by canceling your subscription and deleting your account through our platform.
                </p>
              </div>

              <h3 className="text-xl font-medium text-white mb-3 mt-6">Termination by Us</h3>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>We may terminate or suspend your account if you:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Violate these Terms of Service</li>
                  <li>Fail to pay required fees</li>
                  <li>Engage in activities that harm our Service or other users</li>
                  <li>Violate applicable laws or regulations</li>
                </ul>
                <p>
                  We will provide reasonable notice before termination unless immediate action is required for security or legal reasons.
                </p>
              </div>

              <h3 className="text-xl font-medium text-white mb-3 mt-6">Effect of Termination</h3>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  Upon termination, your access to the Service will cease, and we may delete your data according to our data retention policies. You remain responsible for any outstanding fees.
                </p>
              </div>
            </div>

            {/* Disclaimers */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Disclaimers</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  OUR SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                </p>
                <p>
                  We do not warrant that our Service will be uninterrupted, error-free, or completely secure. You use our Service at your own risk.
                </p>
              </div>
            </div>

            {/* Limitation of Liability */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Limitation of Liability</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, 1000X LLC WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING FROM YOUR USE OF OUR SERVICE.
                </p>
                <p>
                  OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS RELATED TO OUR SERVICE WILL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.
                </p>
              </div>
            </div>

            {/* Indemnification */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Indemnification</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  You agree to indemnify and hold harmless 1000X LLC from any claims, damages, or expenses arising from:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Your use of our Service</li>
                  <li>Your violation of these Terms</li>
                  <li>Your violation of applicable laws</li>
                  <li>Your infringement of third-party rights</li>
                </ul>
              </div>
            </div>

            {/* Governing Law */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Governing Law</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  These Terms are governed by the laws of [Your State/Country], without regard to conflict of law principles. Any disputes will be resolved in the courts of [Your Jurisdiction].
                </p>
              </div>
            </div>

            {/* Changes to Terms */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Changes to Terms</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  We may update these Terms from time to time. We will notify you of material changes by posting the updated Terms on our website and updating the "Last updated" date.
                </p>
                <p>
                  Your continued use of our Service after changes become effective constitutes acceptance of the new Terms.
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>If you have questions about these Terms, please contact us at <a href="mailto:sam@split.dev" className="text-white hover:text-gray-300 underline">sam@split.dev</a>.</p>
              </div>
            </div>

            {/* Severability */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Severability</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.
                </p>
              </div>
            </div>

            {/* Entire Agreement */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Entire Agreement</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  These Terms, together with our Privacy Policy, constitute the entire agreement between you and 1000X LLC regarding your use of our Service.
                </p>
              </div>
            </div>

            {/* Back to home */}
            <div className="text-center pt-8 border-t border-[#1a1a1a]">
              <Link 
                href="/" 
                className="inline-flex items-center gap-2 text-white hover:text-gray-300 font-medium"
              >
                ← Back to Split
              </Link>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
} 