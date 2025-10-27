/*
  # Create feature waitlist table

  1. New Tables
    - `feature_waitlist`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users, nullable)
      - `email` (text, required)
      - `feature_name` (text, required)
      - `created_at` (timestamptz)
      - `notified` (boolean, default false)
  
  2. Security
    - Enable RLS on `feature_waitlist` table
    - Add policy for authenticated users to insert their own waitlist entries
    - Add policy for users to read their own waitlist entries
*/

CREATE TABLE IF NOT EXISTS feature_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  email text NOT NULL,
  feature_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  notified boolean DEFAULT false
);

ALTER TABLE feature_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own waitlist entries"
  ON feature_waitlist
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own waitlist entries"
  ON feature_waitlist
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_feature_waitlist_user_id ON feature_waitlist(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_waitlist_feature_name ON feature_waitlist(feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_waitlist_notified ON feature_waitlist(notified);
