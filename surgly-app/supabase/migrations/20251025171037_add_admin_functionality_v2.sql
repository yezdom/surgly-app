/*
  # Add Admin Functionality and User Management
  
  ## Summary
  Adds comprehensive admin features including user management, billing tracking,
  and usage monitoring. This migration adds new fields to the users table and
  creates admin views for analytics.
  
  ## Changes
  
  ### 1. Users Table Updates
  - Add `role` field (user or admin)
  - Add `usage_limit` for custom limits
  - Add `is_active` for account suspension
  - Add `banned_at` timestamp
  - Add `banned_reason` text field
  - Add `notes` for admin notes
  - Add `subscription_status` enum
  - Add `subscription_tier` enum
  - Add `trial_ends_at` timestamp
  - Add `subscription_id` for Stripe
  - Add `customer_id` for Stripe
  
  ### 2. Admin Statistics View
  - Creates view for user analytics
  - Shows total analyses per user
  - Shows last activity dates
  - Aggregates usage statistics
  
  ## Security
  - RLS policies already enabled on users table
  - Admin users can view all users
  - Regular users can only view themselves
*/

-- =====================================================
-- STEP 1: ADD CUSTOM TYPES
-- =====================================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('user', 'admin');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status_type') THEN
    CREATE TYPE subscription_status_type AS ENUM ('free', 'trial', 'active', 'cancelled', 'past_due');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier_type') THEN
    CREATE TYPE subscription_tier_type AS ENUM ('free', 'pro', 'agency', 'admin');
  END IF;
END $$;

-- =====================================================
-- STEP 2: ADD NEW COLUMNS TO USERS TABLE
-- =====================================================

-- Add role column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.users ADD COLUMN role user_role DEFAULT 'user' NOT NULL;
  END IF;
END $$;

-- Add usage_limit column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'usage_limit'
  ) THEN
    ALTER TABLE public.users ADD COLUMN usage_limit integer DEFAULT NULL;
  END IF;
END $$;

-- Add is_active column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.users ADD COLUMN is_active boolean DEFAULT true NOT NULL;
  END IF;
END $$;

-- Add banned_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'banned_at'
  ) THEN
    ALTER TABLE public.users ADD COLUMN banned_at timestamptz DEFAULT NULL;
  END IF;
END $$;

-- Add banned_reason column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'banned_reason'
  ) THEN
    ALTER TABLE public.users ADD COLUMN banned_reason text DEFAULT NULL;
  END IF;
END $$;

-- Add notes column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.users ADD COLUMN notes text DEFAULT NULL;
  END IF;
END $$;

-- Add subscription_status column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE public.users ADD COLUMN subscription_status subscription_status_type DEFAULT 'trial' NOT NULL;
  END IF;
END $$;

-- Add subscription_tier column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE public.users ADD COLUMN subscription_tier subscription_tier_type DEFAULT 'free' NOT NULL;
  END IF;
END $$;

-- Add trial_ends_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'trial_ends_at'
  ) THEN
    ALTER TABLE public.users ADD COLUMN trial_ends_at timestamptz DEFAULT NULL;
  END IF;
END $$;

-- Add subscription_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'subscription_id'
  ) THEN
    ALTER TABLE public.users ADD COLUMN subscription_id text DEFAULT NULL;
  END IF;
END $$;

-- Add customer_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE public.users ADD COLUMN customer_id text DEFAULT NULL;
  END IF;
END $$;

-- =====================================================
-- STEP 3: UPDATE EXISTING USER DATA
-- =====================================================

-- Set trial_ends_at for existing users based on trial_end
UPDATE public.users 
SET trial_ends_at = trial_end 
WHERE trial_ends_at IS NULL AND trial_end IS NOT NULL;

-- Set subscription_status to trial for users with active trial
UPDATE public.users 
SET subscription_status = 'trial'
WHERE trial_ends_at > now() AND subscription_status = 'trial';

-- =====================================================
-- STEP 4: DROP OLD VIEW AND CREATE NEW ONE
-- =====================================================

DROP VIEW IF EXISTS admin_user_stats;

CREATE VIEW admin_user_stats AS
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.is_active,
  u.banned_at,
  u.banned_reason,
  u.notes,
  u.subscription_status,
  u.subscription_tier,
  u.trial_ends_at,
  u.subscription_id,
  u.customer_id,
  u.created_at,
  u.updated_at,
  COUNT(DISTINCT a.id) as total_analyses,
  MAX(a.created_at) as last_analysis_date,
  COUNT(DISTINCT cm.id) as total_chats,
  MAX(cm.created_at) as last_chat_date
FROM public.users u
LEFT JOIN public.analyses a ON a.user_id = u.id
LEFT JOIN public.chat_messages cm ON cm.user_id = u.id
GROUP BY u.id;

-- =====================================================
-- STEP 5: ADD RLS POLICIES FOR ADMIN
-- =====================================================

-- Allow admins to view all users
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Admins can view all users'
  ) THEN
    CREATE POLICY "Admins can view all users"
      ON public.users
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users admin
          WHERE admin.id = auth.uid()
          AND admin.role = 'admin'
        )
      );
  END IF;
END $$;

-- Allow admins to update any user
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Admins can update any user'
  ) THEN
    CREATE POLICY "Admins can update any user"
      ON public.users
      FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users admin
          WHERE admin.id = auth.uid()
          AND admin.role = 'admin'
        )
      );
  END IF;
END $$;

-- Allow admins to delete any user
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND policyname = 'Admins can delete any user'
  ) THEN
    CREATE POLICY "Admins can delete any user"
      ON public.users
      FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.users admin
          WHERE admin.id = auth.uid()
          AND admin.role = 'admin'
        )
      );
  END IF;
END $$;

-- =====================================================
-- STEP 6: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON public.users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON public.users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_users_trial_ends_at ON public.users(trial_ends_at);
