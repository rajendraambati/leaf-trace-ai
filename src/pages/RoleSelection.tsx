import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Leaf, User, Truck, Factory, FileCheck, Shield, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const roles = [
  {
    id: 'farmer',
    name: 'Farmer',
    description: 'Register and manage your farm operations',
    icon: Leaf,
    color: 'text-green-600'
  },
  {
    id: 'field_technician',
    name: 'Field Technician',
    description: 'Support farmers and monitor field operations',
    icon: User,
    color: 'text-blue-600'
  },
  {
    id: 'procurement_agent',
    name: 'Procurement Agent',
    description: 'Manage tobacco procurement and quality grading',
    icon: FileCheck,
    color: 'text-purple-600'
  },
  {
    id: 'logistics_manager',
    name: 'Logistics Manager',
    description: 'Track and manage shipments and transportation',
    icon: Truck,
    color: 'text-orange-600'
  },
  {
    id: 'factory_manager',
    name: 'Factory Manager',
    description: 'Oversee processing and warehouse operations',
    icon: Factory,
    color: 'text-red-600'
  },
  {
    id: 'compliance_auditor',
    name: 'Compliance Auditor',
    description: 'Ensure regulatory compliance and quality standards',
    icon: Shield,
    color: 'text-indigo-600'
  },
  {
    id: 'system_admin',
    name: 'System Administrator',
    description: 'Full system access and user management',
    icon: Settings,
    color: 'text-gray-600'
  }
];

export default function RoleSelection() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
  };

  const handleContinue = () => {
    if (selectedRole) {
      navigate(`/register?role=${selectedRole}`);
    }
  };

  const handleSignIn = () => {
    navigate('/signin');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Leaf className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-2">TobaccoTrace</h1>
          <p className="text-muted-foreground text-lg">Select your role to get started</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            
            return (
              <Card
                key={role.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  isSelected ? 'ring-2 ring-primary shadow-lg' : ''
                }`}
                onClick={() => handleRoleSelect(role.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <Icon className={`h-8 w-8 ${role.color}`} />
                    {isSelected && (
                      <Badge variant="default">Selected</Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl">{role.name}</CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-4">
          <Button
            size="lg"
            className="w-full max-w-md"
            disabled={!selectedRole}
            onClick={handleContinue}
          >
            Continue to Registration
          </Button>
          
          <div className="text-center">
            <span className="text-muted-foreground">Already have an account? </span>
            <Button variant="link" onClick={handleSignIn} className="p-0 h-auto">
              Sign In
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}