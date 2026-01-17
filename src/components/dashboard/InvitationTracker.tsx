import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { UserPlus, Check, Clock, Mail, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";

interface Invitation {
  id: string;
  invitee_email: string;
  status: string;
  invited_at: string;
  accepted_at: string | null;
}

interface InvitationTrackerProps {
  onInviteClick: () => void;
}

export const InvitationTracker = ({ onInviteClick }: InvitationTrackerProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvitations = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('friend_invitations')
        .select('*')
        .eq('inviter_id', user.id)
        .order('invited_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [user]);

  const pendingCount = invitations.filter(i => i.status === 'pending').length;
  const acceptedCount = invitations.filter(i => i.status === 'accepted').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Mail className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'accepted':
        return t('invitations.accepted');
      case 'pending':
        return t('invitations.pending');
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="card-gradient rounded-2xl p-4 sm:p-6 border border-border h-full">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="font-semibold text-sm sm:text-base flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            {t('invitations.title')}
          </h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="card-gradient rounded-2xl p-4 sm:p-6 border border-border h-full">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h2 className="font-semibold text-sm sm:text-base flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" />
          {t('invitations.title')}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onInviteClick}
          className="text-xs sm:text-sm text-primary hover:text-primary/80"
        >
          <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
          {t('invitations.sendNew')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-primary">{pendingCount}</p>
          <p className="text-xs text-muted-foreground">{t('invitations.pending')}</p>
        </div>
        <div className="bg-secondary/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-500">{acceptedCount}</p>
          <p className="text-xs text-muted-foreground">{t('invitations.accepted')}</p>
        </div>
      </div>

      {/* Invitation List */}
      {invitations.length === 0 ? (
        <div className="text-center py-6">
          <UserPlus className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">{t('invitations.noInvitations')}</p>
          <Button variant="outline" size="sm" onClick={onInviteClick}>
            {t('invitations.inviteNow')}
          </Button>
        </div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {invitations.slice(0, 5).map((invitation) => (
            <div
              key={invitation.id}
              className="flex items-center justify-between p-2 sm:p-3 bg-secondary/30 rounded-lg"
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                {getStatusIcon(invitation.status)}
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm truncate">{invitation.invitee_email}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {format(new Date(invitation.invited_at), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
              <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full ${
                invitation.status === 'accepted' 
                  ? 'bg-green-500/20 text-green-500' 
                  : 'bg-yellow-500/20 text-yellow-500'
              }`}>
                {getStatusText(invitation.status)}
              </span>
            </div>
          ))}
          {invitations.length > 5 && (
            <p className="text-xs text-muted-foreground text-center pt-2">
              +{invitations.length - 5} {t('invitations.more')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default InvitationTracker;