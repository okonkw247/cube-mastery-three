import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminData } from '@/hooks/useAdminData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAnalytics() {
  const { stats, users } = useAdminData();

  const completionData = [
    { name: 'Completed', value: stats.lessonsCompleted },
    { name: 'In Progress', value: stats.lessonsUploaded * stats.totalStudents - stats.lessonsCompleted },
  ];

  const tierData = [
    { name: 'Free', count: users.filter(u => u.subscription_tier === 'free').length },
    { name: 'Pro', count: users.filter(u => u.subscription_tier === 'pro').length },
  ];

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted))'];

  const exportCSV = () => {
    const headers = ['Name', 'Tier', 'Lessons Completed', 'Points', 'Joined'];
    const rows = users.map(u => [u.full_name, u.subscription_tier, u.lessons_completed, u.total_points, u.created_at]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users-report.csv';
    a.click();
    toast.success('Report exported');
  };

  return (
    <AdminLayout requiredPermission="view_analytics">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Analytics</h1>
            <p className="text-muted-foreground text-sm">Track platform performance</p>
          </div>
          <Button onClick={exportCSV} size="sm" className="w-fit"><Download className="w-4 h-4 mr-2" />Export CSV</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl p-6 border border-border">
            <h2 className="font-semibold mb-4">User Distribution</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tierData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border">
            <h2 className="font-semibold mb-4">Lesson Completion</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={completionData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value" label>
                    {completionData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
