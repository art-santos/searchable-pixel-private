# Split — User Journey & Product Flow

## Overview
This document outlines the complete user journey from signup to recurring content generation, including technical requirements and MVP specifications.

---

## 🚀 User Journey

### 0. Sign Up
- **Entry Point**: "Get Started" button
- **Authentication Options**: 
  - Google OAuth
  - GitHub OAuth  
  - Email/Password
- **Auto-Setup**: Workspace automatically created upon registration

### 1. Connect Analytics
**Required Integration** (Blocker: Must complete to proceed)

- **Analytics Providers**:
  - Vercel Analytics
  - Google Analytics
  - Plausible
- **Domain Setup**: Add domain(s) to monitor

### 2. Describe Project
**Project Configuration**

- **CMS Selection**:
  - Sanity
  - Contentful
  - Markdown
  - None
- **Content Strategy**:
  - Paste/upload keywords & topics
  - Add competitor domains (optional)
  - Upload documentation to auto-scaffolded `kb/` folder

### 3. AI Visibility Scan
**Comprehensive Site Analysis**

- **Technical Crawl**:
  - `llms.txt` validation
  - Schema markup analysis
  - FAQ structure review
  - `robots.txt` compliance
- **Prompt Testing**: 100-prompt test suite
  - 30 brand-focused prompts
  - 70 topical prompts
- **Output Metrics**:
  - Visibility score
  - Competitor ranking
  - Missing mention opportunities
  - Technical flags
- **Data Storage**: Results saved as `scan_<timestamp>.json`

### 4. Diagnosis Dashboard
**Results & Insights**

- **Score Visualization**: 
  - Current score with trend indicators (+/- Δ)
- **Gap Analysis Table**:
  - Topic
  - Demand level
  - Current presence
  - Recommended fix
- **Competitive Analysis**: Competitor performance lens
- **Content Recommendations**: Prioritized article suggestions

### 5. Content Decision
**Content Planning Interface**

- **Auto-Generate**: Top recommended pick
- **Pick & Mix**: Multi-select from suggestions
- **Reroll**: Generate new suggestions

### 6. Article Generation
**AI-Powered Content Creation**

- **Content Engine**: Agent combines:
  - SEO/AEO tactics
  - Knowledge base content
  - Diagnosis insights
- **Output Format**: Draft created as `.md` or `.mdx`
- **Article Management**: 
  - Status tracking
  - Content overview
  - Target keyword assignment

### 7. Export / Publish
**Multi-Format Distribution**

- **Export Options**:
  - Copy Markdown
  - Download HTML
  - Download JSON
  - Download Plain text
- **Publishing Integrations**:
  - Push to CMS
  - Create Git Pull Request

### 8. Recurring Loop
**Automated Monitoring & Content**

- **Weekly Scans**: Automated visibility monitoring
- **Auto-Queue**: Content automatically queued if empty 24h before cycle
- **Notifications**: 
  - Email summaries
  - Slack integration

---

## 📊 Data Collections

### Database Schema

| Collection | Purpose |
|------------|---------|
| `accounts` | User account management |
| `projects` | Project configurations |
| `analytics_tokens` | Third-party integrations |
| `kb_items` | Knowledge base content |
| `visibility_scans` | Scan results & history |
| `content_queue` | Planned content pipeline |
| `articles` | Generated content & metadata |

---

## ✅ MVP Checklist

### Core Features
- [ ] **Onboarding Guards**: Prevent progression without required setup
- [ ] **CLI Scaffold**: Automated project setup
- [ ] **Fast Scanning**: Visibility scan completes in < 5 minutes
- [ ] **Content Generation**: AI agent with reroll capability
- [ ] **Export Coverage**: All specified export formats
- [ ] **Scheduling**: Automated recurring scans with auto-queue
- [ ] **Plan Limits**: Usage restrictions (e.g., 2 articles/week on Free plan)

### Technical Requirements
- [ ] Analytics integration validation
- [ ] SDK connection verification
- [ ] Real-time scan progress
- [ ] Content preview functionality
- [ ] Multi-format export system

---

## 🚧 Post-MVP Features

### Enhanced Editing
- **Inline Editor**: Built-in content editor with AI revision suggestions
- **Custom Templates**: User-defined prompt templates
- **Multi-Language**: hreflang support for international content

### Advanced Features
- **Citation Previews**: Clean URL display with favicon integration
- **Advanced Analytics**: Deeper performance insights
- **Team Collaboration**: Multi-user workspace management
- **API Access**: Programmatic content generation

---

## 🎯 Success Metrics

### User Engagement
- Time to first scan completion
- Content generation frequency
- Export/publish rate

### Technical Performance
- Scan completion time (target: < 5 minutes)
- Content quality scores
- User retention rates

### Business Metrics
- Conversion from free to paid plans
- Feature adoption rates
- Customer satisfaction scores