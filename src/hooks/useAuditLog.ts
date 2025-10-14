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

export function useAuditLog() {
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
      // Get client IP and user agent if available
      const ipAddress = window.location.hostname;
      const userAgent = navigator.userAgent;

      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        user_email: user?.email,
        user_role: userRole,
        action,
        resource,
        resource_id: resourceId,
        data_snapshot: dataSnapshot,
        ip_address: ipAddress,
        user_agent: userAgent,
        status,
        error_message: errorMessage,
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  };

  return { logAction };
}
