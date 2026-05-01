import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Search, Users } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface WaitlistEntry {
  id: string;
  first_name: string;
  email: string;
  created_at: string;
}

const AdminWaitlist = () => {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("waitlist")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        toast.error("Failed to load waitlist");
      } else {
        setEntries(data || []);
      }
      setLoading(false);
    };
    fetchEntries();
  }, []);

  const filtered = entries.filter(
    (e) =>
      e.first_name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase())
  );

  const exportCSV = () => {
    if (!entries.length) {
      toast.info("Nothing to export");
      return;
    }
    const header = "First Name,Email,Joined At\n";
    const rows = entries
      .map(
        (e) =>
          `"${e.first_name.replace(/"/g, '""')}","${e.email}","${format(
            new Date(e.created_at),
            "yyyy-MM-dd HH:mm:ss"
          )}"`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `waitlist-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to CSV");
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="w-7 h-7 text-primary" />
              Waitlist
            </h1>
            <p className="text-muted-foreground mt-1">
              {entries.length} {entries.length === 1 ? "signup" : "signups"} so far
            </p>
          </div>
          <Button onClick={exportCSV} className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              {entries.length === 0 ? "No signups yet." : "No matches for your search."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">First Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr key={e.id} className="border-t border-border hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{e.first_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{e.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {format(new Date(e.created_at), "MMM d, yyyy · HH:mm")}
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

export default AdminWaitlist;
