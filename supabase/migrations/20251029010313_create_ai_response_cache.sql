/*
  # Create AI Response Cache Table
  
  1. New Table
    - `ai_response_cache` - Stores cached AI responses to minimize API costs
    
  2. Columns
    - id (uuid, primary key)
    - user_id (uuid, foreign key to users)
    - cache_key (text, indexed)
    - response (text)
    - created_at (timestamptz)
    
  3. Security
    - Enable RLS
    - Users can only access their own cached responses
    - Auto-delete cache entries older than 7 days
*/

-- Create AI response cache table
CREATE TABLE IF NOT EXISTS public.ai_response_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  cache_key text NOT NULL,
  response text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, cache_key)
);

-- Enable RLS
ALTER TABLE public.ai_response_cache ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own cache"
  ON public.ai_response_cache
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cache"
  ON public.ai_response_cache
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cache"
  ON public.ai_response_cache
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cache"
  ON public.ai_response_cache
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_cache_user_key 
  ON public.ai_response_cache(user_id, cache_key);

CREATE INDEX IF NOT EXISTS idx_ai_cache_created 
  ON public.ai_response_cache(created_at);

-- Function to auto-delete old cache entries
CREATE OR REPLACE FUNCTION clean_old_ai_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.ai_response_cache
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Note: In production, set up a cron job to run clean_old_ai_cache() daily
