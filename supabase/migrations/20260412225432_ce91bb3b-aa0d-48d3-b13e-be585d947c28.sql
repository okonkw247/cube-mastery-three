
CREATE TABLE public.waitlist (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name text NOT NULL,
  email text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT waitlist_email_unique UNIQUE (email)
);

ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist"
  ON public.waitlist FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view waitlist"
  ON public.waitlist FOR SELECT
  USING (is_admin(auth.uid()));
