'use client'

import Link from 'next/link'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0c0c0c] text-white">
      {/* JSON-LD Schema for Privacy Policy */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebPage",
                "@id": "https://split.dev/privacy#webpage",
                "url": "https://split.dev/privacy",
                "name": "Privacy Policy | Split Data Protection",
                "description": "Learn how Split collects, uses, and protects your data. Our privacy policy explains data handling for AI crawler tracking and lead attribution.",
                "isPartOf": {
                  "@type": "WebSite",
                  "url": "https://split.dev",
                  "name": "Split"
                },
                "dateModified": new Date().toISOString().split('T')[0],
                "about": {
                  "@type": "DigitalDocument",
                  "name": "Privacy Policy",
                  "description": "Legal document outlining data collection and protection practices"
                }
              },
              {
                "@type": "DigitalDocument",
                "@id": "https://split.dev/privacy#privacy-policy",
                "name": "Split Privacy Policy",
                "description": "Comprehensive privacy policy for Split's AI tracking and lead attribution platform",
                "dateModified": new Date().toISOString().split('T')[0],
                "publisher": {
                  "@type": "Organization",
                  "name": "1000X LLC",
                  "legalName": "1000X LLC"
                },
                "about": [
                  "Data Collection",
                  "Privacy Rights",
                  "Data Protection",
                  "User Information"
                ]
              },
              {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  {
                    "@type": "ListItem",
                    "position": 1,
                    "name": "Home",
                    "item": "https://split.dev"
                  },
                  {
                    "@type": "ListItem",
                    "position": 2,
                    "name": "Privacy Policy",
                    "item": "https://split.dev/privacy"
                  }
                ]
              }
            ]
          })
        }}
      />
      
      {/* Header */}
      <section className="w-full py-16 md:py-24 bg-[#0c0c0c] border-b border-[#1a1a1a]">
        <div className="w-[92%] md:w-[80%] max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-lg text-gray-300">
              How 1000X LLC collects, uses, and protects your data
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
              <h2 className="text-2xl font-semibold text-white mb-4">Introduction</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  This Privacy Policy describes how 1000X LLC ("we," "our," or "us") collects, uses, and shares information when you use Split, our website visitor tracking and analytics platform ("Service"). We are committed to protecting your privacy and being transparent about our data practices.
                </p>
                <p>
                  By using our Service, you agree to the collection and use of information in accordance with this Privacy Policy.
                </p>
              </div>
            </div>

            {/* Information We Collect */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-white mb-3 mt-6">Account Information</h3>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>When you create an account, we collect:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Email address and password</li>
                  <li>Full name and company information</li>
                  <li>Billing information (processed securely through Stripe)</li>
                  <li>Profile information you choose to provide</li>
                </ul>
              </div>

              <h3 className="text-xl font-medium text-white mb-3 mt-6">Website Visitor Data</h3>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>Through our tracking service, we collect data about visitors to your websites:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>IP addresses and approximate geographic location</li>
                  <li>Browser type, device information, and operating system</li>
                  <li>Pages visited, time spent, and navigation patterns</li>
                  <li>Referrer information and traffic sources</li>
                  <li>Company identification data (when available)</li>
                  <li>AI crawler and bot activity data</li>
                </ul>
              </div>

              <h3 className="text-xl font-medium text-white mb-3 mt-6">Usage Data</h3>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>We automatically collect information about how you use our Service:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Feature usage and interaction patterns</li>
                  <li>API calls and integration data</li>
                  <li>Error logs and performance metrics</li>
                  <li>Dashboard views and report generation</li>
                </ul>
              </div>
            </div>

            {/* How We Use Information */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">How We Use Information</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>We use the collected information to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide and improve our tracking and analytics services</li>
                  <li>Process payments and manage subscriptions</li>
                  <li>Send important service updates and notifications</li>
                  <li>Provide customer support and respond to inquiries</li>
                  <li>Analyze service usage to improve features and performance</li>
                  <li>Detect and prevent fraud, abuse, and security incidents</li>
                  <li>Comply with legal obligations and enforce our terms</li>
                </ul>
              </div>
            </div>

            {/* Information Sharing */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Information Sharing</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>We do not sell your personal information. We may share information in the following circumstances:</p>
                
                <h3 className="text-xl font-medium text-white mb-3 mt-6">Service Providers</h3>
                <p>We work with trusted third-party service providers who help us operate our Service:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Supabase:</strong> Database hosting and authentication</li>
                  <li><strong>Stripe:</strong> Payment processing and billing management</li>
                  <li><strong>Vercel:</strong> Application hosting and content delivery</li>
                  <li><strong>Email service providers:</strong> Transactional emails and notifications</li>
                </ul>

                <h3 className="text-xl font-medium text-white mb-3 mt-6">Legal Requirements</h3>
                <p>We may disclose information if required by law or in response to valid legal requests, such as:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Subpoenas, court orders, or legal process</li>
                  <li>To protect our rights, property, or safety</li>
                  <li>To investigate fraud or security incidents</li>
                  <li>To comply with applicable laws and regulations</li>
                </ul>

                <h3 className="text-xl font-medium text-white mb-3 mt-6">Business Transfers</h3>
                <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the transaction.</p>
              </div>
            </div>

            {/* Data Security */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Data Security</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>We implement industry-standard security measures to protect your information:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Encryption in transit and at rest</li>
                  <li>Regular security audits and vulnerability assessments</li>
                  <li>Access controls and authentication requirements</li>
                  <li>Secure data centers with physical security measures</li>
                  <li>Regular backups and disaster recovery procedures</li>
                </ul>
                <p>
                  However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
                </p>
              </div>
            </div>

            {/* Data Retention */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Data Retention</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>We retain information for as long as necessary to provide our services and comply with legal obligations:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Account data:</strong> Until account deletion, then 30 days</li>
                  <li><strong>Visitor tracking data:</strong> According to your subscription plan (90 days to unlimited)</li>
                  <li><strong>Billing information:</strong> 7 years for tax and accounting purposes</li>
                  <li><strong>Usage logs:</strong> 12 months for security and debugging</li>
                </ul>
                <p>You can request deletion of your data at any time by contacting us.</p>
              </div>
            </div>

            {/* Your Rights */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Your Rights</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>Depending on your location, you may have the following rights regarding your personal information:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Access:</strong> Request a copy of your personal information</li>
                  <li><strong>Rectification:</strong> Correct inaccurate or incomplete information</li>
                  <li><strong>Erasure:</strong> Request deletion of your personal information</li>
                  <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
                  <li><strong>Restriction:</strong> Limit how we process your information</li>
                  <li><strong>Objection:</strong> Object to certain types of processing</li>
                </ul>
                <p>To exercise these rights, please contact us at <a href="mailto:sam@split.dev" className="text-white hover:text-gray-300 underline">sam@split.dev</a>.</p>
              </div>
            </div>

            {/* Cookies and Tracking */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Cookies and Tracking</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>We use cookies and similar technologies to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Keep you logged in to your account</li>
                  <li>Remember your preferences and settings</li>
                  <li>Analyze how our Service is used</li>
                  <li>Provide security features and fraud prevention</li>
                </ul>
                <p>
                  You can control cookie settings through your browser preferences. However, disabling certain cookies may affect the functionality of our Service.
                </p>
              </div>
            </div>

            {/* International Transfers */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">International Data Transfers</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  Our services are hosted in the United States. If you are accessing our Service from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States where our servers are located and our central database is operated.
                </p>
                <p>
                  We ensure appropriate safeguards are in place for international data transfers in compliance with applicable data protection laws.
                </p>
              </div>
            </div>

            {/* Children's Privacy */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Children's Privacy</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  Our Service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal information from a child under 13, we will take steps to delete such information.
                </p>
              </div>
            </div>

            {/* Changes to Privacy Policy */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Changes to This Privacy Policy</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
                </p>
                <p>
                  For significant changes, we may also send you an email notification. We encourage you to review this Privacy Policy periodically to stay informed about how we are protecting your information.
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-white mb-4">Contact Us</h2>
              <div className="text-gray-300 leading-relaxed space-y-4">
                <p>If you have any questions about this Privacy Policy or our data practices, please contact us at <a href="mailto:sam@split.dev" className="text-white hover:text-gray-300 underline">sam@split.dev</a>.</p>
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