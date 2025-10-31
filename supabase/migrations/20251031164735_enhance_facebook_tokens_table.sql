/*
  # Enhance facebook_tokens table for OAuth token management
  
  1. Changes
    - Add expires_in column to store token lifetime in seconds
    - Add refresh_token column for long-lived token refresh
    - Add is_valid column to track token status
    - Add last_refreshed_at column to track refresh timing
    
  2. Purpose
    - Support automatic token refresh
    - Track token expiration properly
    - Enable token validation checks
*/

-- Add new columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'facebook_tokens' AND column_name = 'expires_in'
  ) THEN
    ALTER TABLE facebook_tokens ADD COLUMN expires_in integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'facebook_tokens' AND column_name = 'refresh_token'
  ) THEN
    ALTER TABLE facebook_tokens ADD COLUMN refresh_token text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'facebook_tokens' AND column_name = 'is_valid'
  ) THEN
    ALTER TABLE facebook_tokens ADD COLUMN is_valid boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'facebook_tokens' AND column_name = 'last_refreshed_at'
  ) THEN
    ALTER TABLE facebook_tokens ADD COLUMN last_refreshed_at timestamp with time zone;
  END IF;
END $$;