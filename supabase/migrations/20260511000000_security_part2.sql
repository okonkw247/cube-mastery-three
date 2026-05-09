-- SECURITY FIX - PART 2: Additional Critical Vulnerabilities
-- Focuses on: Video access control, Gifts, Referrals, XP, Certificates, Logs

-- ============================================
-- 1. FIX: Gifts - Restrict all direct inserts/updates
-- ============================================
DROP POLICY IF EXISTS "System can insert gifts" ON public.gifts;
DROP POLICY IF EXISTS "System can update gifts" ON public.gifts;
DROP POLICY IF EXISTS "Only system inserts gifts" ON public.gifts;
DROP POLICY IF EXISTS "Only system updates gifts" ON public.gifts;

-- Only system (edge functions with service role) can insert
CREATE POLICY "Only system inserts gifts"
ON public.gifts
FOR INSERT
WITH CHECK (false);

-- Only system can update gifts
CREATE POLICY "Only system updates gifts"
ON public.gifts
FOR UPDATE
USING (false);

-- ============================================
-- 2. FIX: Referrals - Restrict system-wide inserts/updates
-- ============================================
DROP POLICY IF EXISTS "System can insert referrals" ON public.referrals;
DROP POLICY IF EXISTS "System can update referrals" ON public.referrals;
DROP POLICY IF EXISTS "Admins can update referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can create referrals" ON public.referrals;

-- Only system can insert referrals
CREATE POLICY "Only system inserts referrals"
ON public.referrals
FOR INSERT
WITH CHECK (false);

-- Only system can update referrals
CREATE POLICY "Only system updates referrals"
ON public.referrals
FOR UPDATE
USING (false);

-- ============================================
-- 3. FIX: XP Events - Prevent user self-insertion
-- ============================================
DROP POLICY IF EXISTS "Users can insert their own xp" ON public.xp_events;
DROP POLICY IF EXISTS "System can insert xp events" ON public.xp_events;

-- Only system can insert XP events, not users
CREATE POLICY "Only system inserts xp events"
ON public.xp_events
FOR INSERT
WITH CHECK (false);

-- ============================================
-- 4. FIX: Certificates - Restrict public viewing
-- ============================================
DROP POLICY IF EXISTS "System can insert certificates" ON public.certificates;
DROP POLICY IF EXISTS "Anyone can verify certificates" ON public.certificates;

-- Only system can insert certificates
CREATE POLICY "Only system inserts certificates"
ON public.certificates
FOR INSERT
WITH CHECK (false);

-- Only certificate owner can verify their own
CREATE POLICY "Users can verify own certificates"
ON public.certificates
FOR SELECT
USING (auth.uid() = user_id);

-- ============================================
-- 5. FIX: Activity Logs - Prevent public inserts
-- ============================================
DROP POLICY IF EXISTS "System can insert activity logs" ON public.activity_log;

-- Only system can insert activity logs
CREATE POLICY "Only system inserts activity logs"
ON public.activity_log
FOR INSERT
WITH CHECK (false);

-- ============================================
-- 6. FIX: Webhook Logs - Prevent public inserts
-- ============================================
DROP POLICY IF EXISTS "System can insert webhook logs" ON public.webhook_logs;

-- Only system can insert webhook logs
CREATE POLICY "Only system inserts webhook logs"
ON public.webhook_logs
FOR INSERT
WITH CHECK (false);

-- ============================================
-- 7. FIX: OTP Codes - Prevent public inserts
-- ============================================
DROP POLICY IF EXISTS "Anyone can request OTP codes" ON public.otp_codes;

-- Only system can insert OTP codes
CREATE POLICY "Only system inserts otp codes"
ON public.otp_codes
FOR INSERT
WITH CHECK (false);

-- ============================================
-- 8. FIX: Video Storage - Require authentication
-- ============================================
DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;

-- Only authenticated users can view videos
CREATE POLICY "Authenticated users view videos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'videos');

-- ============================================
-- 9. FIX: Avatars - Enforce user path validation
-- ============================================
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Users can only upload to their own folder
CREATE POLICY "Users upload own avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'avatars' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Users can only update their own avatar files
CREATE POLICY "Users update own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Users can only delete their own avatar files
CREATE POLICY "Users delete own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[2] = auth.uid()::text
);
