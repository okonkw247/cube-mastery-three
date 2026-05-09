-- CRITICAL SECURITY FIXES
-- Fixes for vulnerabilities detected by Lovable

-- ============================================
-- 1. FIX: Friend Invitations - Restrict token access
-- ============================================
DROP POLICY IF EXISTS "Anyone can view invitation by token" ON public.friend_invitations;
DROP POLICY IF EXISTS "Users can view own received invitations" ON public.friend_invitations;

-- Only inviter and invitee can view invitations
CREATE POLICY "Users can view own received invitations" 
ON public.friend_invitations 
FOR SELECT 
USING (auth.uid() = inviter_id OR invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- ============================================
-- 2. FIX: Referrals - Only admin/system can update
-- ============================================
DROP POLICY IF EXISTS "System can update referrals" ON public.referrals;
DROP POLICY IF EXISTS "Admins can update referrals" ON public.referrals;

-- Only admins and system can update referrals
CREATE POLICY "Admins can update referrals" 
ON public.referrals 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

-- Only referrer can INSERT their own referrals
DROP POLICY IF EXISTS "System can insert referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can create referrals" ON public.referrals;
CREATE POLICY "Users can create referrals" 
ON public.referrals 
FOR INSERT 
WITH CHECK (auth.uid() = referrer_id OR public.is_admin(auth.uid()));

-- ============================================
-- 3. FIX: XP Events - Only system can insert, admins can view all
-- ============================================
DROP POLICY IF EXISTS "Users can insert their own xp" ON public.xp_events;
DROP POLICY IF EXISTS "System can insert xp events" ON public.xp_events;
DROP POLICY IF EXISTS "Admins can view all xp" ON public.xp_events;

-- Users cannot insert XP, only system can
CREATE POLICY "System can insert xp events" 
ON public.xp_events 
FOR INSERT 
WITH CHECK (false); -- Only SECURITY DEFINER functions can insert

-- Admins can view all XP for moderation
CREATE POLICY "Admins can view all xp" 
ON public.xp_events 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- Users can only view their own XP
-- (This is already correct from original migration)

-- ============================================
-- 4. FIX: Gifts - Restrict token viewing and updates
-- ============================================
DROP POLICY IF EXISTS "System can update gifts" ON public.gifts;
DROP POLICY IF EXISTS "Anyone can view gift by token" ON public.gifts;
DROP POLICY IF EXISTS "Admins can update gifts" ON public.gifts;

-- Only admins can update gifts
CREATE POLICY "Admins can update gifts" 
ON public.gifts 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

-- Only sender can view their sent gifts
-- (Already exists and is correct)
-- Gift recipients should only be able to claim via email link (handled by frontend)

-- ============================================
-- 5. FIX: Avatar Upload - Enforce user ID in path
-- ============================================
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Users can only upload to their own avatar folder: avatars/{user_id}/*
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = 'avatars' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Users can only update their own avatar files
CREATE POLICY "Users can update their own avatar"
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
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[2] = auth.uid()::text
);
