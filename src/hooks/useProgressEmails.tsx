import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useProfile } from "./useProfile";

/**
 * Sends progress-based emails when lesson milestones are hit.
 * Call checkAndSendProgressEmail(completedCount) after marking a lesson complete.
 */
export function useProgressEmails() {
  const { user } = useAuth();
  const { profile } = useProfile();

  const checkAndSendProgressEmail = useCallback(
    async (completedCount: number) => {
      if (!user?.email) return;
      const name = profile?.full_name || user.email.split("@")[0];
      const tier = profile?.subscription_tier || "free";

      try {
        // First lesson completed
        if (completedCount === 1) {
          await supabase.functions.invoke("send-progress-email", {
            body: { type: "first_lesson", email: user.email, name },
          });
          return;
        }

        // Every 4-5 lessons milestone
        if (completedCount > 1 && completedCount % 4 === 0) {
          await supabase.functions.invoke("send-progress-email", {
            body: {
              type: "milestone",
              email: user.email,
              name,
              data: { completed: completedCount },
            },
          });
          return;
        }

        // Free user completed all free lessons — send sales email
        if (tier === "free") {
          const { count } = await supabase
            .from("lessons")
            .select("id", { count: "exact", head: true })
            .eq("is_free", true)
            .eq("status", "published");

          if (count && completedCount >= count) {
            const emailKey = `upsell_sent_${user.id}`;
            if (!localStorage.getItem(emailKey)) {
              await supabase.functions.invoke("send-progress-email", {
                body: { type: "free_upsell", email: user.email, name },
              });
              localStorage.setItem(emailKey, "true");
            }
          }
        }
      } catch (err) {
        console.error("Progress email error:", err);
      }
    },
    [user, profile]
  );

  return { checkAndSendProgressEmail };
}
