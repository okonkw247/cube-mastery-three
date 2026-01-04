import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminData } from '@/hooks/useAdminData';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Ban, UserCheck, Eye, Download, Users, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserProgress {
  lessonId: string;
  lessonTitle: string;
  completed: boolean;
  watchedSeconds: number;
}

export default function AdminUsers() {
  const { users, fetchUsers, stats } = useAdminData();
  const { suspendUser, getUserProgress, updating } = useAdminUsers();
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(false);

  // Listen for new enrollments
  useEffect(() => {
    const channel = supabase
      .channel('new-enrollments')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'profiles',
      }, (payload) => {
        toast.success(`New student enrolled: ${payload.new.full_name || 'New User'}`, {
          description: 'Click to view details',
          action: {
            label: 'View',
            onClick: () => fetchUsers(),
          },
        });
        fetchUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchUsers]);

  const filteredUsers = users.filter(u => {
    const matchesSearch = !search || u.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchesTier = tierFilter === 'all' || u.subscription_tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const handleSuspend = async (userId: string, suspend: boolean) => {
    await suspendUser(userId, suspend);
    fetchUsers();
    toast.success(suspend ? 'User suspended' : 'User unsuspended');
  };

  const handleViewProgress = async (user: any) => {
    setSelectedUser(user);
    setLoadingProgress(true);
    
    const { data: progressData } = await supabase
      .from('lesson_progress')
      .select('lesson_id, completed, watched_seconds')
      .eq('user_id', user.user_id);
    
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, title');

    if (progressData && lessons) {
      const progressWithTitles = progressData.map(p => ({
        lessonId: p.lesson_id,
        lessonTitle: lessons.find(l => l.id === p.lesson_id)?.title || 'Unknown',
        completed: p.completed,
        watchedSeconds: p.watched_seconds,
      }));
      setUserProgress(progressWithTitles);
    }
    setLoadingProgress(false);
  };

  const exportCSV = () => {
    const headers = ['Name', 'Tier', 'Points', 'Lessons Completed', 'Joined'];
    const rows = filteredUsers.map(u => [
      u.full_name || 'Unknown',
      u.subscription_tier,
      u.total_points,
      u.lessons_completed,
      format(new Date(u.created_at), 'yyyy-MM-dd'),
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Users exported to CSV');
  };

  return (
    <AdminLayout requiredPermission="view_users">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-muted-foreground">
              {users.length} total users • {users.filter(u => u.subscription_tier === 'pro').length} Pro
            </p>
          </div>
          <Button variant="outline" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-xl font-bold">{users.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Today</p>
                <p className="text-xl font-bold">{stats?.activeToday || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pro Users</p>
                <p className="text-xl font-bold">{users.filter(u => u.subscription_tier === 'pro').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Ban className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Suspended</p>
                <p className="text-xl font-bold">{users.filter(u => u.is_suspended).length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Filter tier" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="hidden md:table-cell">Tier</TableHead>
                <TableHead className="hidden lg:table-cell">Lessons</TableHead>
                <TableHead className="hidden lg:table-cell">Points</TableHead>
                <TableHead className="hidden md:table-cell">Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar_url || ''} />
                        <AvatarFallback>{user.full_name?.[0] || '?'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.full_name || 'Unknown'}</p>
                        {user.is_suspended && <Badge variant="destructive" className="text-xs">Suspended</Badge>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={user.subscription_tier === 'pro' ? 'default' : 'secondary'}>{user.subscription_tier}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{user.lessons_completed}</TableCell>
                  <TableCell className="hidden lg:table-cell">{user.total_points}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                    {format(new Date(user.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleViewProgress(user)} title="View Progress">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleSuspend(user.user_id, !user.is_suspended)} disabled={updating}>
                        {user.is_suspended ? <UserCheck className="w-4 h-4 text-green-500" /> : <Ban className="w-4 h-4 text-destructive" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No users found matching your criteria.
          </div>
        )}
      </div>

      {/* User Progress Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={selectedUser?.avatar_url || ''} />
                <AvatarFallback>{selectedUser?.full_name?.[0] || '?'}</AvatarFallback>
              </Avatar>
              <div>
                <p>{selectedUser?.full_name || 'Unknown User'}</p>
                <p className="text-sm font-normal text-muted-foreground">{selectedUser?.subscription_tier} tier</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="text-xl font-bold">{selectedUser?.total_points || 0}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Lessons Completed</p>
                <p className="text-xl font-bold">{selectedUser?.lessons_completed || 0}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Lesson Progress</h3>
              {loadingProgress ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : userProgress.length === 0 ? (
                <p className="text-muted-foreground">No progress yet</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {userProgress.map(p => (
                    <div key={p.lessonId} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <span className="text-sm truncate">{p.lessonTitle}</span>
                      <Badge variant={p.completed ? 'default' : 'secondary'}>
                        {p.completed ? 'Completed' : `${Math.round(p.watchedSeconds / 60)}m watched`}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
