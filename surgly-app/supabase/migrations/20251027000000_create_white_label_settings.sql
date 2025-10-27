/*
  # Create White Label Settings Table

  1. New Tables
    - `white_label_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `company_name` (text)
      - `primary_color` (text)
      - `logo_url` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `white_label_settings` table
    - Add policy for users to manage their own settings
*/

CREATE TABLE IF NOT EXISTS white_label_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name text DEFAULT 'Surgly',
  primary_color text DEFAULT '#8b5cf6',
  logo_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE white_label_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own white-label settings"
  ON white_label_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own white-label settings"
  ON white_label_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own white-label settings"
  ON white_label_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_white_label_settings_user_id
  ON white_label_settings(user_id);
