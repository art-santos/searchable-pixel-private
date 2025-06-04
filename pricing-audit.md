# Pricing Audit Report
**Split.dev Subscription & Metered Billing System**  
*Date: December 2024*  
*Reviewer: AI Assistant (CFO/PM Perspective)*

## Executive Summary

Split.dev has implemented a hybrid subscription + metered billing model with four tiers. While the core architecture is sound, there are several critical gaps in user controls, billing transparency, and abuse prevention that need immediate attention before production launch.

**Overall Rating: ⚠️ NEEDS ATTENTION** - Core pricing works but lacks enterprise controls

---

## 📊 Current Pricing Structure

### Subscription Tiers
| Plan | Monthly | Annual | AI Logs | Articles | Domains | Scans |
|------|---------|--------|---------|----------|---------|-------|
| **Free** | $0 | $0 | 100 | 0 | 1 | 4/month |
| **Visibility** | $40 | $32 | 250 | 0 | 1 | Daily (basic) |
| **Plus** | $200 | $160 | 500 | 10 | 1 | Unlimited (MAX) |
| **Pro** | $1,000 | $800 | 1,000 | 30 | 3 | Unlimited (MAX) |

### Metered Pricing (Overages)
- **AI Crawler Logs**: $0.008 per log
- **Extra Articles**: $10 per article
- **Extra Domains**: $100 per domain

---

## ✅ What's Working Well

### 1. **Stripe Integration**
- Proper Stripe Customer Portal integration
- Support for promotional codes (`allow_promotion_codes: true`)
- Annual billing discounts (20% off)
- Webhook handling for subscription status changes

### 2. **Usage Tracking Architecture**
- Real-time usage monitoring via `subscription_usage` table
- Proper billing period management with automatic resets
- Comprehensive event logging in `usage_events` table
- Automatic overage reporting to Stripe

### 3. **Admin Override System**
- Admin users bypass all billing restrictions for testing
- Clean separation between admin testing and real billing

---

## 🚨 Critical Issues

### 1. **NO USER CONTROL OVER AI LOG BILLING** ⚠️
**Issue**: Users cannot disable AI crawler tracking or opt out of overage billing

**Risk**: 
- Users could rack up unexpected charges from crawler activity they can't control
- No way to set spending limits or disable metered billing
- Potential for billing disputes and chargebacks

**Example Scenario**:
```
User gets mentioned on Hacker News → 1,000 AI crawlers visit → 
$8 overage charge with no warning or control
```

**Recommended Fix**:
```typescript
// Add to profiles table
billing_preferences: {
  ai_logs_enabled: boolean,
  spending_limit_cents: number,
  overage_notifications: boolean,
  auto_billing_enabled: boolean
}
```

### 2. **MISSING SPENDING LIMITS** ⚠️
**Issue**: No caps on overage billing - users could accumulate unlimited charges

**Risk**: 
- $0.008 × 10,000 logs = $80 unexpected charge
- No circuit breaker for runaway billing
- Potential legal/regulatory issues

**Recommended Implementation**:
```typescript
// Add spending limits per plan
const OVERAGE_LIMITS = {
  free: 0,        // No overages allowed
  visibility: 25, // $25/month max
  plus: 100,      // $100/month max  
  pro: 500        // $500/month max
}
```

### 3. **INSUFFICIENT BILLING TRANSPARENCY** ⚠️
**Issue**: Users only see overage costs after charges occur

**Current UX**: Billing shows after usage exceeds limits
**Better UX**: Real-time warnings as users approach limits

**Recommended Warnings**:
- 80% usage: "You've used 80% of your AI logs (200/250). Additional logs cost $0.008 each."
- 95% usage: "APPROACHING LIMIT: 5 logs remaining before overage billing begins"
- 100%+ usage: "OVERAGE BILLING ACTIVE: Each additional log costs $0.008"

---

## 💰 Revenue & Business Logic Issues

### 1. **Free Plan AI Logs** 🤔
**Question**: Why do free users get 100 AI logs?

**Analysis**:
- Free users can't be billed for overages (no payment method)
- Creates support burden when free users hit limits
- May encourage plan abuse

**Recommendation**: Consider reducing free AI logs to 25-50, or requiring payment method for any AI log tracking

### 2. **Pricing Gaps** 💸
**Issue**: Large gaps between plans create upgrade resistance

**Example**: Visibility ($40) → Plus ($200) = 400% increase
**Impact**: Users likely to churn rather than upgrade

**Recommendation**: Consider intermediate plan at $80-120 range

### 3. **Domain Pricing Misalignment** 🏢
**Issue**: $100/domain may be too high compared to plan values

**Analysis**:
- Visibility plan ($40) + 1 extra domain ($100) = $140 total
- Makes more sense to upgrade to Plus ($200) for more features
- Domain add-on pricing should encourage retention, not upgrades

**Recommendation**: Reduce domain pricing to $25-50 per domain

---

## 🔒 Security & Abuse Prevention

### 1. **Missing Rate Limiting** ⚠️
**Issue**: No protection against API abuse for usage tracking

**Risk**: Users could spam usage endpoints to manipulate billing

**Recommended Fix**:
```typescript
// Add rate limiting to usage endpoints
const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Max 100 usage events per minute
  message: 'Too many usage events'
})
```

### 2. **Plan Downgrade Edge Cases** 🔄
**Issue**: Unclear what happens when users downgrade with existing overages

**Example**: Pro user with 3 domains downgrades to Visibility (1 domain limit)
**Current Behavior**: Unclear from codebase
**Recommended**: Grace period + prorated charges + clear communication

### 3. **Admin Testing Pollution** 🧪
**Issue**: Admin testing could skew usage analytics

**Current**: Admins marked with `isAdminTest: true` but data still stored
**Recommendation**: Separate test data completely or add clear filtering

---

## 🎫 Enterprise Features Missing

### 1. **Coupon Code Management** ❌
**Status**: Stripe promotional codes enabled but no admin interface

**Missing Features**:
- Bulk coupon generation
- Usage tracking and limits
- Customer-specific discounts
- Referral program integration

### 2. **Enterprise Controls** ❌
**Missing Features**:
- Team billing (multiple users, one subscription)
- Invoice payment terms (Net 30, etc.)
- Custom pricing agreements
- Volume discounts
- Spending approvals/limits per team member

### 3. **Analytics & Reporting** ❌
**Missing Features**:
- Revenue analytics dashboard
- Churn prediction
- Usage pattern analysis
- Customer health scores

---

## 🛠️ Technical Debt & Maintenance

### 1. **Complex Settings Page** 📄
**Issue**: `settings/page.tsx` is 1,800+ lines - difficult to maintain

**Risk**: Bugs in billing UI could cause revenue loss
**Recommendation**: Break into smaller components

### 2. **Hardcoded Pricing** 💰
**Issue**: Prices scattered across multiple files

**Files with pricing**:
- `src/app/settings/page.tsx` (display prices)
- `src/lib/subscription/config.ts` (plan limits)
- `src/components/onboarding/utils/onboarding-constants.ts` (onboarding prices)

**Recommendation**: Centralize in config with Stripe price ID mapping

### 3. **Database Migration Strategy** 🗄️
**Issue**: No clear migration path for pricing changes

**Risk**: Price changes could break existing subscriptions
**Recommendation**: Version pricing configs and maintain backward compatibility

---

## 🚀 Immediate Action Items

### High Priority (Launch Blockers)
1. **Add AI log billing controls** - Users must be able to disable/limit overages
2. **Implement spending limits** - Cap overage billing per plan
3. **Add real-time usage warnings** - Notify before overage billing begins
4. **Add billing preferences to user profiles** - Enable/disable features

### Medium Priority (Post-Launch)
1. **Build coupon management system**
2. **Add team billing support**
3. **Implement usage-based plan recommendations**
4. **Add revenue analytics dashboard**

### Low Priority (Future)
1. **Enterprise sales integration**
2. **Custom pricing agreements**
3. **API rate limiting improvements**

---

## 🔍 Edge Cases to Test

### Billing Scenarios
1. **User hits AI log limit on last day of billing cycle**
2. **User cancels subscription with pending overage charges**
3. **User downgrades mid-cycle with usage above new plan limits**
4. **User changes payment method during active overages**
5. **Stripe webhook fails during overage billing**

### Technical Scenarios
1. **AI crawler detection false positives** (regular users marked as crawlers)
2. **Duplicate usage events** (network retries causing double billing)
3. **Time zone edge cases** (billing period calculations)
4. **Database connection failures** during usage tracking

### User Experience Scenarios
1. **User removes website from their domain** (should AI log tracking stop?)
2. **User wants to track crawlers but not be billed** (analytics-only mode)
3. **User hits overage on weekend** (support not available)

---

## 📋 Pre-Launch Checklist

### Legal & Compliance
- [ ] Terms of Service include overage billing terms
- [ ] Privacy Policy covers AI crawler data collection
- [ ] Stripe compliance review completed
- [ ] GDPR compliance for EU users verified

### User Experience
- [ ] Clear billing warnings implemented
- [ ] User can disable AI log tracking
- [ ] Spending limits configurable
- [ ] Overage billing clearly explained in UI

### Technical
- [ ] All pricing edge cases tested
- [ ] Webhook failure recovery tested
- [ ] Database performance under high usage tested
- [ ] Admin testing data separated from production

### Business
- [ ] Revenue recognition processes documented
- [ ] Customer support trained on billing issues
- [ ] Chargeback/dispute process documented
- [ ] Pricing change communication plan ready

---

## 💡 Recommendations Summary

1. **Add user billing controls immediately** - This is a launch blocker
2. **Implement spending limits** - Protect users and business from runaway charges
3. **Improve billing transparency** - Real-time warnings and clear pricing
4. **Build enterprise features** - Coupons, team billing, custom pricing
5. **Centralize pricing configuration** - Make changes easier and safer
6. **Add comprehensive testing** - Cover all edge cases before launch

**Bottom Line**: The pricing architecture is solid, but user controls and transparency need significant improvement before production launch. 