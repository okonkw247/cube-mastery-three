import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/hooks/useProfile';
import { Loader2, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function SubscriptionStatusBadge() {
  const { t } = useTranslation();
  const { profile, loading, isPaymentPending, isPaymentFailed, isCancelled, isActive } = useProfile();

  if (loading || !profile) return null;

  // Only show badge for non-normal statuses
  if (isActive && profile.subscription_tier !== 'free') {
    return null; // Active paid subscription - no badge needed
  }

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
  const { t } = useTranslation();
  const { profile, loading, isPro, isStarter, isFree } = useProfile();

  if (loading || !profile) return null;

  if (profile.subscription_tier === 'enterprise') {
    return (
      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        Enterprise
      </Badge>
    );
  }

  if (isPro) {
    return (
      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        Pro
      </Badge>
    );
  }

  if (isStarter) {
    return (
      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        Starter
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
