/*
  # Create Feature Usage Tracking Table

  1. New Tables
    - `feature_usage`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `feature_type` (text) - Type of feature being tracked
      - `used_count` (integer) - Number of times used
      - `limit_count` (integer) - Usage limit
      - `reset_date` (timestamptz) - When usage resets
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `feature_usage` table
    - Add policies for users to read/update their own usage data
    
  3. Indexes
    - Index on user_id and feature_type for fast lookups
*/

-- Drop table if exists to start fresh
DROP TABLE IF EXISTS feature_usage CASCADE;

-- Create feature_usage table
CREATE TABLE feature_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature_type text NOT NULL,
  used_count integer DEFAULT 0 NOT NULL,
  limit_count integer DEFAULT 10 NOT NULL,
  reset_date timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;

-- Create index for fast lookups
CREATE INDEX idx_feature_usage_user_feature 
  ON feature_usage(user_id, feature_type);

-- Policy: Users can read their own feature usage
CREATE POLICY "Users can read own feature usage"
  ON feature_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own feature usage
CREATE POLICY "Users can insert own feature usage"
  ON feature_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own feature usage
CREATE POLICY "Users can update own feature usage"
  ON feature_usage
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_feature_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_feature_usage_updated_at ON feature_usage;
CREATE TRIGGER update_feature_usage_updated_at
  BEFORE UPDATE ON feature_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_feature_usage_updated_at();
