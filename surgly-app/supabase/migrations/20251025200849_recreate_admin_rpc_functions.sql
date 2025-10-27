/*
  # Recreate Admin RPC Functions

  1. Drop Existing Functions
    - Drop `get_all_users_admin()` if exists
    - Drop `update_user_admin()` if exists
    
  2. Recreate Functions
    - `get_all_users_admin()` - Fetch all users with explicit columns
    - `update_user_admin()` - Update user data with admin privileges
    
  3. Security
    - Functions require admin role
    - Explicit column selection prevents 500 errors
*/

-- Drop existing functions
DROP FUNCTION IF EXISTS get_all_users_admin();
DROP FUNCTION IF EXISTS update_user_admin(uuid, jsonb);

-- Function to get all users for admin panel (explicit columns only)
CREATE OR REPLACE FUNCTION get_all_users_admin()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role text,
  is_active boolean,
  usage_limit integer,
  subscription_status text,
  subscription_tier text,
  trial_ends_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  banned_at timestamptz,
  banned_reason text,
  notes text
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Return users with explicit columns
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.is_active,
    u.usage_limit,
    u.subscription_status,
    u.subscription_tier,
    u.trial_ends_at,
    u.created_at,
    u.updated_at,
    u.banned_at,
    u.banned_reason,
    u.notes
  FROM users u
  ORDER BY u.created_at DESC;
END;
$$;

-- Function to update user as admin
CREATE OR REPLACE FUNCTION update_user_admin(
  target_user_id uuid,
  updates jsonb
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  current_user_role text;
BEGIN
  -- Get current user's role
  SELECT role INTO current_user_role
  FROM users
  WHERE id = auth.uid();

  -- Check if current user is admin
  IF current_user_role IS NULL OR current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Update user with provided fields
  UPDATE users
  SET
    is_active = COALESCE((updates->>'is_active')::boolean, is_active),
    banned_at = CASE 
      WHEN updates ? 'banned_at' THEN (updates->>'banned_at')::timestamptz
      ELSE banned_at
    END,
    banned_reason = COALESCE(updates->>'banned_reason', banned_reason),
    notes = COALESCE(updates->>'notes', notes),
    role = COALESCE(updates->>'role', role),
    usage_limit = COALESCE((updates->>'usage_limit')::integer, usage_limit),
    subscription_status = COALESCE(updates->>'subscription_status', subscription_status),
    subscription_tier = COALESCE(updates->>'subscription_tier', subscription_tier),
    updated_at = now()
  WHERE id = target_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_all_users_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_admin(uuid, jsonb) TO authenticated;
