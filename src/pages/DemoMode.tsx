import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, TrendingUp, Shield, DollarSign, Clock } from 'lucide-react';
import { useDemoMode, demoModules } from '@/hooks/useDemoMode';

export default function DemoMode() {
  const navigate = useNavigate();
  const { startDemo } = useDemoMode();

  const modules = [
    {
      id: 'overview',
      title: 'Platform Overview',
      description: 'Complete introduction to the tobacco traceability platform',
      icon: TrendingUp,
      color: 'bg-primary/10 text-primary',
      route: '/dashboard',
    },
    {
      id: 'traceability',
      title: 'Traceability & Serialization',
      description: 'Track every product from farm to retail with unique identifiers',
      icon: Shield,
      color: 'bg-blue-500/10 text-blue-500',
      route: '/serialization',
    },
    {
      id: 'logistics',
      title: 'Logistics & Vehicle Tracking',
      description: 'Real-time GPS tracking and route optimization',
      icon: TrendingUp,
      color: 'bg-green-500/10 text-green-500',
      route: '/logistics',
    },
    {
      id: 'compliance',
      title: 'Compliance & Reporting',
      description: 'Automated regulatory compliance and report generation',
      icon: Shield,
      color: 'bg-purple-500/10 text-purple-500',
      route: '/regulatory-reporting',
    },
    {
      id: 'analytics',
      title: 'Business Intelligence',
      description: 'Real-time dashboards and predictive analytics',
      icon: DollarSign,
      color: 'bg-orange-500/10 text-orange-500',
      route: '/bi-reports',
    },
  ];

  const handleStartDemo = (moduleId: string, route: string) => {
    startDemo(moduleId);
    navigate(route);
  };

  const getTotalDuration = (moduleId: string) => {
    const steps = demoModules[moduleId];
    return steps?.reduce((acc, step) => acc + step.duration, 0) || 0;
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl font-bold mb-4">Guided Product Demos</h1>
          <p className="text-lg text-muted-foreground">
            Interactive walkthroughs with AI-powered Q&A. Learn about business impact, compliance value, and ROI for each module.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Play className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Interactive Walkthroughs</h3>
              <p className="text-sm text-muted-foreground">Step-by-step guided tours with real-time highlights</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Business Focus</h3>
              <p className="text-sm text-muted-foreground">ROI, compliance value, and impact metrics</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">AI Assistant</h3>
              <p className="text-sm text-muted-foreground">Ask questions anytime during the demo</p>
            </CardContent>
          </Card>
        </div>

        {/* Demo Modules */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => {
            const Icon = module.icon;
            const steps = demoModules[module.id];
            const duration = getTotalDuration(module.id);
            
            return (
              <Card key={module.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg ${module.color} flex items-center justify-center`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {Math.round(duration / 60)} min
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Includes:</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {steps?.map((step, idx) => (
                        <li key={idx}>• {step.title}</li>
                      ))}
                    </ul>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => handleStartDemo(module.id, module.route)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Demo
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Card */}
        <Card className="bg-muted/50 mt-8">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">How Demo Mode Works</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Navigate through interactive step-by-step guides for each module</li>
              <li>• View business impact, compliance value, and ROI metrics for every feature</li>
              <li>• Use the "Ask AI" button to get instant answers to questions</li>
              <li>• Enable voice narration for hands-free walkthroughs</li>
              <li>• Move at your own pace with previous/next controls</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
