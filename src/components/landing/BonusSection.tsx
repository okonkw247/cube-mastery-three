import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Download, FileText, Timer, BookOpen, ExternalLink, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface KitResource {
  id: string;
  title: string;
  description: string | null;
  type: string;
  url: string;
}

const fallbackIcon = (i: number) => [FileText, Timer, BookOpen][i % 3];

const BonusSection = React.forwardRef<HTMLElement>((_, ref) => {
  const { t } = useTranslation();
  const [items, setItems] = useState<KitResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("id, title, description, type, url")
        .eq("category", "speed_kit")
        .order("created_at", { ascending: true });

      if (!active) return;
      if (error) {
        console.error("Failed to load Speed Kit:", error);
      } else {
        setItems(data || []);
      }
      setLoading(false);
    };

    load();

    // Real-time updates so admins editing resources show up live on the landing page
    const channel = supabase
      .channel("speed-kit-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "resources", filter: "category=eq.speed_kit" },
        () => load()
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const handleClick = async (item: KitResource) => {
    // Fire-and-forget download/view counter
    try {
      const field = item.type === "pdf" ? "download_count" : "view_count";
      await (supabase.rpc as any)("noop"); // no-op to keep types happy
      await supabase
        .from("resources")
        .update({ [field]: (1 as any) })
        .eq("id", item.id);
    } catch {
      // ignore; counts are nice-to-have
    }
    toast.success(item.type === "pdf" ? "Opening download…" : "Opening resource…");
  };

  return (
    <section ref={ref} className="py-16 sm:py-20 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

      <div className="container mx-auto px-4 sm:px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 sm:mb-8 animate-on-scroll">
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
            <span className="text-xs sm:text-sm font-medium text-primary">{t("landing.bonus.label")}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 animate-on-scroll">
            {t("landing.bonus.title1")} <span className="text-gradient">{t("landing.bonus.titleHighlight")}</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-8 sm:mb-10 md:mb-12 max-w-2xl mx-auto animate-on-scroll">
            {t("landing.bonus.subtitle")}
          </p>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground py-8">Speed Kit coming soon — check back shortly.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-8 sm:mb-10 md:mb-12">
              {items.map((item, index) => {
                const Icon = fallbackIcon(index);
                const isExternal = item.type === "link";
                return (
                  <a
                    key={item.id}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={item.type === "pdf" ? true : undefined}
                    onClick={() => handleClick(item)}
                    className="card-gradient rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-border text-center animate-on-scroll group hover:border-primary/50 hover:-translate-y-0.5 transition-all"
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-sm sm:text-base mb-1.5 sm:mb-2">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-3">{item.description}</p>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                      {isExternal ? (
                        <>
                          Open <ExternalLink className="w-3 h-3" />
                        </>
                      ) : (
                        <>
                          Download <Download className="w-3 h-3" />
                        </>
                      )}
                    </span>
                  </a>
                );
              })}
            </div>
          )}

          <Link to="/auth?mode=signup" className="animate-on-scroll inline-block">
            <Button variant="hero" size="lg" className="gap-2 sm:gap-3 text-sm sm:text-base">
              {t("landing.bonus.getAccess")}
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
});

BonusSection.displayName = "BonusSection";

export default BonusSection;
