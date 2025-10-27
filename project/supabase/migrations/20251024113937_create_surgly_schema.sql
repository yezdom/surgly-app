/*
  # Create SURGLY Database Schema
  
  ## Overview
  Complete database schema for SURGLY - AI-Powered Facebook Ads Doctor Platform.
  This creates all tables for user management, ad accounts, campaigns, analyses, and billing.
  
  ## Tables Created
  
  ### Core User Management
  - `users` - User accounts with authentication and plan information
  - `subscriptions` - Stripe subscription tracking
  
  ### Ad Platform Integration
  - `ad_accounts` - Connected Facebook/TikTok/Google ad accounts
  - `campaigns` - Synced advertising campaigns
  - `ads` - Individual ads within campaigns
  - `ad_metrics` - Daily performance metrics for ads
  
  ### AI Analysis & Intelligence
  - `analyses` - Pre-launch validations and diagnostics
  - `alerts` - Real-time budget and performance alerts
  - `chat_messages` - AI chatbot conversation history
  
  ### Usage & Billing
  - `feature_usage` - Track feature usage for plan limits
  
  ## Security
  - RLS enabled on all tables
  - Policies restrict access to user's own data only
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
DO $$ BEGIN
  CREATE TYPE user_plan AS ENUM ('TRIAL', 'STARTER', 'PRO', 'AGENCY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE billing_cycle AS ENUM ('MONTHLY', 'ANNUAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE theme_preference AS ENUM ('DARK', 'LIGHT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE ad_platform AS ENUM ('FACEBOOK', 'TIKTOK', 'GOOGLE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE campaign_status AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE analysis_type AS ENUM ('PRE_LAUNCH', 'AD_DOCTOR', 'COMPETITOR', 'AUDIENCE', 'COPY', 'BUDGET', 'CREATIVE', 'LANDING_PAGE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE analysis_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE alert_severity AS ENUM ('INFO', 'WARNING', 'CRITICAL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE chat_role AS ENUM ('USER', 'ASSISTANT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('ACTIVE', 'CANCELLED', 'PAST_DUE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  password_hash text,
  full_name text NOT NULL,
  avatar_url text,
  plan user_plan DEFAULT 'TRIAL' NOT NULL,
  trial_start timestamptz DEFAULT now(),
  trial_end timestamptz DEFAULT (now() + interval '3 days'),
  billing_cycle billing_cycle DEFAULT 'ANNUAL',
  stripe_customer_id text,
  theme_preference theme_preference DEFAULT 'DARK',
  email_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ad Accounts table
CREATE TABLE IF NOT EXISTS ad_accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform ad_platform DEFAULT 'FACEBOOK' NOT NULL,
  account_id text NOT NULL,
  account_name text NOT NULL,
  access_token text NOT NULL,
  token_expires_at timestamptz,
  currency text DEFAULT 'GBP',
  is_active boolean DEFAULT true,
  connected_at timestamptz DEFAULT now(),
  last_synced_at timestamptz,
  UNIQUE(user_id, account_id)
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_account_id uuid NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
  campaign_id text NOT NULL,
  campaign_name text NOT NULL,
  objective text,
  status campaign_status DEFAULT 'ACTIVE',
  daily_budget decimal(10,2),
  lifetime_budget decimal(10,2),
  start_date timestamptz NOT NULL,
  end_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ads table
CREATE TABLE IF NOT EXISTS ads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  ad_id text NOT NULL,
  ad_name text NOT NULL,
  creative_url text,
  ad_copy text,
  headline text,
  cta_type text,
  status campaign_status DEFAULT 'ACTIVE',
  created_at timestamptz DEFAULT now()
);

-- Ad Metrics table
CREATE TABLE IF NOT EXISTS ad_metrics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_id uuid NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
  date timestamptz NOT NULL,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  spend decimal(10,2) DEFAULT 0,
  conversions integer DEFAULT 0,
  ctr decimal(5,2) DEFAULT 0,
  cpc decimal(10,2) DEFAULT 0,
  cpa decimal(10,2),
  roas decimal(10,2),
  created_at timestamptz DEFAULT now()
);

-- Analyses table
CREATE TABLE IF NOT EXISTS analyses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ad_id uuid REFERENCES ads(id) ON DELETE SET NULL,
  analysis_type analysis_type NOT NULL,
  input_data jsonb NOT NULL,
  ai_response jsonb,
  overall_score integer DEFAULT 0,
  recommendations jsonb,
  status analysis_status DEFAULT 'PENDING',
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ad_account_id uuid REFERENCES ad_accounts(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  severity alert_severity NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  action_url text,
  created_at timestamptz DEFAULT now()
);

-- Chat Messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role chat_role NOT NULL,
  message text NOT NULL,
  context jsonb,
  tokens_used integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Feature Usage table
CREATE TABLE IF NOT EXISTS feature_usage (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature_name text NOT NULL,
  usage_count integer DEFAULT 0,
  last_used_at timestamptz DEFAULT now(),
  reset_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, feature_name)
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan user_plan NOT NULL,
  status subscription_status NOT NULL,
  billing_cycle billing_cycle NOT NULL,
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  stripe_subscription_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for ad_accounts table
CREATE POLICY "Users can view own ad accounts"
  ON ad_accounts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own ad accounts"
  ON ad_accounts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own ad accounts"
  ON ad_accounts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own ad accounts"
  ON ad_accounts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for campaigns table
CREATE POLICY "Users can view own campaigns"
  ON campaigns FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ad_accounts
      WHERE ad_accounts.id = campaigns.ad_account_id
      AND ad_accounts.user_id = auth.uid()
    )
  );

-- RLS Policies for ads table
CREATE POLICY "Users can view own ads"
  ON ads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      JOIN ad_accounts ON ad_accounts.id = campaigns.ad_account_id
      WHERE campaigns.id = ads.campaign_id
      AND ad_accounts.user_id = auth.uid()
    )
  );

-- RLS Policies for ad_metrics table
CREATE POLICY "Users can view own ad metrics"
  ON ad_metrics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ads
      JOIN campaigns ON campaigns.id = ads.campaign_id
      JOIN ad_accounts ON ad_accounts.id = campaigns.ad_account_id
      WHERE ads.id = ad_metrics.ad_id
      AND ad_accounts.user_id = auth.uid()
    )
  );

-- RLS Policies for analyses table
CREATE POLICY "Users can view own analyses"
  ON analyses FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own analyses"
  ON analyses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own analyses"
  ON analyses FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for alerts table
CREATE POLICY "Users can view own alerts"
  ON alerts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own alerts"
  ON alerts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for chat_messages table
CREATE POLICY "Users can view own chat messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own chat messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for feature_usage table
CREATE POLICY "Users can view own feature usage"
  ON feature_usage FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own feature usage"
  ON feature_usage FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own feature usage"
  ON feature_usage FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for subscriptions table
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own subscription"
  ON subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ad_accounts_user_id ON ad_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_ad_account_id ON campaigns(ad_account_id);
CREATE INDEX IF NOT EXISTS idx_ads_campaign_id ON ads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_metrics_ad_id ON ad_metrics(ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_metrics_date ON ad_metrics(date);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_id ON feature_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);