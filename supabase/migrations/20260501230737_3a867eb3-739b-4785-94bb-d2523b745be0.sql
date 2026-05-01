-- Audit log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL,
  admin_email TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
  ON public.admin_audit_log FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert audit log"
  ON public.admin_audit_log FOR INSERT
  WITH CHECK (public.is_admin(auth.uid()) AND admin_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created_at ON public.admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_log_admin_id ON public.admin_audit_log (admin_id);

-- RPC to get user overview with email (admins only)
CREATE OR REPLACE FUNCTION public.get_admin_users_overview()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT,
  subscription_status TEXT,
  is_suspended BOOLEAN,
  total_points INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    u.email::TEXT AS email,
    p.full_name,
    p.avatar_url,
    p.subscription_tier,
    COALESCE(p.subscription_status, 'inactive') AS subscription_status,
    COALESCE(p.is_suspended, false) AS is_suspended,
    COALESCE(p.total_points, 0) AS total_points,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.user_id
  ORDER BY p.created_at DESC;
END;
$$;

-- RPC to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action TEXT,
  p_target_type TEXT DEFAULT NULL,
  p_target_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_email TEXT;
  v_id UUID;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT email INTO v_admin_email FROM auth.users WHERE id = auth.uid();

  INSERT INTO public.admin_audit_log (admin_id, admin_email, action, target_type, target_id, details)
  VALUES (auth.uid(), v_admin_email, p_action, p_target_type, p_target_id, COALESCE(p_details, '{}'::jsonb))
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;