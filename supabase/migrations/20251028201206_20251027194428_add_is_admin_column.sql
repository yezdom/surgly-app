/*
  # Add is_admin Column to Users Table

  1. Changes
    - Add `is_admin` boolean column to `users` table with default false
    - Add `subscription_tier` text column to `users` table with default 'Free'
    - Add `is_active` boolean column to `users` table with default true

  2. Security
    - No RLS changes needed as this is an additional column on existing table
*/

-- Add is_admin column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE users ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'subscription_tier'
  ) THEN
    ALTER TABLE users ADD COLUMN subscription_tier text DEFAULT 'Free';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE users ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;