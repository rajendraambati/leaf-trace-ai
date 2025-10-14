import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface AuditLogParams {
  action: string;
  resource: string;
  resourceId?: string;
  dataSnapshot?: any;
  status?: 'success' | 'error';
  errorMessage?: string;
}

export const useAuditLog = () => {
  const { user, userRole } = useAuth();

  const logAction = async ({
    action,
    resource,
    resourceId,
    dataSnapshot,
    status = 'success',
    errorMessage,
  }: AuditLogParams) => {
    try {
      const { error } = await supabase.from('audit_logs').insert({
        user_id: user?.id,
        user_email: user?.email,
        user_role: userRole,
        action,
        resource,
        resource_id: resourceId,
        data_snapshot: dataSnapshot,
        status,
        error_message: errorMessage,
      });

      if (error) {
        console.error('Failed to log audit event:', error);
      }
    } catch (error) {
      console.error('Error logging audit event:', error);
    }
  };

  return { logAction };
};
