/*
  # Fix Authentication System and Create Admin User
  
  1. Critical Fixes
    - Create trigger to auto-create public.users records when auth.users are created
    - Create admin user account (ironzola@gmail.com)
    - Ensure password_hash is not used (Supabase Auth handles this)
    
  2. New Functions
    - `handle_new_user()` - Automatically creates public.users record
    
  3. Security
    - Trigger runs with SECURITY DEFINER
    - Only creates user records, doesn't expose passwords
*/

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert into public.users table
  INSERT INTO public.users (
    id,
    email,
    full_name,
    is_admin,
    is_active,
    plan,
    subscription_tier,
    email_verified,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    false,  -- Default not admin
    true,   -- Active by default
    'TRIAL',
    'Free',
    NEW.email_confirmed_at IS NOT NULL,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create admin user (ironzola@gmail.com)
-- First, we need to insert into auth.users, then the trigger will create the public.users record
DO $$
DECLARE
  user_id uuid;
BEGIN
  -- Check if user already exists in auth.users
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = 'ironzola@gmail.com';
  
  IF user_id IS NULL THEN
    -- Create new user ID
    user_id := gen_random_uuid();
    
    -- Insert into auth.users
    -- Note: Password will need to be set via Supabase Dashboard or reset password flow
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_current,
      email_change_token_new
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      user_id,
      'authenticated',
      'authenticated',
      'ironzola@gmail.com',
      crypt('Surgly2024!Admin', gen_salt('bf')),  -- Temporary password
      NOW(),
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
    
    -- The trigger will create the public.users record
    -- Now update it to be admin
    UPDATE public.users
    SET 
      is_admin = true,
      plan = 'AGENCY',
      subscription_tier = 'Agency',
      full_name = 'SURGLY Admin'
    WHERE id = user_id;
    
    RAISE NOTICE 'Admin user created with ID: %', user_id;
  ELSE
    -- User exists, just ensure public.users record exists and is admin
    INSERT INTO public.users (
      id,
      email,
      full_name,
      is_admin,
      is_active,
      plan,
      subscription_tier,
      email_verified,
      created_at,
      updated_at
    )
    VALUES (
      user_id,
      'ironzola@gmail.com',
      'SURGLY Admin',
      true,
      true,
      'AGENCY',
      'Agency',
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) 
    DO UPDATE SET
      is_admin = true,
      plan = 'AGENCY',
      subscription_tier = 'Agency',
      full_name = 'SURGLY Admin',
      is_active = true;
      
    RAISE NOTICE 'Admin user updated with ID: %', user_id;
  END IF;
END $$;

-- Verify the setup
DO $$
DECLARE
  user_count int;
  admin_count int;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.users WHERE email = 'ironzola@gmail.com';
  SELECT COUNT(*) INTO admin_count FROM public.users WHERE email = 'ironzola@gmail.com' AND is_admin = true;
  
  RAISE NOTICE 'Users with email ironzola@gmail.com: %', user_count;
  RAISE NOTICE 'Admin users with email ironzola@gmail.com: %', admin_count;
  
  IF user_count = 0 THEN
    RAISE EXCEPTION 'Failed to create admin user!';
  END IF;
  
  IF admin_count = 0 THEN
    RAISE EXCEPTION 'Failed to set admin privileges!';
  END IF;
END $$;
