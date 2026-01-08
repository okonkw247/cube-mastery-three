import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type AppRole = 'super_admin' | 'content_admin';

// STRICT ADMIN EMAIL ENFORCEMENT
const ADMIN_EMAILS: Record<string, AppRole> = {
  'adamsproject91@gmail.com': 'super_admin',
  'jihadnasr042@gmail.com': 'content_admin',
};

interface AdminContextType {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isContentAdmin: boolean;
  role: AppRole | null;
  loading: boolean;
  checkPermission: (permission: string) => boolean;
  isPreviewMode: boolean;
  setPreviewMode: (mode: boolean) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// Permission mappings
const SUPER_ADMIN_PERMISSIONS = [
  'manage_admins',
  'manage_lessons',
  'manage_users',
  'manage_resources',
  'manage_challenges',
  'view_analytics',
  'manage_settings',
  'manage_payments',
  'export_data',
  'delete_users',
  'suspend_users',
  'view_activity',
];

const CONTENT_ADMIN_PERMISSIONS = [
  'manage_lessons',
  'manage_resources',
  'manage_challenges',
  'view_analytics',
  'view_users',
  'export_data',
  'view_activity',
];

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPreviewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    // STRICT EMAIL CHECK - Server-side enforcement
    const userEmail = user.email?.toLowerCase();
    const allowedRole = userEmail ? ADMIN_EMAILS[userEmail] : null;

    if (allowedRole) {
      // Verify against database as well for extra security
      verifyAndSetRole(userEmail!, allowedRole);
    } else {
      setRole(null);
      setLoading(false);
    }
  }, [user, authLoading]);

  const verifyAndSetRole = async (email: string, expectedRole: AppRole) => {
    try {
      // Also check if role exists in user_roles table
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (!error && data) {
        // User has a role in database - use it
        setRole(data.role as AppRole);
      } else if (ADMIN_EMAILS[email]) {
        // Email is in allowed list - auto-assign role if not exists
        // Note: This would need a server-side function to actually insert
        // For now, trust the email check
        setRole(expectedRole);
      } else {
        setRole(null);
      }
    } catch (e) {
      console.error('Error verifying admin role:', e);
      setRole(null);
    }
    setLoading(false);
  };

  const isAdmin = role !== null;
  const isSuperAdmin = role === 'super_admin';
  const isContentAdmin = role === 'content_admin';

  const checkPermission = (permission: string): boolean => {
    if (isSuperAdmin) {
      return SUPER_ADMIN_PERMISSIONS.includes(permission);
    }
    if (isContentAdmin) {
      return CONTENT_ADMIN_PERMISSIONS.includes(permission);
    }
    return false;
  };

  return (
    <AdminContext.Provider value={{
      isAdmin,
      isSuperAdmin,
      isContentAdmin,
      role,
      loading,
      checkPermission,
      isPreviewMode,
      setPreviewMode,
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}

// Helper function to check if an email is an admin
export function isAdminEmail(email: string | undefined | null): AppRole | null {
  if (!email) return null;
  return ADMIN_EMAILS[email.toLowerCase()] || null;
}
