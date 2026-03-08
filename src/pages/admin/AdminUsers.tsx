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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Ban, UserCheck, CreditCard, RefreshCw, Loader2, Filter, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface WebhookLog {
  id: string;
  event_type: string;
  payload: any;
  processed_at: string;
  status: string;
  error_message: string | null;
}

export default function AdminUsers() {
  const { users, fetchUsers } = useAdminData();
  const { suspendUser, updateUserProfile, updating } = useAdminUsers();
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editPlanOpen, setEditPlanOpen] = useState(false);
  const [newPlan, setNewPlan] = useState('free');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  const filteredUsers = users.filter(u => {
    const matchesSearch = !search || u.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchesTier = tierFilter === 'all' || u.subscription_tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const handleSuspend = async (userId: string, suspend: boolean) => {
    await suspendUser(userId, suspend);
    fetchUsers();
  };

  const fetchWebhookLogs = async () => {
    setLogsLoading(true);
    try {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .order('processed_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setWebhookLogs(data || []);
    } catch (err: any) {
      console.error('Error fetching webhook logs:', err);
      toast.error('Failed to load webhook logs');
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhookLogs();
  }, []);

  // Real-time subscription for webhook logs
  useEffect(() => {
    const channel = supabase
      .channel('webhook-logs-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'webhook_logs',
        },
        (payload) => {
          const newLog = payload.new as WebhookLog;
          setWebhookLogs(prev => [newLog, ...prev].slice(0, 100));
          toast.info(`New webhook: ${newLog.event_type}`, { duration: 3000 });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Get unique event types for filter
  const eventTypes = [...new Set(webhookLogs.map(log => log.event_type))];
  const statuses = [...new Set(webhookLogs.map(log => log.status))];

  // Filter webhook logs
  const filteredLogs = webhookLogs.filter(log => {
    const matchesEvent = eventTypeFilter === 'all' || log.event_type === eventTypeFilter;
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesEvent && matchesStatus;
  });

  const toggleLogExpand = (logId: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  const handleUpdatePlan = async () => {
    if (!selectedUser) return;

    const success = await updateUserProfile(selectedUser.user_id, {
      subscription_tier: newPlan,
    });

    if (success) {
      await grantCourseAccessManually(selectedUser.user_id, newPlan);
      toast.success(`Updated ${selectedUser.full_name || 'user'} to ${newPlan} plan`);
      setEditPlanOpen(false);
      setSelectedUser(null);
      fetchUsers();
    }
  };

  const grantCourseAccessManually = async (userId: string, planType: string) => {
    const limits: Record<string, { start: number; end: number }> = {
      'free': { start: 1, end: 3 },
      'starter': { start: 1, end: 15 },
      'pro': { start: 1, end: 50 },
      'enterprise': { start: 1, end: 50 },
    };

    const { start, end } = limits[planType] || limits['free'];

    await supabase
      .from('course_access')
      .delete()
      .eq('user_id', userId);

    const accessRecords = [];
    for (let section = start; section <= end; section++) {
      accessRecords.push({
        user_id: userId,
        course_section: section,
        has_access: true,
        granted_at: new Date().toISOString(),
      });
    }

    if (accessRecords.length > 0) {
      await supabase.from('course_access').insert(accessRecords);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
      case 'received':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Received</Badge>;
      case 'ignored':
        return <Badge variant="secondary">Ignored</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanBadge = (tier: string) => {
    switch (tier) {
      case 'pro':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Pro</Badge>;
      case 'starter':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Starter</Badge>;
      case 'enterprise':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Enterprise</Badge>;
      default:
        return <Badge variant="secondary">Free</Badge>;
    }
  };

  const getSubscriptionStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case 'payment_pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Processing</Badge>;
      case 'payment_failed':
        return <Badge variant="destructive">Payment Failed</Badge>;
      case 'cancelled':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">Inactive</Badge>;
    }
  };

  const getEventTypeBadge = (eventType: string) => {
    if (eventType.includes('activated') || eventType.includes('went_valid')) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{eventType}</Badge>;
    }
    if (eventType.includes('failed')) {
      return <Badge variant="destructive">{eventType}</Badge>;
    }
    if (eventType.includes('deactivated') || eventType.includes('invalid') || eventType.includes('canceled')) {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">{eventType}</Badge>;
    }
    if (eventType.includes('pending')) {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{eventType}</Badge>;
    }
    if (eventType.includes('renewed') || eventType.includes('succeeded')) {
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">{eventType}</Badge>;
    }
    return <Badge variant="outline">{eventType}</Badge>;
  };

  return (
    <AdminLayout requiredPermission="view_users">
      <div className="space-y-6">
         <div>
          <h1 className="text-xl sm:text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground text-sm">Manage students, subscriptions, and track payments</p>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="webhooks">
              Webhook Logs
              {filteredLogs.length > 0 && (
                <span className="ml-2 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                  {filteredLogs.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search users..." 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  className="pl-10" 
                />
              </div>
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead className="hidden md:table-cell">Plan</TableHead>
                    <TableHead className="hidden lg:table-cell">Status</TableHead>
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
                            {user.is_suspended && (
                              <Badge variant="destructive" className="text-xs">Suspended</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {getPlanBadge(user.subscription_tier)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {getSubscriptionStatusBadge(user.subscription_status || 'inactive')}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{user.total_points}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleSuspend(user.user_id, !user.is_suspended)} 
                            disabled={updating}
                            title={user.is_suspended ? 'Unsuspend User' : 'Suspend User'}
                          >
                            {user.is_suspended 
                              ? <UserCheck className="w-4 h-4 text-green-500" /> 
                              : <Ban className="w-4 h-4 text-destructive" />
                            }
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedUser(user);
                              setNewPlan(user.subscription_tier);
                              setEditPlanOpen(true);
                            }}
                            title="Edit Plan"
                          >
                            <CreditCard className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-semibold">Recent Webhook Events</h2>
                <p className="text-sm text-muted-foreground">Monitor Whop payment webhooks in real-time</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchWebhookLogs}
                  disabled={logsLoading}
                >
                  {logsLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Refresh
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Filters:</span>
              </div>
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Event Types</SelectItem>
                  {eventTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Webhook Configuration</CardTitle>
                <CardDescription>Add this URL to your Whop webhook settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded text-sm break-all">
                    https://gskwncwyzatkecizuvzn.supabase.co/functions/v1/whop-webhook
                  </code>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText('https://gskwncwyzatkecizuvzn.supabase.co/functions/v1/whop-webhook');
                      toast.success('Webhook URL copied!');
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="mt-4 text-sm text-muted-foreground">
                  <p><strong>Plan ID Mapping:</strong></p>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li><code>plan_7NRvNAxpWhOse</code> → Starter (Sections 1-15)</li>
                    <li><code>plan_aeLinh43MkIpm</code> → Pro (Sections 1-50)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="divide-y divide-border">
                {filteredLogs.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    {webhookLogs.length === 0 ? 'No webhook events yet' : 'No events match filters'}
                  </div>
                ) : (
                  filteredLogs.map(log => (
                    <Collapsible key={log.id} open={expandedLogs.has(log.id)}>
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {getEventTypeBadge(log.event_type)}
                            {getStatusBadge(log.status)}
                            <span className="text-sm text-muted-foreground hidden md:inline">
                              {log.error_message || log.payload?.data?.email || log.payload?.data?.user?.email || 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(log.processed_at), 'MMM d, HH:mm:ss')}
                            </span>
                            <CollapsibleTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => toggleLogExpand(log.id)}
                              >
                                {expandedLogs.has(log.id) ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                        </div>
                        <CollapsibleContent>
                          <div className="mt-4 p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground mb-2">Full Payload:</p>
                            <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(log.payload, null, 2)}
                            </pre>
                            {log.error_message && (
                              <div className="mt-2 text-sm text-destructive">
                                <strong>Error:</strong> {log.error_message}
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Plan Dialog */}
      <Dialog open={editPlanOpen} onOpenChange={setEditPlanOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Plan</DialogTitle>
            <DialogDescription>
              Manually update the subscription plan for {selectedUser?.full_name || 'this user'}.
              This will also update their course access.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={newPlan} onValueChange={setNewPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Select plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">Free (Sections 1-3)</SelectItem>
                <SelectItem value="starter">Starter (Sections 1-15)</SelectItem>
                <SelectItem value="pro">Pro (Sections 1-50)</SelectItem>
                <SelectItem value="enterprise">Enterprise (All Access)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPlanOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePlan} disabled={updating}>
              {updating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Update Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
