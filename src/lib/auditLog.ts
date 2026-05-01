import { supabase } from "@/integrations/supabase/client";

/**
 * Record an admin action to the audit log.
 * Fails silently — auditing should never break the UI flow.
 */
export async function logAdminAction(
  action: string,
  options: {
    targetType?: string | null;
    targetId?: string | null;
    details?: Record<string, unknown>;
  } = {}
) {
  try {
    await (supabase as any).rpc("log_admin_action", {
      p_action: action,
      p_target_type: options.targetType ?? null,
      p_target_id: options.targetId ?? null,
      p_details: options.details ?? {},
    });
  } catch (e) {
    console.error("[audit] failed to log action", action, e);
  }
}
