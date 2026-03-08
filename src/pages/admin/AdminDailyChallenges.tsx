import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Target, Plus, Trash2, Calendar, Edit3, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DailyChallenge {
  id: string;
  title: string;
  description: string | null;
  xp_reward: number;
  scheduled_date: string | null;
  repeat_weekly: boolean;
  is_active: boolean;
  created_at: string;
}

export default function AdminDailyChallenges() {
  const [challenges, setChallenges] = useState<DailyChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DailyChallenge | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [xpReward, setXpReward] = useState(25);
  const [scheduledDate, setScheduledDate] = useState("");
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchChallenges(); }, []);

  const fetchChallenges = async () => {
    const { data } = await supabase
      .from('daily_challenges' as any)
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setChallenges(data as any[]);
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null); setTitle(""); setDescription(""); setXpReward(25); setScheduledDate(""); setRepeatWeekly(false); setModalOpen(true);
  };

  const openEdit = (c: DailyChallenge) => {
    setEditing(c); setTitle(c.title); setDescription(c.description || ""); setXpReward(c.xp_reward); setScheduledDate(c.scheduled_date || ""); setRepeatWeekly(c.repeat_weekly); setModalOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    const payload: any = { title: title.trim(), description: description.trim() || null, xp_reward: xpReward, scheduled_date: scheduledDate || null, repeat_weekly: repeatWeekly };
    if (editing) {
      await supabase.from('daily_challenges' as any).update(payload).eq('id', editing.id);
      toast.success("Challenge updated");
    } else {
      await supabase.from('daily_challenges' as any).insert(payload);
      toast.success("Challenge created");
    }
    setSaving(false); setModalOpen(false); fetchChallenges();
  };

  const handleToggleActive = async (c: DailyChallenge) => {
    await supabase.from('daily_challenges' as any).update({ is_active: !c.is_active } as any).eq('id', c.id);
    fetchChallenges();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this challenge?")) return;
    await supabase.from('daily_challenges' as any).delete().eq('id', id);
    toast.success("Deleted"); fetchChallenges();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Daily Challenges</h1>
            <p className="text-muted-foreground text-sm">Create and manage daily challenges for students</p>
          </div>
          <Button className="gap-2 w-fit" size="sm" onClick={openNew}><Plus className="w-4 h-4" />New Challenge</Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : challenges.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">No challenges yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {challenges.map((c) => (
              <div key={c.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl bg-card border border-border">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-sm">{c.title}</h3>
                    {!c.is_active && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">Inactive</span>}
                    {c.repeat_weekly && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">Weekly</span>}
                  </div>
                  {c.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.description}</p>}
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>+{c.xp_reward} XP</span>
                    {c.scheduled_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{c.scheduled_date}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch checked={c.is_active} onCheckedChange={() => handleToggleActive(c)} />
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Edit3 className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editing ? "Edit Challenge" : "New Daily Challenge"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Solve the OLL skip pattern" maxLength={200} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Practice this pattern..." maxLength={500} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">XP Reward</label>
                <Input type="number" value={xpReward} onChange={(e) => setXpReward(Number(e.target.value))} min={1} max={500} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Scheduled Date</label>
                <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Repeat Weekly</p><p className="text-xs text-muted-foreground">Show every week</p></div>
              <Switch checked={repeatWeekly} onCheckedChange={setRepeatWeekly} />
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editing ? "Update" : "Create Challenge"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
