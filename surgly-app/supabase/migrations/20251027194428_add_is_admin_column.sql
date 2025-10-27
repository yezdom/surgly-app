/*
  # Add is_admin Column to Users Table

  1. Changes
    - Add `is_admin` boolean column to `users` table with default false
    - Update the specified user (c7618e37-8c31-4a21-937c-6433f5273edc) to have admin access

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
END $$;

-- Set the specified user as admin
UPDATE users 
SET is_admin = true 
WHERE id = 'c7618e37-8c31-4a21-937c-6433f5273edc';
