import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'super_admin' | 'content_admin' | null;

interface UseUserRoleResult {
  role: AppRole;
  loading: boolean;
  refetch: () => Promise<void>;
  getRedirectPath: () => string;
}

export function useUserRole(userId: string | undefined): UseUserRoleResult {
  const [role, setRole] = useState<AppRole>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async () => {
    if (!userId) {
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Use the database function to get the user's role
      const { data, error } = await supabase.rpc('get_user_role', {
        _user_id: userId
      });

      if (error) {
        console.error('Error fetching user role:', error);
        setRole(null);
      } else {
        setRole(data as AppRole);
      }
    } catch (err) {
      console.error('Error in useUserRole:', err);
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  const getRedirectPath = useCallback((): string => {
    switch (role) {
      case 'super_admin':
        return '/admin';
      case 'content_admin':
        return '/admin/lessons';
      default:
        return '/dashboard';
    }
  }, [role]);

  return {
    role,
    loading,
    refetch: fetchRole,
    getRedirectPath,
  };
}

// Helper function to get role by email (for use before full auth)
export async function getUserRoleByEmail(email: string): Promise<AppRole> {
  try {
    const { data, error } = await supabase.rpc('get_user_role_by_email', {
      _email: email
    });

    if (error) {
      console.error('Error fetching role by email:', error);
      return null;
    }

    return data as AppRole;
  } catch (err) {
    console.error('Error in getUserRoleByEmail:', err);
    return null;
  }
}
