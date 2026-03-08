import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminInviteModal } from '@/components/admin/AdminInviteModal';
import { NotificationComposer } from '@/components/admin/NotificationComposer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';
import { useAdmin } from '@/hooks/useAdmin';

export default function AdminSettings() {
  const { isSuperAdmin } = useAdmin();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const handleSave = () => toast.success('Settings saved');

  return (
    <AdminLayout requiredPermission="manage_settings">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Settings</h1>
            <p className="text-muted-foreground text-sm">Configure platform settings</p>
          </div>
          {isSuperAdmin && (
            <Button onClick={() => setInviteModalOpen(true)} className="gap-2 w-fit" size="sm">
              <UserPlus className="w-4 h-4" />
              Invite Content Admin
            </Button>
          )}
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="branding">Branding</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            {isSuperAdmin && <TabsTrigger value="team">Team</TabsTrigger>}
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Basic platform configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Platform Name</Label><Input defaultValue="Cube Mastery" /></div>
                <div className="flex items-center justify-between">
                  <div><Label>Enable Registration</Label><p className="text-sm text-muted-foreground">Allow new users to sign up</p></div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label>Maintenance Mode</Label><p className="text-sm text-muted-foreground">Temporarily disable the platform</p></div>
                  <Switch />
                </div>
                <Button onClick={handleSave}>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding">
            <Card>
              <CardHeader>
                <CardTitle>Branding</CardTitle>
                <CardDescription>Customize platform appearance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Logo URL</Label><Input placeholder="https://..." /></div>
                <div><Label>Primary Color</Label><Input type="color" defaultValue="#3b82f6" className="w-20 h-10" /></div>
                <Button onClick={handleSave}>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Send notifications and manage email settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <p className="text-sm font-medium mb-2">Broadcast to Students</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Send announcements, updates, or alerts to all registered students.
                  </p>
                  <NotificationComposer />
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div><Label>Welcome Email</Label><p className="text-sm text-muted-foreground">Send welcome email to new users</p></div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div><Label>Streak Reminders</Label><p className="text-sm text-muted-foreground">Remind users about their streak</p></div>
                    <Switch defaultChecked />
                  </div>
                </div>
                <Button onClick={handleSave}>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {isSuperAdmin && (
            <TabsContent value="team">
              <Card>
                <CardHeader>
                  <CardTitle>Team Management</CardTitle>
                  <CardDescription>Manage admin team members</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4 border border-border">
                    <p className="text-sm font-medium mb-2">Invite Content Admins</p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Content admins can manage lessons, resources, and challenges but cannot access financial settings or user management.
                    </p>
                    <Button onClick={() => setInviteModalOpen(true)} variant="outline" className="gap-2">
                      <UserPlus className="w-4 h-4" />
                      Generate Invite Link
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      <AdminInviteModal open={inviteModalOpen} onClose={() => setInviteModalOpen(false)} />
    </AdminLayout>
  );
}
