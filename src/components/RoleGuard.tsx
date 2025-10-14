import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

export function RoleGuard({ children, allowedRoles, redirectTo = '/' }: RoleGuardProps) {
  const { user, userRole, loading } = useAuth();
  const { toast } = useToast();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Checking permissions...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (userRole && !allowedRoles.includes(userRole)) {
    toast({
      title: 'Access Denied',
      description: 'You do not have permission to access this page.',
      variant: 'destructive',
    });
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
