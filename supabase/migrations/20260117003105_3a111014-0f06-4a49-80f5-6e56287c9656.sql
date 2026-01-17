-- Create friend invitations table
CREATE TABLE public.friend_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_id UUID NOT NULL,
  invitee_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_friend_invitations_email ON public.friend_invitations(invitee_email);
CREATE INDEX idx_friend_invitations_token ON public.friend_invitations(token);
CREATE INDEX idx_friend_invitations_inviter ON public.friend_invitations(inviter_id);

-- Enable RLS
ALTER TABLE public.friend_invitations ENABLE ROW LEVEL SECURITY;

-- Users can see their own sent invitations
CREATE POLICY "Users can view their own sent invitations" 
ON public.friend_invitations 
FOR SELECT 
USING (auth.uid() = inviter_id);

-- Users can create invitations
CREATE POLICY "Users can create invitations" 
ON public.friend_invitations 
FOR INSERT 
WITH CHECK (auth.uid() = inviter_id);

-- Allow public token validation for accepting invites
CREATE POLICY "Anyone can view invitation by token" 
ON public.friend_invitations 
FOR SELECT 
USING (true);

-- Users can update their own invitations (for canceling)
CREATE POLICY "Users can update their own invitations" 
ON public.friend_invitations 
FOR UPDATE 
USING (auth.uid() = inviter_id);