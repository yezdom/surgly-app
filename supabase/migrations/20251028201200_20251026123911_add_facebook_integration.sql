/*
  # Add Facebook Integration Support

  1. New Tables
    - `facebook_tokens`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `access_token` (text, encrypted Facebook token)
      - `token_type` (text, default 'bearer')
      - `expires_at` (timestamptz, token expiration)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - Unique constraint on user_id (one token per user)
  
  2. Table Updates
    - `analyses`
      - Add `facebook_campaign_id` (text, nullable)
      - Add `ad_account_id_fb` (text, nullable)
  
  3. Security
    - Enable RLS on `facebook_tokens` table
    - Add policy for users to view own tokens
    - Add policy for users to insert own tokens
    - Add policy for users to update own tokens
*/

CREATE TABLE IF NOT EXISTS facebook_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  access_token text NOT NULL,
  token_type text DEFAULT 'bearer',
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE facebook_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tokens"
  ON facebook_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tokens"
  ON facebook_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens"
  ON facebook_tokens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analyses' AND column_name = 'facebook_campaign_id'
  ) THEN
    ALTER TABLE analyses ADD COLUMN facebook_campaign_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'analyses' AND column_name = 'ad_account_id_fb'
  ) THEN
    ALTER TABLE analyses ADD COLUMN ad_account_id_fb text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_facebook_tokens_user_id ON facebook_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_facebook_campaign_id ON analyses(facebook_campaign_id);