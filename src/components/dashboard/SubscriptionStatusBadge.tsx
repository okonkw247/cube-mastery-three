import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/hooks/useProfile';
import { Loader2, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function SubscriptionStatusBadge() {
  const { t } = useTranslation();
  const { profile, loading, isPaymentPending, isPaymentFailed, isCancelled, isActive } = useProfile();

  if (loading || !profile) return null;

  if (isActive && profile.subscription_tier !== 'free') return null;

  if (isPaymentPending) {
    return (
      <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 flex items-center gap-1">
        <Loader2 className="w-3 h-3 animate-spin" />
        {t('subscription.processing')}
      </Badge>
    );
  }

  if (isPaymentFailed) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" />
        {t('subscription.paymentFailed')}
      </Badge>
    );
  }

  if (isCancelled) {
    return (
      <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        {t('subscription.cancelled')}
      </Badge>
    );
  }

  return null;
}

export function PlanBadge() {
  const { profile, loading, isPro, isFree } = useProfile();

  if (loading || !profile) return null;

  if (isPro) {
    return (
      <Badge className="bg-primary/20 text-primary border-primary/30 flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        Sub 20 Mastery
      </Badge>
    );
  }

  if (isFree) {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        Free
      </Badge>
    );
  }

  return null;
}
