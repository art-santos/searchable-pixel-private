export const templates = {
  welcome: (name: string, workspaceName?: string) => ({
    subject: "Welcome to Split Analytics",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Split</title>
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap" rel="stylesheet">
      </head>
      <body style="margin: 0; padding: 40px 20px; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, sans-serif; color: #1a1a1a;">
        <div style="max-width: 600px; margin: 0 auto;">
          
          <!-- White Card Container -->
          <div style="background-color: #ffffff; border-radius: 0px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden;">
            
            <!-- Header -->
            <div style="padding: 48px 40px 32px 40px;">
              <div style="margin-bottom: 32px;">
                <img src="${process.env.NEXT_PUBLIC_APP_URL}/images/split-black.png" alt="Split" style="height: 40px; width: auto; display: block;" />
              </div>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #1a1a1a;">
                Hey ${name || 'there'},
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #1a1a1a;">
                ${workspaceName ? `Your Split workspace "${workspaceName}" is set up.` : 'Your Split account is set up.'} You can now see which AI crawlers (like ChatGPT, Perplexity, and Claude) are actually pulling your content—and, more importantly, trace that activity back to the companies and people behind those visits.
              </p>

              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #1a1a1a; font-weight: 600;">
                Here's what happens next:
              </p>

              <div style="margin: 0 0 24px 0;">
                <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #1a1a1a;">
                  <strong>Add our tracking snippet to your site</strong> (it takes less than 2 minutes).
                </p>
                <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #1a1a1a;">
                  <strong>Watch real AI traffic roll in.</strong> See which bots hit which pages—and when.
                </p>
                <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #1a1a1a;">
                  <strong>Uncover attribution.</strong> Connect AI crawler activity to real-world leads, companies, and decision-makers—not just IPs and user agents.
                </p>
              </div>

              <!-- CTA Button -->
              <div style="margin: 32px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                   style="background-color: #1a1a1a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 0px; display: inline-block; font-family: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif; font-weight: 500; font-size: 15px;">
                  Get started
                </a>
              </div>

              <p style="margin: 32px 0 24px 0; font-size: 16px; line-height: 1.6; color: #1a1a1a;">
                Most analytics stop at "a bot visited your site." Split connects the dots between anonymous traffic and actual people, so you know where your content ends up and who is benefiting from your work.
              </p>

              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #1a1a1a;">
                Questions or feedback? Just hit reply. I read every response.
              </p>

              <p style="margin: 0 0 8px 0; font-size: 16px; line-height: 1.6; color: #1a1a1a; font-weight: 600;">
                Welcome to the new era of content attribution.
              </p>

              <!-- Sam's Signature -->
              <div style="margin: 24px 0 0 0;">
                <p style="margin: 0; font-size: 16px; line-height: 1.4; color: #1a1a1a; font-weight: 500;">
                  — Sam Hogan
                </p>
                <p style="margin: 0; font-size: 14px; line-height: 1.4; color: #737373;">
                  Founder, Split
                </p>
              </div>

            </div>

            <!-- Footer -->
            <div style="padding: 24px 40px; border-top: 1px solid #e5e7eb; background-color: #f8f9fa;">
              <p style="margin: 0; font-size: 13px; color: #737373; text-align: center;">
                Questions? Email me at 
                <a href="mailto:sam@split.dev" style="color: #1a1a1a; text-decoration: none;">sam@split.dev</a>
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
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap" rel="stylesheet">
      </head>
      <body style="margin: 0; padding: 40px 20px; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, sans-serif; color: #1a1a1a;">
        <div style="max-width: 600px; margin: 0 auto;">
          
          <!-- White Card Container -->
          <div style="background-color: #ffffff; border-radius: 0px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden;">
            
            <!-- Header -->
            <div style="padding: 48px 40px 32px 40px;">
              <div style="margin-bottom: 32px;">
                <img src="${process.env.NEXT_PUBLIC_APP_URL}/images/split-black.png" alt="Split" style="height: 40px; width: auto; display: block;" />
              </div>
              
              <h2 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 600; color: #1a1a1a; letter-spacing: -0.02em; line-height: 1.2;">
                Verify your email, ${name}
              </h2>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #1a1a1a;">
                Click the button below to verify your email address and complete your Split account setup:
              </p>

              <!-- CTA Button -->
              <div style="margin: 32px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}"
                   style="background-color: #1a1a1a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 0px; display: inline-block; font-family: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif; font-weight: 500; font-size: 15px;">
                  Verify Email
                </a>
              </div>

              <p style="margin: 32px 0 0 0; font-size: 14px; line-height: 1.6; color: #737373;">
                This link expires in 24 hours. If you didn't create a Split account, you can safely ignore this email.
              </p>

            </div>

            <!-- Footer -->
            <div style="padding: 24px 40px; border-top: 1px solid #e5e7eb; background-color: #f8f9fa;">
              <p style="margin: 0; font-size: 13px; color: #737373; text-align: center;">
                Questions? Email me at 
                <a href="mailto:sam@split.dev" style="color: #1a1a1a; text-decoration: none;">sam@split.dev</a>
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
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap" rel="stylesheet">
      </head>
      <body style="margin: 0; padding: 40px 20px; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, sans-serif; color: #1a1a1a;">
        <div style="max-width: 600px; margin: 0 auto;">
          
          <!-- White Card Container -->
          <div style="background-color: #ffffff; border-radius: 0px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden;">
            
            <!-- Header -->
            <div style="padding: 48px 40px 32px 40px;">
              <div style="margin-bottom: 32px;">
                <img src="${process.env.NEXT_PUBLIC_APP_URL}/images/split-black.png" alt="Split" style="height: 40px; width: auto; display: block;" />
              </div>
              
              <h2 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 600; color: #1a1a1a; letter-spacing: -0.02em; line-height: 1.2;">
                Reset your password, ${name}
              </h2>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #1a1a1a;">
                Click the button below to reset your Split password:
              </p>

              <!-- CTA Button -->
              <div style="margin: 32px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}"
                   style="background-color: #1a1a1a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 0px; display: inline-block; font-family: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif; font-weight: 500; font-size: 15px;">
                  Reset Password
                </a>
              </div>

              <p style="margin: 32px 0 0 0; font-size: 14px; line-height: 1.6; color: #737373;">
                This link expires in 1 hour. If you didn't request this password reset, please ignore this email.
              </p>

            </div>

            <!-- Footer -->
            <div style="padding: 24px 40px; border-top: 1px solid #e5e7eb; background-color: #f8f9fa;">
              <p style="margin: 0; font-size: 13px; color: #737373; text-align: center;">
                Questions? Email me at 
                <a href="mailto:sam@split.dev" style="color: #1a1a1a; text-decoration: none;">sam@split.dev</a>
              </p>
            </div>

          </div>
          
        </div>
      </body>
      </html>
    `
  }),
  
  firstCrawler: (name: string, crawlerName: string, page: string) => ({
    subject: "🎉 Your first AI crawler detected!",
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>First crawler detected</title>
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap" rel="stylesheet">
      </head>
      <body style="margin: 0; padding: 40px 20px; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, sans-serif; color: #1a1a1a;">
        <div style="max-width: 600px; margin: 0 auto;">
          
          <!-- White Card Container -->
          <div style="background-color: #ffffff; border-radius: 0px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden;">
            
            <!-- Header -->
            <div style="padding: 48px 40px 32px 40px;">
              <div style="margin-bottom: 32px;">
                <img src="${process.env.NEXT_PUBLIC_APP_URL}/images/split-black.png" alt="Split" style="height: 40px; width: auto; display: block;" />
              </div>
              
              <h2 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 600; color: #1a1a1a; letter-spacing: -0.02em; line-height: 1.2;">
                🎉 Congratulations, ${name}!
              </h2>
              
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: #1a1a1a;">
                <strong>${crawlerName}</strong> just visited your website!
              </p>
              
              <div style="margin: 0 0 24px 0; padding: 16px; background-color: #f8f9fa; border-radius: 0px;">
                <p style="margin: 0; font-size: 14px; color: #737373;">
                  Page visited: <code style="background: #ffffff; padding: 4px 8px; border-radius: 4px; font-family: 'Monaco', 'Menlo', monospace; color: #1a1a1a;">${page}</code>
                </p>
              </div>

              <!-- CTA Button -->
              <div style="margin: 32px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                   style="background-color: #1a1a1a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 0px; display: inline-block; font-family: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif; font-weight: 500; font-size: 15px;">
                  View Analytics
                </a>
              </div>

              <p style="margin: 32px 0 0 0; font-size: 16px; line-height: 1.6; color: #1a1a1a;">
                This is just the beginning. More AI crawlers will discover your content, and you'll be able to track exactly who's using your work.
              </p>

              <!-- Sam's Signature -->
              <div style="margin: 24px 0 0 0;">
                <p style="margin: 0; font-size: 16px; line-height: 1.4; color: #1a1a1a; font-weight: 500;">
                  — Sam Hogan
                </p>
                <p style="margin: 0; font-size: 14px; line-height: 1.4; color: #737373;">
                  Founder, Split
                </p>
              </div>

            </div>

            <!-- Footer -->
            <div style="padding: 24px 40px; border-top: 1px solid #e5e7eb; background-color: #f8f9fa;">
              <p style="margin: 0; font-size: 13px; color: #737373; text-align: center;">
                Questions? Email me at 
                <a href="mailto:sam@split.dev" style="color: #1a1a1a; text-decoration: none;">sam@split.dev</a>
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
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&display=swap" rel="stylesheet">
      </head>
      <body style="margin: 0; padding: 40px 20px; background-color: #f8f9fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Roboto, sans-serif; color: #1a1a1a;">
        <div style="max-width: 600px; margin: 0 auto;">
          
          <!-- White Card Container -->
          <div style="background-color: #ffffff; border-radius: 0px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden;">
            
            <!-- Header -->
            <div style="padding: 48px 40px 32px 40px;">
              <div style="margin-bottom: 32px;">
                <img src="${process.env.NEXT_PUBLIC_APP_URL}/images/split-black.png" alt="Split" style="height: 40px; width: auto; display: block;" />
              </div>
              
              <h2 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 600; color: #1a1a1a; letter-spacing: -0.02em; line-height: 1.2;">
                Weekly Report for ${name}
              </h2>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #1a1a1a; font-weight: 600;">
                This week's highlights:
              </p>

              <!-- Stats Grid -->
              <div style="margin: 0 0 24px 0;">
                <div style="margin-bottom: 16px; padding: 16px; background-color: #f8f9fa; border-radius: 0px;">
                  <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #1a1a1a;">
                    <strong>${stats.totalVisits}</strong> total crawler visits
                  </p>
                </div>
                <div style="margin-bottom: 16px; padding: 16px; background-color: #f8f9fa; border-radius: 0px;">
                  <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #1a1a1a;">
                    <strong>${stats.uniqueCrawlers}</strong> unique AI crawlers
                  </p>
                </div>
                <div style="margin-bottom: 16px; padding: 16px; background-color: #f8f9fa; border-radius: 0px;">
                  <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #1a1a1a;">
                    Top page: <code style="background: #ffffff; padding: 4px 8px; border-radius: 4px; font-family: 'Monaco', 'Menlo', monospace; color: #1a1a1a;">${stats.topPage}</code>
                  </p>
                </div>
                <div style="margin-bottom: 0; padding: 16px; background-color: #f8f9fa; border-radius: 0px;">
                  <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #1a1a1a;">
                    Growth: <strong>${stats.growth > 0 ? '↑' : '↓'} ${Math.abs(stats.growth)}%</strong> from last week
                  </p>
                </div>
              </div>

              <!-- CTA Button -->
              <div style="margin: 32px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                   style="background-color: #1a1a1a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 0px; display: inline-block; font-family: 'Geist', -apple-system, BlinkMacSystemFont, sans-serif; font-weight: 500; font-size: 15px;">
                  View Detailed Analytics
                </a>
              </div>

              <!-- Sam's Signature -->
              <div style="margin: 24px 0 0 0;">
                <p style="margin: 0; font-size: 16px; line-height: 1.4; color: #1a1a1a; font-weight: 500;">
                  — Sam Hogan
                </p>
                <p style="margin: 0; font-size: 14px; line-height: 1.4; color: #737373;">
                  Founder, Split
                </p>
              </div>

            </div>

            <!-- Footer -->
            <div style="padding: 24px 40px; border-top: 1px solid #e5e7eb; background-color: #f8f9fa;">
              <p style="margin: 0; font-size: 13px; color: #737373; text-align: center;">
                Questions? Email me at 
                <a href="mailto:sam@split.dev" style="color: #1a1a1a; text-decoration: none;">sam@split.dev</a>
              </p>
            </div>

          </div>
          
        </div>
      </body>
      </html>
    `
  })
}; 