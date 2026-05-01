import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, RefreshCw, Search, Download } from "lucide-react";
import { format } from "date-fns";
import { logAdminAction } from "@/lib/auditLog";
import { toast } from "sonner";

interface AuditEntry {
  id: string;
  admin_id: string;
  admin_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

const actionLabel = (a: string) =>
  a
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const actionColor = (a: string) => {
  if (a.startsWith("view_")) return "bg-blue-500/15 text-blue-400 border-blue-500/30";
  if (a.includes("suspend")) return "bg-red-500/15 text-red-400 border-red-500/30";
  if (a.includes("update") || a.includes("plan")) return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  return "bg-primary/15 text-primary border-primary/30";
};

const AdminAuditLog = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchEntries = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("admin_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      toast.error("Failed to load audit log");
      console.error(error);
    } else {
      setEntries((data as AuditEntry[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
    logAdminAction("view_audit_log_page");
  }, []);

  const filtered = entries.filter((e) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      e.action.toLowerCase().includes(term) ||
      e.admin_email?.toLowerCase().includes(term) ||
      e.target_id?.toLowerCase().includes(term) ||
      e.target_type?.toLowerCase().includes(term)
    );
  });

  const exportCSV = () => {
    if (!entries.length) return toast.info("Nothing to export");
    const header = "Timestamp,Admin,Action,Target Type,Target ID,Details\n";
    const rows = entries
      .map((e) =>
        [
          format(new Date(e.created_at), "yyyy-MM-dd HH:mm:ss"),
          e.admin_email ?? e.admin_id,
          e.action,
          e.target_type ?? "",
          e.target_id ?? "",
          JSON.stringify(e.details ?? {}),
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `admin-audit-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Exported audit log");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-primary" />
              Admin Audit Log
            </h1>
            <p className="text-muted-foreground mt-1">
              {entries.length} {entries.length === 1 ? "entry" : "entries"}, most recent first.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchEntries} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh
            </Button>
            <Button size="sm" onClick={exportCSV} className="gap-2">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search action, admin or target…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              {entries.length === 0 ? "No audit entries yet." : "No matches."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">When</th>
                    <th className="px-4 py-3 font-medium">Admin</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                    <th className="px-4 py-3 font-medium">Target</th>
                    <th className="px-4 py-3 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr key={e.id} className="border-t border-border hover:bg-muted/30 align-top">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {format(new Date(e.created_at), "MMM d, HH:mm:ss")}
                      </td>
                      <td className="px-4 py-3 truncate max-w-[200px]">
                        {e.admin_email ?? e.admin_id}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={actionColor(e.action)}>
                          {actionLabel(e.action)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {e.target_type ? (
                          <span>
                            {e.target_type}
                            {e.target_id ? ` · ${e.target_id.slice(0, 8)}…` : ""}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-md">
                        {e.details && Object.keys(e.details).length > 0 ? (
                          <pre className="whitespace-pre-wrap break-words">
                            {JSON.stringify(e.details, null, 0)}
                          </pre>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAuditLog;
