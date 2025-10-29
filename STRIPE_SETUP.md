# Stripe Integration Setup Guide

## Overview
SURGLY.APP now includes full Stripe sandbox billing integration with Supabase backend. This guide explains the setup process for both test and production environments.

---

## ✅ What's Been Implemented

### 1. Database
- **billing_events** table created with RLS policies
- Tracks all subscription events (checkout, cancellation, payments)
- Stores user subscription data in users table (stripe_customer_id, stripe_subscription_id, subscription_tier)

### 2. Edge Functions
Four Supabase Edge Functions deployed:

- **stripe-checkout** - Creates Stripe checkout sessions for plan upgrades
- **stripe-webhook** - Handles Stripe webhook events (subscriptions, payments)
- **stripe-portal** - Creates customer portal sessions for billing management
- **stripe-cancel** - Cancels subscriptions at period end

### 3. Frontend Integration
- Billing service utility (`src/lib/billingService.ts`)
- Settings page fully integrated with real Stripe functions
- Upgrade/Cancel/Manage Billing buttons functional

---

## 🔧 Environment Variables Required

### Supabase Edge Functions
The following environment variables are automatically configured in Supabase:

```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
APP_URL=https://surgly.app

# Price IDs for each plan/billing cycle
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_STARTER_ANNUAL=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_ANNUAL=price_...
STRIPE_PRICE_AGENCY_MONTHLY=price_...
STRIPE_PRICE_AGENCY_ANNUAL=price_...
```

### Frontend Environment Variables
Add to `.env`:

```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## 📋 Stripe Dashboard Setup

### Step 1: Create Products and Prices

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/products)
2. Create 3 products:
   - **Starter** (£29/month, £278/year)
   - **Pro** (£49/month, £470/year)
   - **Agency** (£99/month, £950/year)

3. For each product, create two prices:
   - **Monthly** (recurring, every 1 month)
   - **Annual** (recurring, every 12 months)

4. Copy the Price IDs (e.g., `price_1234...`) and set them as environment variables

### Step 2: Configure Webhooks

1. Go to [Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **Add endpoint**
3. Set URL to: `https://[your-supabase-project].supabase.co/functions/v1/stripe-webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. Copy the **Signing secret** (starts with `whsec_`)
6. Set as `STRIPE_WEBHOOK_SECRET` in Supabase

### Step 3: Enable Customer Portal

1. Go to [Customer Portal Settings](https://dashboard.stripe.com/test/settings/billing/portal)
2. Enable the portal
3. Configure features:
   - ✅ Update payment method
   - ✅ Cancel subscription
   - ✅ Update subscription (plan changes)
   - ✅ View invoice history

---

## 🧪 Testing in Sandbox

### Test Cards
Use these test cards from [Stripe Testing](https://stripe.com/docs/testing):

- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002
- **3D Secure:** 4000 0025 0000 3155

Use any future expiry date, any CVV, and any postal code.

### Test Workflow

1. **Sign up** for a free account on SURGLY.APP
2. Navigate to **Settings**
3. Click **Upgrade to Paid Plan**
4. Complete checkout with test card
5. Verify subscription activated in Settings
6. Test **Manage Billing Portal**
7. Test **Cancel Subscription**

### Verify Events

Check Supabase:
```sql
SELECT * FROM billing_events ORDER BY created_at DESC LIMIT 10;
SELECT id, email, subscription_tier, stripe_customer_id FROM users;
```

---

## 🚀 Production Deployment

### Step 1: Switch to Live Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) (toggle to **Live mode**)
2. Get your live API keys:
   - **Secret Key** (`sk_live_...`)
   - **Webhook Secret** (`whsec_live_...`)

3. Create live products and prices (same setup as test)
4. Update environment variables in Supabase with live keys

### Step 2: Update Vercel Environment Variables

In Vercel Dashboard:
```bash
VITE_SUPABASE_URL=production_url
VITE_SUPABASE_ANON_KEY=production_key
```

### Step 3: Configure Live Webhook

1. Add webhook endpoint in **Live mode**
2. URL: `https://[production-supabase].supabase.co/functions/v1/stripe-webhook`
3. Select same events as test mode
4. Update `STRIPE_WEBHOOK_SECRET` in Supabase

---

## 📊 Price Mapping

| Plan    | Monthly | Annual (20% off) | Price IDs Needed |
|---------|---------|------------------|------------------|
| Starter | £29     | £278             | 2 (monthly, annual) |
| Pro     | £49     | £470             | 2 (monthly, annual) |
| Agency  | £99     | £950             | 2 (monthly, annual) |

**Total:** 6 Price IDs to configure

---

## 🔐 Security Notes

- Webhook endpoint uses signature verification
- JWT verification enabled on checkout/portal/cancel functions
- RLS policies protect billing_events table
- Service role key used only in edge functions
- No sensitive keys exposed to frontend

---

## 📝 Billing Event Types

The system logs these event types:

- `checkout_initiated` - User started checkout
- `checkout_completed` - Subscription activated
- `subscription_updated` - Plan changed
- `subscription_canceled` - Subscription ended
- `subscription_cancel_scheduled` - Cancellation scheduled
- `payment_succeeded` - Payment processed
- `payment_failed` - Payment declined

---

## 🐛 Troubleshooting

### Webhook Not Receiving Events
- Verify webhook URL is correct
- Check Stripe webhook logs in dashboard
- Ensure `STRIPE_WEBHOOK_SECRET` is set correctly
- Test webhook with "Send test webhook" in Stripe

### Checkout Not Working
- Check browser console for errors
- Verify Price IDs are correct
- Ensure user is authenticated
- Check edge function logs in Supabase

### Subscription Not Updating
- Check `billing_events` table for errors
- Verify webhook events are being received
- Check users table for `subscription_tier` field
- Review Supabase edge function logs

### Customer Portal Issues
- Ensure customer portal is enabled in Stripe
- Verify user has `stripe_customer_id` in database
- Check that user has active subscription

---

## 📚 Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Stripe Testing](https://stripe.com/docs/testing)

---

## ✅ Ready for Production

Once you've:
1. ✅ Created products and prices in Stripe
2. ✅ Configured webhook endpoint
3. ✅ Set environment variables
4. ✅ Tested with test cards
5. ✅ Verified billing events logging

You're ready to switch to live mode and accept real payments!
