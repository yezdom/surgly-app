/*
  # Enable Row Level Security and Complete Security Policies
  
  ## Summary
  This migration:
  1. Enables Row Level Security (RLS) on all database tables
  2. Adds missing security policies to complete coverage
  3. Ensures data is protected and only accessible by authorized users
  
  ## Security Impact
  - CRITICAL: After this migration, ALL tables will enforce RLS
  - Users can ONLY access their own data
  - Policies verify ownership through auth.uid() and relationship chains
  - This prevents data leaks, unauthorized access, and security vulnerabilities
  
  ## Tables Secured
  1. users - User profiles
  2. ad_accounts - Connected ad accounts with OAuth tokens
  3. campaigns - Campaign data
  4. ads - Individual ads
  5. ad_metrics - Performance metrics
  6. analyses - AI analyses
  7. alerts - User notifications
  8. chat_messages - Chat history
  9. feature_usage - Feature tracking
  10. subscriptions - Subscription data
*/

-- =====================================================
-- STEP 1: ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: ADD MISSING POLICIES
-- =====================================================

-- CAMPAIGNS: Add missing INSERT, UPDATE, DELETE policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'campaigns' 
    AND policyname = 'Users can insert own campaigns'
  ) THEN
    CREATE POLICY "Users can insert own campaigns"
      ON public.campaigns
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.ad_accounts
          WHERE ad_accounts.id = campaigns.ad_account_id
          AND ad_accounts.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'campaigns' 
    AND policyname = 'Users can update own campaigns'
  ) THEN
    CREATE POLICY "Users can update own campaigns"
      ON public.campaigns
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.ad_accounts
          WHERE ad_accounts.id = campaigns.ad_account_id
          AND ad_accounts.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.ad_accounts
          WHERE ad_accounts.id = campaigns.ad_account_id
          AND ad_accounts.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'campaigns' 
    AND policyname = 'Users can delete own campaigns'
  ) THEN
    CREATE POLICY "Users can delete own campaigns"
      ON public.campaigns
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.ad_accounts
          WHERE ad_accounts.id = campaigns.ad_account_id
          AND ad_accounts.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ADS: Add missing INSERT, UPDATE, DELETE policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'ads' 
    AND policyname = 'Users can insert own ads'
  ) THEN
    CREATE POLICY "Users can insert own ads"
      ON public.ads
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.campaigns
          JOIN public.ad_accounts ON ad_accounts.id = campaigns.ad_account_id
          WHERE campaigns.id = ads.campaign_id
          AND ad_accounts.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'ads' 
    AND policyname = 'Users can update own ads'
  ) THEN
    CREATE POLICY "Users can update own ads"
      ON public.ads
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.campaigns
          JOIN public.ad_accounts ON ad_accounts.id = campaigns.ad_account_id
          WHERE campaigns.id = ads.campaign_id
          AND ad_accounts.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.campaigns
          JOIN public.ad_accounts ON ad_accounts.id = campaigns.ad_account_id
          WHERE campaigns.id = ads.campaign_id
          AND ad_accounts.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'ads' 
    AND policyname = 'Users can delete own ads'
  ) THEN
    CREATE POLICY "Users can delete own ads"
      ON public.ads
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.campaigns
          JOIN public.ad_accounts ON ad_accounts.id = campaigns.ad_account_id
          WHERE campaigns.id = ads.campaign_id
          AND ad_accounts.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- AD_METRICS: Add missing INSERT, UPDATE policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'ad_metrics' 
    AND policyname = 'Users can insert own ad metrics'
  ) THEN
    CREATE POLICY "Users can insert own ad metrics"
      ON public.ad_metrics
      FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.ads
          JOIN public.campaigns ON campaigns.id = ads.campaign_id
          JOIN public.ad_accounts ON ad_accounts.id = campaigns.ad_account_id
          WHERE ads.id = ad_metrics.ad_id
          AND ad_accounts.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'ad_metrics' 
    AND policyname = 'Users can update own ad metrics'
  ) THEN
    CREATE POLICY "Users can update own ad metrics"
      ON public.ad_metrics
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.ads
          JOIN public.campaigns ON campaigns.id = ads.campaign_id
          JOIN public.ad_accounts ON ad_accounts.id = campaigns.ad_account_id
          WHERE ads.id = ad_metrics.ad_id
          AND ad_accounts.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.ads
          JOIN public.campaigns ON campaigns.id = ads.campaign_id
          JOIN public.ad_accounts ON ad_accounts.id = campaigns.ad_account_id
          WHERE ads.id = ad_metrics.ad_id
          AND ad_accounts.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ANALYSES: Add missing DELETE policy
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'analyses' 
    AND policyname = 'Users can delete own analyses'
  ) THEN
    CREATE POLICY "Users can delete own analyses"
      ON public.analyses
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ALERTS: Add missing INSERT, DELETE policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'alerts' 
    AND policyname = 'System can create alerts'
  ) THEN
    CREATE POLICY "System can create alerts"
      ON public.alerts
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'alerts' 
    AND policyname = 'Users can delete own alerts'
  ) THEN
    CREATE POLICY "Users can delete own alerts"
      ON public.alerts
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;
