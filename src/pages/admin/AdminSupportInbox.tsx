import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { Inbox, Send, MessageSquare, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface SupportTicket {
  id: string;
  user_id: string;
  user_email: string;
  subject: string;
  message: string;
  status: string;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
}

const AdminSupportInbox = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "replied" | "closed">("all");

  const fetchTickets = async () => {
    setLoading(true);
    let query = supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;
    if (!error) setTickets(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTickets();
  }, [filter]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("support-tickets-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_tickets" },
        () => fetchTickets()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [filter]);

  const handleReply = async () => {
    if (!selectedTicket || !reply.trim()) return;

    setSending(true);
    try {
      // Update ticket in DB
      const { error: updateError } = await supabase
        .from("support_tickets")
        .update({
          admin_reply: reply.trim(),
          replied_by: user?.id,
          replied_at: new Date().toISOString(),
          status: "replied",
        })
        .eq("id", selectedTicket.id);

      if (updateError) throw updateError;

      // Send email reply via edge function
      const { error: emailError } = await supabase.functions.invoke("reply-support-ticket", {
        body: { ticketId: selectedTicket.id, reply: reply.trim() },
      });

      if (emailError) {
        console.error("Email send failed:", emailError);
        toast.warning("Reply saved but email delivery failed");
      } else {
        toast.success("Reply sent successfully!");
      }

      setReply("");
      setSelectedTicket(null);
      fetchTickets();
    } catch (error: any) {
      toast.error("Failed to send reply");
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  const handleClose = async (ticketId: string) => {
    await supabase
      .from("support_tickets")
      .update({ status: "closed" })
      .eq("id", ticketId);
    toast.success("Ticket closed");
    fetchTickets();
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-yellow-500/20 text-yellow-400";
      case "replied": return "bg-blue-500/20 text-blue-400";
      case "closed": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const openCount = tickets.filter(t => t.status === "open").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Inbox className="w-6 h-6 text-primary" />
              Support Inbox
              {openCount > 0 && (
                <Badge variant="destructive" className="ml-2">{openCount} open</Badge>
              )}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage support tickets from users
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {(["all", "open", "replied", "closed"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ticket list */}
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))
            ) : tickets.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Inbox className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No tickets found</p>
              </div>
            ) : (
              tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => { setSelectedTicket(ticket); setReply(ticket.admin_reply || ""); }}
                  className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                    selectedTicket?.id === ticket.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{ticket.subject}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{ticket.user_email}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{ticket.message}</p>
                    </div>
                    <Badge className={`shrink-0 text-[10px] ${statusColor(ticket.status)}`}>
                      {ticket.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {format(new Date(ticket.created_at), "MMM d, yyyy h:mm a")}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Reply panel */}
          <div className="border border-border rounded-xl p-5">
            {selectedTicket ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">{selectedTicket.subject}</h3>
                  <p className="text-xs text-muted-foreground">{selectedTicket.user_email}</p>
                </div>

                <div className="bg-secondary/50 rounded-lg p-4">
                  <p className="text-sm whitespace-pre-wrap">{selectedTicket.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {format(new Date(selectedTicket.created_at), "MMM d, yyyy h:mm a")}
                  </p>
                </div>

                {selectedTicket.admin_reply && (
                  <div className="bg-primary/5 border-l-2 border-primary rounded-lg p-4">
                    <p className="text-xs font-medium text-primary mb-1 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      Your Reply
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{selectedTicket.admin_reply}</p>
                    {selectedTicket.replied_at && (
                      <p className="text-[10px] text-muted-foreground mt-2">
                        {format(new Date(selectedTicket.replied_at), "MMM d, yyyy h:mm a")}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Textarea
                    placeholder="Type your reply..."
                    rows={4}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleReply}
                      disabled={sending || !reply.trim()}
                      className="gap-2"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {sending ? "Sending..." : "Send Reply"}
                    </Button>
                    {selectedTicket.status !== "closed" && (
                      <Button
                        variant="outline"
                        onClick={() => handleClose(selectedTicket.id)}
                        className="gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Close Ticket
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm">Select a ticket to reply</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSupportInbox;
