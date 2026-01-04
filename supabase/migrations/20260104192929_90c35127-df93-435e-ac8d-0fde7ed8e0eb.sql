-- Create the missing validate_invite_token function
CREATE OR REPLACE FUNCTION public.validate_invite_token(invite_token text)
RETURNS TABLE (
  id uuid,
  role text,
  email text,
  expires_at timestamptz,
  used_at timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate token format first (should be 64 hex chars)
  IF length(invite_token) != 64 THEN
    RETURN;
  END IF;
  
  -- Return the invite if valid token
  RETURN QUERY
  SELECT 
    ai.id,
    ai.role::text,
    ai.email,
    ai.expires_at,
    ai.used_at,
    ai.created_at
  FROM admin_invites ai
  WHERE ai.token = invite_token
  LIMIT 1;
END;
$$;

-- Update handle_new_user with input validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
BEGIN
  -- Extract and validate full_name
  v_full_name := TRIM(COALESCE(new.raw_user_meta_data ->> 'full_name', ''));
  
  -- Enforce length limit (max 100 characters)
  IF LENGTH(v_full_name) > 100 THEN
    v_full_name := SUBSTRING(v_full_name, 1, 100);
  END IF;
  
  -- Only insert if user_id doesn't exist (prevent duplicates)
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (new.id, v_full_name)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN new;
END;
$$;