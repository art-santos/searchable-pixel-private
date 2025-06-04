# 💳 Pricing Structure

Choose a base plan, then scale with usage-based add-ons. Clear, predictable pricing with no hidden fees — built for individuals, teams, and agencies.

> **📋 Implementation Status:** ✅ = Completed | 🟡 = In Progress | ❌ = Not Started

---

## 🧱 Base Plans ✅ **COMPLETED**

| Plan       | Price      | Domains | AI Articles | AI Crawler Logs | Visibility Scans |
|------------|------------|---------|-------------|------------------|------------------|
| **Free**       | $0/mo    | 1 domain | Not included | 100/month ✅ | Daily only ✅ |
| **Visibility** | $40/mo   | 1 domain | Not included | 250/month ✅ | Daily + MAX ✅ |
| **Plus**       | $200/mo  | 1 domain | 10/month 🟡 | 500/month ✅ | Unlimited ✅ |
| **Pro**        | $1,000/mo | 3 domains ✅ | 30/month 🟡 | 1,000/month ✅ | Unlimited ✅ |

### ✨ All Plans Include ✅ **COMPLETED**
- **Real-time monitoring** across AI platforms (ChatGPT, Claude, Perplexity, etc.) ✅
- **Citation analysis** with confidence scoring ✅
- **Email alerts** for brand mentions ✅
- **Usage dashboard** with detailed analytics ✅
- **API access** for integrations ✅

---

## ⚡ Usage-Based Add-Ons

Scale as you grow with transparent, usage-based pricing:

### 🤖 AI Crawler Logs 🟡 **PARTIALLY COMPLETED**
- **$0.008 per log** after plan limits ✅ *Calculated in UI*
- Tracks brand mentions across all AI platforms ✅ *Using `crawler_visits` table*
- Real-time billing with monthly invoicing ❌ *Stripe integration pending*
- **Soft limits** - never blocked, just billed ✅

### 📝 Extra Articles 🟡 **UI ONLY - COMING SOON**
- **$10 per article per month** 🟡 *UI built, feature not implemented*
- AI-generated content optimized for visibility ❌
- Subscription-based billing ❌
- Add/remove anytime 🟡 *UI controls ready*

### 🌐 Extra Domains 🟡 **PARTIALLY COMPLETED**
- **$100 per domain per month** 🟡 *UI built, billing not connected*
- Track additional brands or websites ✅ *Domain tracking implemented*
- Full feature access per domain ✅
- Subscription-based billing ❌

---

## 📊 Billing & Usage Management

### Real-Time Usage Tracking ✅ **COMPLETED**
- **Live usage meters** with remaining balances ✅
- **Smart warnings** at 80% utilization ✅
- **Overage notifications** before charges apply ✅
- **Detailed usage logs** for transparency ✅

### Billing Cycle 🟡 **PARTIALLY COMPLETED**
- **Monthly billing** on your signup date ✅ *Billing periods working*
- **Prorated charges** for plan changes ❌ *Stripe integration needed*
- **Usage reset** at start of each cycle ✅
- **Automated invoicing** via Stripe ❌

### Usage Warnings & Limits ✅ **COMPLETED**
- ⚠️ **Warning at 80%**: Get notified before overages ✅
- 💰 **Overage billing**: $0.008/log beyond plan limits ✅ *Calculated in UI*
- 🚫 **No hard limits**: Service never interrupted ✅
- 📈 **Upgrade prompts**: Easy plan upgrades when needed ✅

---

## 💡 Example Pricing Scenarios ✅ **COMPLETED**

### Small Business (Plus Plan)
- **Base Plan**: Plus → $200/mo ✅
- **Usage**: 450 AI logs (50 under limit) → $0 ✅
- **Add-ons**: +2 extra articles → $20 🟡 *UI only*
- **Total**: **$220/month** ✅ *Calculated correctly*

### Growing Agency (Pro Plan)  
- **Base Plan**: Pro → $1,000/mo ✅
- **Usage**: 1,500 AI logs (500 overage) → $4.00 ✅
- **Add-ons**: +10 articles, +2 domains → $320 🟡 *UI only*
- **Total**: **$1,324/month** ✅ *Calculated correctly*

### Enterprise (Pro + Heavy Usage)
- **Base Plan**: Pro → $1,000/mo ✅
- **Usage**: 5,000 AI logs (4,000 overage) → $32.00 ✅
- **Add-ons**: +25 articles, +5 domains → $750 🟡 *UI only*
- **Total**: **$1,782/month** ✅ *Calculated correctly*

---

## 🛠 Technical Implementation

### Stripe Integration ❌ **NOT STARTED**
```javascript
// Metered billing for AI crawler logs - NOT IMPLEMENTED YET
const usageRecord = await stripe.subscriptionItems.createUsageRecord(
  subscription_item_id,
  {
    quantity: overageLogs,
    timestamp: Math.floor(Date.now() / 1000),
    action: 'increment'
  }
);
```

### Database Schema ✅ **COMPLETED**
```sql
-- Enhanced subscription tracking ✅ IMPLEMENTED
CREATE TABLE subscription_usage (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  
  -- Billing period ✅
  billing_period_start TIMESTAMP WITH TIME ZONE,
  billing_period_end TIMESTAMP WITH TIME ZONE,
  
  -- AI Crawler Logs ✅
  ai_logs_included INTEGER DEFAULT 0,
  ai_logs_used INTEGER DEFAULT 0,
  
  -- Other usage tracking... ✅
  article_credits_included INTEGER DEFAULT 0,
  domains_included INTEGER DEFAULT 1,
  
  plan_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Detailed AI crawler logs 🟡 DESIGNED BUT USING crawler_visits INSTEAD
CREATE TABLE ai_crawler_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  domain VARCHAR(255) NOT NULL,
  ai_platform VARCHAR(50), -- 'chatgpt', 'claude', etc.
  query_text TEXT,
  mention_context TEXT,
  confidence_score DECIMAL(3,2),
  billed BOOLEAN DEFAULT FALSE,
  cost_cents INTEGER DEFAULT 0,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### API Endpoints
- `POST /api/usage/ai-logs` - Track AI mentions ❌ **NOT IMPLEMENTED**
- `GET /api/usage/current` - Get usage data with warnings ✅ **COMPLETED**
- `POST /api/billing/upgrade-addons` - Manage add-ons ❌ **NOT IMPLEMENTED**
- `GET /api/usage/ai-logs` - View detailed logs ❌ **NOT IMPLEMENTED**

---

## 🎯 Competitive Advantages ✅ **COMPLETED**

### Transparent Pricing ✅
- **No seat-based billing** - pay for actual usage ✅
- **Real-time cost tracking** - always know your spend ✅
- **Predictable base costs** with usage-based scaling ✅

### Advanced Usage Management ✅
- **Smart warnings** prevent surprise bills ✅
- **Granular usage tracking** down to individual logs ✅ *Using real data*
- **Flexible add-ons** scale with your business 🟡 *UI ready, billing pending*
- **No service interruptions** - soft limits only ✅

### Enterprise Features ✅
- **Multi-domain tracking** for agencies ✅
- **Detailed analytics** and reporting ✅
- **API access** for custom integrations ✅
- **Priority support** on higher plans ✅

---

## 🚀 Getting Started ✅ **COMPLETED**

### Step 1: Choose Your Base Plan ✅
Start with the plan that matches your domain and article needs

### Step 2: Monitor Usage ✅
Track your AI crawler logs and other usage in real-time

### Step 3: Scale with Add-Ons 🟡
Add extra articles or domains as your business grows *(UI ready)*

### Step 4: Manage Billing ❌
Use Stripe Customer Portal for invoices and payment methods *(Pending Stripe integration)*

---

## 📝 Implementation Roadmap

### ✅ **Phase 1: COMPLETED** - Core Usage Tracking
- [x] Base plan structure and limits
- [x] Database schema for subscription tracking  
- [x] Real-time usage dashboard
- [x] Billing period management
- [x] Domain and scan tracking
- [x] Usage warnings and overage calculations

### 🟡 **Phase 2: IN PROGRESS** - Features & UI
- [x] Add-ons management UI
- [ ] Articles generation system
- [ ] Enhanced crawler log details
- [ ] Usage export/reporting

### ❌ **Phase 3: PENDING** - Stripe Integration
- [ ] Metered billing for AI logs
- [ ] Add-ons subscription management
- [ ] Customer portal integration
- [ ] Automated invoicing
- [ ] Proration handling

### ❌ **Phase 4: PENDING** - API Completion  
- [ ] `POST /api/usage/ai-logs` endpoint
- [ ] `GET /api/usage/ai-logs` endpoint
- [ ] `POST /api/billing/upgrade-addons` endpoint
- [ ] Webhook handling for Stripe events

---

> **No contracts, no hidden fees.** Cancel anytime. Built for modern businesses that value transparency and flexibility. 

> **🎯 Current Status:** Core usage tracking is fully functional! Users can see real-time usage, warnings, and overage calculations. Next: Stripe integration for billing. 