/*
  # Create Billing Events Table

  1. New Tables
    - `billing_events`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `event_type` (text) - Type of billing event (checkout_completed, subscription_canceled, etc.)
      - `plan` (text) - Plan name (free, starter, pro, agency)
      - `amount` (numeric) - Amount in currency units
      - `stripe_session_id` (text) - Stripe session/subscription ID
      - `metadata` (jsonb) - Additional event data
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `billing_events` table
    - Add policy for users to read their own billing events
    - Add policy for admin to read all billing events
*/

CREATE TABLE IF NOT EXISTS billing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  plan text,
  amount numeric DEFAULT 0,
  stripe_session_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_billing_events_user_id ON billing_events(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_created_at ON billing_events(created_at DESC);

-- Enable RLS
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own billing events
CREATE POLICY "Users can read own billing events"
  ON billing_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Admins can read all billing events
CREATE POLICY "Admins can read all billing events"
  ON billing_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Add stripe_customer_id to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE users ADD COLUMN stripe_customer_id text;
  END IF;
END $$;

-- Add stripe_subscription_id to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE users ADD COLUMN stripe_subscription_id text;
  END IF;
END $$;