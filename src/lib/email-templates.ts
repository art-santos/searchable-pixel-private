export const templates = {
  welcome: (name: string, workspaceName?: string, domain?: string) => ({
    subject: "Welcome to Split Analytics",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Split</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6;">
        <div style="max-width: 680px; margin: 0 auto; padding: 40px 20px;">
          
          <!-- Main Container -->
          <div style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02), 0 8px 24px rgba(0, 0, 0, 0.04); overflow: hidden; border: 1px solid #e5e7eb;">
            
            <!-- Header Section -->
            <div style="padding: 48px 48px 32px 48px; background-color: #ffffff; border-bottom: 1px solid #e5e7eb;">
              <div style="margin-bottom: 32px;">
                <img src="${process.env.NEXT_PUBLIC_APP_URL}/images/split-black.png" alt="Split" style="height: 32px; width: auto; display: block;" />
              </div>
              
              <h1 style="margin: 0 0 16px 0; font-size: 32px; font-weight: 700; color: #111827; letter-spacing: -0.025em; line-height: 1.2;">
                Welcome to Split, ${name}
              </h1>
              
              <p style="margin: 0; font-size: 18px; line-height: 1.6; color: #4b5563; font-weight: 400;">
                ${workspaceName ? `Your workspace "${workspaceName}" is ready.` : 'Your account is ready.'} Track AI systems accessing your content and gain unprecedented attribution insights.
              </p>
            </div>

            <!-- Content Section -->
            <div style="padding: 48px;">
              
              ${workspaceName && domain ? `
              <!-- Workspace Details -->
              <div style="margin-bottom: 40px; padding: 24px; background-color: #f8f9fa; border-radius: 12px; border: 1px solid #e5e7eb;">
                <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #111827; letter-spacing: -0.01em;">
                  Your workspace details
                </h2>
                
                <div style="margin-bottom: 12px;">
                  <p style="margin: 0; font-size: 14px; color: #6b7280;">Workspace name</p>
                  <p style="margin: 0; font-size: 15px; font-weight: 500; color: #111827;">${workspaceName}</p>
                </div>
                
                <div>
                  <p style="margin: 0; font-size: 14px; color: #6b7280;">Domain</p>
                  <p style="margin: 0; font-size: 15px; font-weight: 500; color: #111827; font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;">${domain}</p>
                </div>
              </div>
              ` : ''}
              
              <!-- Value Proposition -->
              <div style="margin-bottom: 40px; padding: 24px; background-color: #f8f9fa; border-radius: 12px; border: 1px solid #e5e7eb;">
                <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #111827; letter-spacing: -0.01em;">
                  What happens next
                </h2>
                
                <div>
                  <p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 500; color: #111827; line-height: 1.5;">
                    — Add tracking to your site<br/>
                    <span style="font-size: 14px; color: #6b7280; font-weight: 400; margin-left: 16px;">Install our lightweight script in under 2 minutes</span>
                  </p>
                  
                  <p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 500; color: #111827; line-height: 1.5;">
                    — Monitor AI activity<br/>
                    <span style="font-size: 14px; color: #6b7280; font-weight: 400; margin-left: 16px;">See which AI systems access your content in real-time</span>
                  </p>
                  
                  <p style="margin: 0; font-size: 15px; font-weight: 500; color: #111827; line-height: 1.5;">
                    — Discover attribution patterns<br/>
                    <span style="font-size: 14px; color: #6b7280; font-weight: 400; margin-left: 16px;">Connect anonymous traffic to real companies and decision-makers</span>
                  </p>
                </div>
              </div>

              <!-- CTA Section -->
              <div style="text-align: center; margin-bottom: 40px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                   style="display: inline-flex; align-items: center; justify-content: center; background-color: #111827; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-family: 'Inter', sans-serif; font-weight: 500; font-size: 15px; letter-spacing: -0.01em; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                  Get started →
                </a>
              </div>

              <!-- Quote Section -->
              <div style="padding: 32px; background-color: #f8f9fa; border-radius: 12px; margin-bottom: 32px; border: 1px solid #e5e7eb;">
                <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #374151; font-style: italic;">
                  "It's great to know that someone found your content through ChatGPT, Perplexity, etc. But it's better to be able to track the traffic back to the organizations and people behind it—so you can act on that data and turn AI visibility into opportunities. That's Split."
                </p>
              </div>

              <!-- Welcome Message -->
              <div style="text-align: center;">
                <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #111827; letter-spacing: -0.01em;">
                  Welcome to the new era of content attribution
                </h3>
                <p style="margin: 0; font-size: 14px; color: #6b7280;">
                  Questions? Just reply to this email—I read every response.
                </p>
              </div>

            </div>

            <!-- Footer -->
            <div style="padding: 24px 48px; background-color: #f8f9fa; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 13px; color: #6b7280; text-align: center;">
                Questions? Email me at 
                <a href="mailto:sam@split.dev" style="color: #111827; text-decoration: none; font-weight: 500;">sam@split.dev</a>
              </p>
            </div>

          </div>
          
        </div>
      </body>
      </html>
    `
  }),
  
  emailVerification: (name: string, token: string) => ({
    subject: "Verify your Split email address",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify your email</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          
          <!-- Main Container -->
          <div style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02), 0 8px 24px rgba(0, 0, 0, 0.04); overflow: hidden; border: 1px solid #e5e7eb;">
            
            <!-- Header -->
            <div style="padding: 48px 48px 32px 48px; text-align: center; background-color: #ffffff; border-bottom: 1px solid #e5e7eb;">
              <div style="margin-bottom: 32px;">
                <img src="${process.env.NEXT_PUBLIC_APP_URL}/images/split-black.png" alt="Split" style="height: 32px; width: auto; display: block; margin: 0 auto;" />
              </div>
              
              <!-- Icon -->
              <div style="width: 64px; height: 64px; border-radius: 50%; background-color: #f8f9fa; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px auto; border: 1px solid #e5e7eb;">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              
              <h1 style="margin: 0 0 16px 0; font-size: 28px; font-weight: 700; color: #111827; letter-spacing: -0.025em; line-height: 1.2;">
                Verify your email, ${name}
              </h1>
              
              <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #4b5563; max-width: 400px; margin-left: auto; margin-right: auto;">
                Click the button below to verify your email address and complete your Split account setup.
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 48px; text-align: center;">
              
              <!-- CTA Button -->
              <div style="margin-bottom: 32px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}"
                   style="display: inline-flex; align-items: center; justify-content: center; background-color: #111827; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-family: 'Inter', sans-serif; font-weight: 500; font-size: 15px; letter-spacing: -0.01em; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                  Verify Email Address
                </a>
              </div>

              <!-- Security Note -->
              <div style="padding: 20px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e5e7eb;">
                <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.5;">
                  This link expires in 24 hours. If you didn't create a Split account, you can safely ignore this email.
                </p>
              </div>

            </div>

            <!-- Footer -->
            <div style="padding: 24px 48px; background-color: #f8f9fa; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 13px; color: #6b7280; text-align: center;">
                Questions? Email me at 
                <a href="mailto:sam@split.dev" style="color: #111827; text-decoration: none; font-weight: 500;">sam@split.dev</a>
              </p>
            </div>

          </div>
          
        </div>
      </body>
      </html>
    `
  }),
  
  passwordReset: (name: string, token: string) => ({
    subject: "Reset your Split password",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset your password</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          
          <!-- Main Container -->
          <div style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02), 0 8px 24px rgba(0, 0, 0, 0.04); overflow: hidden; border: 1px solid #e5e7eb;">
            
            <!-- Header -->
            <div style="padding: 48px 48px 32px 48px; text-align: center; background-color: #ffffff; border-bottom: 1px solid #e5e7eb;">
              <div style="margin-bottom: 32px;">
                <img src="${process.env.NEXT_PUBLIC_APP_URL}/images/split-black.png" alt="Split" style="height: 32px; width: auto; display: block; margin: 0 auto;" />
              </div>
              
              <!-- Icon -->
              <div style="width: 64px; height: 64px; border-radius: 50%; background-color: #f8f9fa; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px auto; border: 1px solid #e5e7eb;">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <circle cx="12" cy="16" r="1"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              
              <h1 style="margin: 0 0 16px 0; font-size: 28px; font-weight: 700; color: #111827; letter-spacing: -0.025em; line-height: 1.2;">
                Reset your password, ${name}
              </h1>
              
              <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #4b5563; max-width: 400px; margin-left: auto; margin-right: auto;">
                Click the button below to reset your Split password and regain access to your account.
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 48px; text-align: center;">
              
              <!-- CTA Button -->
              <div style="margin-bottom: 32px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}"
                   style="display: inline-flex; align-items: center; justify-content: center; background-color: #111827; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-family: 'Inter', sans-serif; font-weight: 500; font-size: 15px; letter-spacing: -0.01em; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                  Reset Password
                </a>
              </div>

              <!-- Security Note -->
              <div style="padding: 20px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e5e7eb;">
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #111827; font-weight: 500;">Security Notice</p>
                <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.5;">
                  This link expires in 1 hour. If you didn't request this password reset, please ignore this email and your password will remain unchanged.
                </p>
              </div>

            </div>

            <!-- Footer -->
            <div style="padding: 24px 48px; background-color: #f8f9fa; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 13px; color: #6b7280; text-align: center;">
                Questions? Email me at 
                <a href="mailto:sam@split.dev" style="color: #111827; text-decoration: none; font-weight: 500;">sam@split.dev</a>
              </p>
            </div>

          </div>
          
        </div>
      </body>
      </html>
    `
  }),
  
  firstCrawler: (name: string, crawlerName: string, page: string) => ({
    subject: "First AI crawler detected",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>First crawler detected</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          
          <!-- Main Container -->
          <div style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02), 0 8px 24px rgba(0, 0, 0, 0.04); overflow: hidden; border: 1px solid #e5e7eb;">
            
            <!-- Header -->
            <div style="padding: 48px 48px 32px 48px; background-color: #f8f9fa; border-bottom: 1px solid #e5e7eb;">
              <div style="margin-bottom: 32px;">
                <img src="${process.env.NEXT_PUBLIC_APP_URL}/images/split-black.png" alt="Split" style="height: 32px; width: auto; display: block;" />
              </div>
              
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #111827; letter-spacing: -0.025em; line-height: 1.2;">
                First crawler detected
              </h1>
              
              <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #4b5563;">
                ${name}, <strong style="color: #111827;">${crawlerName}</strong> just visited your website.
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 48px;">
              
              <!-- Visit Details - Main Focus -->
              <div style="margin-bottom: 40px; padding: 32px; background-color: #f8f9fa; border-radius: 12px; border: 1px solid #e5e7eb; text-align: center;">
                <h2 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #111827; letter-spacing: -0.01em;">
                  Visit Details
                </h2>
                
                <div style="margin-bottom: 16px;">
                  <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Crawler</p>
                  <p style="margin: 0; font-size: 20px; font-weight: 600; color: #111827;">${crawlerName}</p>
                </div>
                
                <div>
                  <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Page Visited</p>
                  <p style="margin: 0; font-size: 16px; font-weight: 500; color: #111827; font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace; background-color: #ffffff; padding: 12px 16px; border-radius: 6px; border: 1px solid #e5e7eb;">${page}</p>
                </div>
              </div>

              <!-- CTA Section -->
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                   style="display: inline-flex; align-items: center; justify-content: center; background-color: #111827; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-family: 'Inter', sans-serif; font-weight: 500; font-size: 15px; letter-spacing: -0.01em; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                  View Dashboard →
                </a>
              </div>

            </div>

            <!-- Footer -->
            <div style="padding: 24px 48px; background-color: #f8f9fa; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 13px; color: #6b7280; text-align: center;">
                Questions? Email me at 
                <a href="mailto:sam@split.dev" style="color: #111827; text-decoration: none; font-weight: 500;">sam@split.dev</a>
              </p>
            </div>

          </div>
          
        </div>
      </body>
      </html>
    `
  }),
  
  weeklyReport: (name: string, stats: { totalVisits: number; uniqueCrawlers: number; topPage: string; growth: number }) => ({
    subject: "Your weekly AI crawler report",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Weekly report</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6;">
        <div style="max-width: 680px; margin: 0 auto; padding: 40px 20px;">
          
          <!-- Main Container -->
          <div style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02), 0 8px 24px rgba(0, 0, 0, 0.04); overflow: hidden; border: 1px solid #e5e7eb;">
            
            <!-- Header -->
            <div style="padding: 48px 48px 32px 48px; background-color: #f8f9fa; border-bottom: 1px solid #e5e7eb;">
              <div style="margin-bottom: 32px;">
                <img src="${process.env.NEXT_PUBLIC_APP_URL}/images/split-black.png" alt="Split" style="height: 32px; width: auto; display: block;" />
              </div>
              
              <h1 style="margin: 0 0 16px 0; font-size: 32px; font-weight: 700; color: #111827; letter-spacing: -0.025em; line-height: 1.2;">
                Weekly Report for ${name}
              </h1>
              
              <p style="margin: 0; font-size: 18px; line-height: 1.6; color: #4b5563;">
                Here's how AI systems interacted with your content this week.
              </p>
            </div>

            <!-- Content -->
            <div style="padding: 48px;">
              
              <!-- Stats Grid -->
              <div style="margin-bottom: 40px;">
                <h2 style="margin: 0 0 24px 0; font-size: 18px; font-weight: 600; color: #111827; letter-spacing: -0.01em;">
                  This week's highlights
                </h2>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                  <!-- Total Visits -->
                  <div style="padding: 24px; background-color: #f8f9fa; border-radius: 12px; border: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Total Visits</p>
                    <p style="margin: 0; font-size: 32px; font-weight: 700; color: #111827; letter-spacing: -0.02em;">${stats.totalVisits}</p>
                  </div>
                  
                  <!-- Unique Crawlers -->
                  <div style="padding: 24px; background-color: #f8f9fa; border-radius: 12px; border: 1px solid #e5e7eb;">
                    <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Unique Crawlers</p>
                    <p style="margin: 0; font-size: 32px; font-weight: 700; color: #111827; letter-spacing: -0.02em;">${stats.uniqueCrawlers}</p>
                  </div>
                </div>
                
                <!-- Top Page -->
                <div style="padding: 24px; background-color: #f8f9fa; border-radius: 12px; border: 1px solid #e5e7eb; margin-bottom: 16px;">
                  <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Most Visited Page</p>
                  <p style="margin: 0; font-size: 16px; font-weight: 500; color: #111827; font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace; background-color: #ffffff; padding: 12px 16px; border-radius: 6px; border: 1px solid #e5e7eb;">${stats.topPage}</p>
                </div>
                
                <!-- Growth -->
                <div style="padding: 24px; background-color: #f8f9fa; border-radius: 12px; border: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 500; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em;">Week-over-Week Growth</p>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 24px; font-weight: 700; color: ${stats.growth >= 0 ? '#22c55e' : '#ef4444'};">
                      ${stats.growth > 0 ? '↗' : stats.growth < 0 ? '↘' : '→'} ${Math.abs(stats.growth)}%
                    </span>
                    <span style="font-size: 14px; color: #6b7280;">from last week</span>
                  </div>
                </div>
              </div>

              <!-- CTA Section -->
              <div style="text-align: center; margin-bottom: 32px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                   style="display: inline-flex; align-items: center; justify-content: center; background-color: #111827; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-family: 'Inter', sans-serif; font-weight: 500; font-size: 15px; letter-spacing: -0.01em; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                  View Detailed Analytics →
                </a>
              </div>

              <!-- Sam's Note -->
              <div style="padding: 24px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e5e7eb;">
                <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #111827;">Sam Hogan, Founder</p>
                <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.5;">
                  Hope you're finding these insights valuable! Questions about your data or suggestions for the platform? Just reply to this email.
                </p>
              </div>

            </div>

            <!-- Footer -->
            <div style="padding: 24px 48px; background-color: #f8f9fa; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 13px; color: #6b7280; text-align: center;">
                Questions? Email me at 
                <a href="mailto:sam@split.dev" style="color: #111827; text-decoration: none; font-weight: 500;">sam@split.dev</a>
              </p>
            </div>

          </div>
          
        </div>
      </body>
      </html>
    `
  })
}; 