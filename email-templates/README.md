# Email Templates for Split

This directory contains custom email templates for Supabase authentication flows.

## Password Reset Email Template

The `reset-password.html` file contains an elegant, minimalistic password reset email template that matches Split's dark theme and branding.

### Features

- **Dark Theme**: Uses Split's signature dark color scheme (#0c0c0c background, white text)
- **Minimalistic Design**: Clean, professional layout with subtle borders and spacing
- **Mobile Responsive**: Optimized for both desktop and mobile email clients
- **Security Focused**: Clear security information and expiry warnings
- **Accessible**: High contrast colors and readable typography
- **Brand Consistent**: Uses Split logo and maintains visual consistency

### Supabase Configuration

To use this template in your Supabase project:

1. **Access Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to Authentication > Email Templates

2. **Configure Password Reset Template**
   - Select "Reset Password" from the template dropdown
   - Copy the contents of `reset-password.html`
   - Paste it into the HTML template field

3. **Template Variables**
   The template uses these Supabase variables:
   - `{{ .ConfirmationURL }}` - The password reset link
   - `{{ .Email }}` - The user's email address
   - `{{ .SiteURL }}` - Your site's base URL (for logo and links)

4. **Logo Configuration**
   - The template references `{{ .SiteURL }}/images/split-icon-white.svg`
   - Ensure your logo is accessible at this public URL
   - Alternative: Replace with a direct URL to your logo

### Customization

#### Colors Used
- Background: `#0c0c0c` (Split's dark background)
- Text: `#ffffff` (white)
- Secondary text: `#a1a1aa` (light gray)
- Borders: `#333333` (dark gray)
- Button: `#ffffff` background with `#0c0c0c` text
- Error/Warning: `#ef4444` (red)

#### Typography
- Font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`
- Heading: 24px, weight 600
- Body: 16px
- Small text: 14px

### Testing

Before deploying:

1. **Preview in Supabase**: Use the preview function in the email templates section
2. **Test Email Delivery**: Trigger a password reset to see the actual email
3. **Check Mobile**: Test on various email clients and devices
4. **Verify Links**: Ensure all URLs and the reset link work correctly

### Email Client Compatibility

This template is designed to work across major email clients:
- Gmail (Web, iOS, Android)
- Outlook (Web, Desktop, Mobile)
- Apple Mail (macOS, iOS)
- Yahoo Mail
- Thunderbird

### Security Considerations

The template includes:
- Clear expiry information (24 hours)
- One-time use notification
- Security tips for users
- Contact information for support

### Support

If you need to modify the template or have issues:
- Check Supabase documentation for email template variables
- Test changes in a development environment first
- Ensure all public URLs are accessible
- Verify SMTP settings in Supabase are configured correctly 