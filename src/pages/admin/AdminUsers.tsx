import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminData } from '@/hooks/useAdminData';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Ban, UserCheck, Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminUsers() {
  const { users, fetchUsers } = useAdminData();
  const { suspendUser, updating } = useAdminUsers();
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');

  const filteredUsers = users.filter(u => {
    const matchesSearch = !search || u.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchesTier = tierFilter === 'all' || u.subscription_tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const handleSuspend = async (userId: string, suspend: boolean) => {
    await suspendUser(userId, suspend);
    fetchUsers();
  };

  return (
    <AdminLayout requiredPermission="view_users">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage students and track progress</p>
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
      </div>
    </AdminLayout>
  );
}
