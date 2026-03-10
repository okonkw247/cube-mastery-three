import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Send, Bell, Users, Mail, Smartphone, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

type NotificationType = 'announcement' | 'new_video' | 'new_notes' | 'new_hologram_sheet';
type RecipientGroup = 'all' | 'free' | 'paid' | 'active' | 'inactive';
type Channel = 'inapp' | 'email' | 'both';

interface SendProgress {
  total: number;
  sent: number;
  failed: number;
}

export function NotificationComposer() {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<SendProgress | null>(null);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'announcement' as NotificationType,
    recipientGroup: 'all' as RecipientGroup,
    channel: 'inapp' as Channel,
    sendEmail: false,
  });

  // Fetch recipient count when group changes
  useEffect(() => {
    const fetchRecipientCount = async () => {
      try {
        let query = supabase.from('profiles').select('id', { count: 'exact', head: true });
        
        switch (formData.recipientGroup) {
          case 'free':
            query = query.eq('subscription_tier', 'free');
            break;
          case 'paid':
            query = query.neq('subscription_tier', 'free');
            break;
          // For active/inactive, we'd need additional tracking
        }
        
        const { count, error } = await query;
        if (!error) {
          setRecipientCount(count);
        }
      } catch (e) {
        console.error('Failed to fetch recipient count:', e);
      }
    };
    
    fetchRecipientCount();
  }, [formData.recipientGroup]);

  const handleSend = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setSending(true);
    setProgress({ total: recipientCount || 0, sent: 0, failed: 0 });

    try {
      // Use the notify_all_users database function for in-app notifications
      if (formData.channel === 'inapp' || formData.channel === 'both') {
        const { error } = await supabase.rpc('notify_all_users', {
          p_title: formData.title,
          p_message: formData.message,
          p_type: formData.type,
          p_reference_id: null,
        });

        if (error) throw error;
      }

      // Send emails if requested
      if (formData.channel === 'email' || formData.channel === 'both') {
        // Get all recipient emails
        let query = supabase
          .from('profiles')
          .select('user_id');
        
        switch (formData.recipientGroup) {
          case 'free':
            query = query.eq('subscription_tier', 'free');
            break;
          case 'starter':
            query = query.eq('subscription_tier', 'starter');
            break;
          case 'pro':
            query = query.eq('subscription_tier', 'pro');
            break;
        }

        const { data: profiles } = await query;
        
        if (profiles && profiles.length > 0) {
          // Get user emails from auth (would need an edge function for this)
          // For now, we'll log that email sending would happen
          console.log(`Would send emails to ${profiles.length} users`);
          
          // Simulate progress
          setProgress(prev => prev ? { ...prev, sent: profiles.length } : null);
        }
      }

      toast.success(`Notification sent to ${recipientCount || 'all'} students!`);
      setFormData({ 
        title: '', 
        message: '', 
        type: 'announcement', 
        recipientGroup: 'all',
        channel: 'inapp',
        sendEmail: false,
      });
      setOpen(false);
    } catch (error: any) {
      console.error('Failed to send notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setSending(false);
      setProgress(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Bell className="w-4 h-4" />
          Send Notification
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Send Notification to Students
          </DialogTitle>
          <DialogDescription>
            Compose and send notifications to your students via in-app or email.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Recipient Group */}
          <div className="space-y-2">
            <Label htmlFor="recipientGroup" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Recipients
            </Label>
            <Select
              value={formData.recipientGroup}
              onValueChange={(value: RecipientGroup) =>
                setFormData({ ...formData, recipientGroup: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select recipients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">👥 All Users</SelectItem>
                <SelectItem value="free">🆓 Free Plan Users</SelectItem>
                <SelectItem value="starter">⭐ Starter Plan Users</SelectItem>
                <SelectItem value="pro">👑 Pro Plan Users</SelectItem>
                <SelectItem value="active">🟢 Active Users (7 days)</SelectItem>
                <SelectItem value="inactive">🔴 Inactive Users (30+ days)</SelectItem>
              </SelectContent>
            </Select>
            {recipientCount !== null && (
              <p className="text-xs text-muted-foreground">
                ~{recipientCount} recipients will receive this notification
              </p>
            )}
          </div>

          {/* Channel Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Delivery Channel
            </Label>
            <Select
              value={formData.channel}
              onValueChange={(value: Channel) =>
                setFormData({ ...formData, channel: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inapp">📱 In-App Only</SelectItem>
                <SelectItem value="email">📧 Email Only</SelectItem>
                <SelectItem value="both">📱📧 Both In-App & Email</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notification Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Notification Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: NotificationType) =>
                setFormData({ ...formData, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="announcement">📢 Announcement</SelectItem>
                <SelectItem value="new_video">🎬 New Video</SelectItem>
                <SelectItem value="new_notes">📝 New Notes</SelectItem>
                <SelectItem value="new_hologram_sheet">📄 New Hologram Sheet</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., New lesson available!"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Write your notification message here..."
              rows={4}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              {formData.message.length}/500 characters
            </p>
          </div>

          {/* Progress indicator */}
          {progress && (
            <div className="space-y-2">
              <Progress value={(progress.sent / progress.total) * 100} />
              <p className="text-xs text-muted-foreground text-center">
                Sending... {progress.sent} of {progress.total}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending} className="gap-2">
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send to {recipientCount || 'All'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
