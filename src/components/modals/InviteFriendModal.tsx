import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Plus, X, Send, UserPlus, Check, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface InviteFriendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Invitation {
  id: string;
  invitee_email: string;
  status: string;
  invited_at: string;
}

const InviteFriendModal = ({ open, onOpenChange }: InviteFriendModalProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [emails, setEmails] = useState<string[]>([""]);
  const [isLoading, setIsLoading] = useState(false);
  const [sentInvitations, setSentInvitations] = useState<Invitation[]>([]);

  const addEmailField = () => {
    if (emails.length < 5) {
      setEmails([...emails, ""]);
    }
  };

  const removeEmailField = (index: number) => {
    if (emails.length > 1) {
      const newEmails = emails.filter((_, i) => i !== index);
      setEmails(newEmails);
    }
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSendInvitations = async () => {
    if (!user) {
      toast.error("You must be logged in to send invitations");
      return;
    }

    const validEmails = emails.filter(email => email.trim() && isValidEmail(email.trim()));
    
    if (validEmails.length === 0) {
      toast.error("Please enter at least one valid email address");
      return;
    }

    setIsLoading(true);

    try {
      // Insert invitations into database
      const invitations = validEmails.map(email => ({
        inviter_id: user.id,
        invitee_email: email.trim().toLowerCase(),
        status: 'pending'
      }));

      const { data, error } = await supabase
        .from('friend_invitations')
        .insert(invitations)
        .select();

      if (error) throw error;

      // Send invitation emails
      const { error: emailError } = await supabase.functions.invoke('send-friend-invitation', {
        body: {
          invitations: data,
          inviterName: user.user_metadata?.full_name || user.email?.split('@')[0]
        }
      });

      if (emailError) {
        console.error("Email sending error:", emailError);
        // Don't fail completely if email fails - invitation is still saved
      }

      toast.success(`${validEmails.length} invitation(s) sent successfully!`);
      setEmails([""]);
      setSentInvitations(prev => [...prev, ...data as Invitation[]]);
    } catch (error: any) {
      console.error("Failed to send invitations:", error);
      toast.error(error.message || "Failed to send invitations");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Invite Friends
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Email inputs */}
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">
              Enter email addresses of friends you'd like to invite
            </Label>
            
            {emails.map((email, index) => (
              <div key={index} className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="friend@gmail.com"
                    value={email}
                    onChange={(e) => updateEmail(index, e.target.value)}
                    className="pl-10"
                  />
                </div>
                {emails.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEmailField(index)}
                    className="shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}

            {emails.length < 5 && (
              <Button
                variant="outline"
                size="sm"
                onClick={addEmailField}
                className="w-full gap-2"
              >
                <Plus className="w-4 h-4" />
                Add another email
              </Button>
            )}
          </div>

          {/* Send button */}
          <Button
            onClick={handleSendInvitations}
            disabled={isLoading || emails.every(e => !e.trim())}
            className="w-full gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Invitations
              </>
            )}
          </Button>

          {/* Recent invitations */}
          {sentInvitations.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Recently sent</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {sentInvitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm"
                  >
                    <span className="truncate">{invitation.invitee_email}</span>
                    {getStatusIcon(invitation.status)}
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            Your friends will receive an email invitation to join Cube Mastery.
            They'll need to complete their profile after signing up.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteFriendModal;
