/*
  # Create AI Reports Table for Pre-Launch Validator Integration

  1. New Tables
    - `ai_reports`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `ad_account_id` (text, nullable - Facebook ad account ID)
      - `report_type` (text - 'pre_launch' or 'facebook_analysis')
      - `landing_url` (text, nullable)
      - `headline` (text, nullable)
      - `body_text` (text, nullable)
      - `primary_text` (text, nullable)
      - `description` (text, nullable)
      - `cta` (text, nullable)
      - `clarity_score` (integer)
      - `compliance` (text)
      - `conversion_score` (integer)
      - `emotional_appeal` (integer, nullable)
      - `predicted_engagement` (integer, nullable)
      - `recommendations` (jsonb - array of recommendations)
      - `emotional_hooks` (jsonb, nullable)
      - `unique_selling_points` (jsonb, nullable)
      - `missing_elements` (jsonb, nullable)
      - `visual_cohesion` (text, nullable)
      - `dr_surgly_prescription` (text, nullable)
      - `extracted_images` (jsonb, nullable - array of image URLs)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `ai_reports` table
    - Add policies for authenticated users to manage their own reports
*/

CREATE TABLE IF NOT EXISTS ai_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ad_account_id text,
  report_type text NOT NULL DEFAULT 'pre_launch',
  landing_url text,
  headline text,
  body_text text,
  primary_text text,
  description text,
  cta text,
  clarity_score integer DEFAULT 0,
  compliance text,
  conversion_score integer DEFAULT 0,
  emotional_appeal integer,
  predicted_engagement integer,
  recommendations jsonb DEFAULT '[]'::jsonb,
  emotional_hooks jsonb,
  unique_selling_points jsonb,
  missing_elements jsonb,
  visual_cohesion text,
  dr_surgly_prescription text,
  extracted_images jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE ai_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own reports
CREATE POLICY "Users can view own ai_reports"
  ON ai_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own reports
CREATE POLICY "Users can insert own ai_reports"
  ON ai_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own reports
CREATE POLICY "Users can update own ai_reports"
  ON ai_reports
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own reports
CREATE POLICY "Users can delete own ai_reports"
  ON ai_reports
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS ai_reports_user_id_idx ON ai_reports(user_id);
CREATE INDEX IF NOT EXISTS ai_reports_created_at_idx ON ai_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS ai_reports_report_type_idx ON ai_reports(report_type);
