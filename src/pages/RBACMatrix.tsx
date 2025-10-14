import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Shield, CheckCircle, XCircle, Users, Database, Activity, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Permission {
  id: string;
  role: string;
  resource: string;
  action: string;
  allowed: boolean;
}

const ROLES = ['admin', 'auditor', 'technician', 'farmer'];
const RESOURCES = [
  { name: 'Users', key: 'users', icon: Users },
  { name: 'Farmers', key: 'farmers', icon: Users },
  { name: 'Procurement', key: 'procurement', icon: Package },
  { name: 'Logistics', key: 'logistics', icon: Activity },
  { name: 'Warehouse', key: 'warehouse', icon: Database },
  { name: 'Processing', key: 'processing', icon: Activity },
  { name: 'Compliance', key: 'compliance', icon: Shield },
  { name: 'IoT Devices', key: 'iot_devices', icon: Activity },
  { name: 'Analytics', key: 'analytics', icon: Activity },
  { name: 'AI Grading', key: 'ai_grading', icon: Activity },
];

const ACTIONS = ['create', 'read', 'update', 'delete', 'use', 'access'];

export default function RBACMatrix() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('*')
        .order('role', { ascending: true })
        .order('resource', { ascending: true });

      if (error) throw error;
      setPermissions(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (role: string, resource: string, action: string): boolean => {
    return permissions.some(
      p => p.role === role && p.resource === resource && p.action === action && p.allowed
    );
  };

  const getRoleColor = (role: string): string => {
    const colors: Record<string, string> = {
      admin: 'bg-red-500',
      auditor: 'bg-blue-500',
      technician: 'bg-green-500',
      farmer: 'bg-yellow-500',
    };
    return colors[role] || 'bg-gray-500';
  };

  const getRoleDescription = (role: string): string => {
    const descriptions: Record<string, string> = {
      admin: 'Full system access and management capabilities',
      auditor: 'Read-only access with compliance management',
      technician: 'Field operations and farmer registration',
      farmer: 'Limited access to own data and procurement history',
    };
    return descriptions[role] || '';
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading permissions matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Role-Based Access Control Matrix</h1>
          <p className="text-muted-foreground">Comprehensive permissions overview for all roles</p>
        </div>
      </div>

      {/* Role Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {ROLES.map((role) => (
          <Card key={role}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getRoleColor(role)}`} />
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </CardTitle>
              <CardDescription className="text-xs">
                {getRoleDescription(role)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Permissions: {permissions.filter(p => p.role === role && p.allowed).length}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permissions Matrix by Resource */}
      {RESOURCES.map((resource) => {
        const Icon = resource.icon;
        const resourcePermissions = permissions.filter(p => p.resource === resource.key);
        
        if (resourcePermissions.length === 0) return null;

        return (
          <Card key={resource.key}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon className="h-5 w-5" />
                {resource.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    {ACTIONS.map(action => (
                      <TableHead key={action} className="text-center capitalize">
                        {action}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ROLES.map((role) => (
                    <TableRow key={role}>
                      <TableCell>
                        <Badge className={getRoleColor(role)}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </Badge>
                      </TableCell>
                      {ACTIONS.map((action) => {
                        const allowed = hasPermission(role, resource.key, action);
                        return (
                          <TableCell key={action} className="text-center">
                            {allowed ? (
                              <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-gray-300 mx-auto" />
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}

      {/* API Access Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            API Access Permissions
          </CardTitle>
          <CardDescription>
            REST API endpoint access by role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>API Endpoint</TableHead>
                {ROLES.map(role => (
                  <TableHead key={role} className="text-center capitalize">
                    {role}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {['api_all', 'api_farmer', 'api_procurement', 'api_logistics', 'api_warehouse', 'api_processing', 'api_compliance', 'api_analytics', 'api_iot'].map((api) => (
                <TableRow key={api}>
                  <TableCell className="font-medium">
                    {api.replace('api_', '').replace('_', ' ').toUpperCase()}
                  </TableCell>
                  {ROLES.map((role) => {
                    const allowed = hasPermission(role, api, 'access');
                    return (
                      <TableCell key={role} className="text-center">
                        {allowed ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-300 mx-auto" />
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Legend</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Permission granted</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-gray-300" />
            <span>Permission denied</span>
          </div>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Farmers can only access their own data. All other roles have broader access based on the permissions shown above.
              Row Level Security (RLS) policies enforce these permissions at the database level.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
