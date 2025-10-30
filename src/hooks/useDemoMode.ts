import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DemoStep {
  id: string;
  title: string;
  description: string;
  businessImpact: string;
  complianceValue: string;
  roi: string;
  route?: string;
  highlights?: string[];
  duration: number;
}

export const demoModules: Record<string, DemoStep[]> = {
  overview: [
    {
      id: 'intro',
      title: 'Platform Overview',
      description: 'Complete tobacco traceability solution from farm to retail with real-time visibility.',
      businessImpact: 'Reduce supply chain losses by 25%, improve delivery accuracy by 40%',
      complianceValue: 'Meet FSSAI, state-specific regulations, and international standards',
      roi: '3-6 months payback period through reduced losses and compliance automation',
      route: '/dashboard',
      duration: 60,
    },
  ],
  traceability: [
    {
      id: 'serialization',
      title: 'Serialization & Track-Trace',
      description: 'Unique identifiers for every product unit, enabling complete journey tracking.',
      businessImpact: 'Eliminate counterfeiting, enable instant recalls, improve brand protection',
      complianceValue: 'FDA DSCSA compliance, EU FMD readiness, full audit trail',
      roi: 'Save $500K+ annually in counterfeit prevention and recall costs',
      route: '/serialization',
      highlights: ['QR code generation', 'Batch tracking', 'Movement history'],
      duration: 90,
    },
  ],
  logistics: [
    {
      id: 'vehicle-tracking',
      title: 'Real-Time Vehicle Tracking',
      description: 'GPS tracking, route optimization, and live ETAs for all shipments.',
      businessImpact: 'Reduce fuel costs by 15%, improve on-time delivery to 95%+',
      complianceValue: 'Temperature monitoring, chain-of-custody documentation',
      roi: 'Save $200K+ annually in logistics optimization',
      route: '/logistics',
      highlights: ['Live GPS', 'Route optimization', 'Driver management'],
      duration: 90,
    },
  ],
  compliance: [
    {
      id: 'regulatory',
      title: 'Compliance & Reporting',
      description: 'Automated regulatory report generation and submission.',
      businessImpact: 'Reduce compliance team workload by 70%, eliminate manual errors',
      complianceValue: 'Automatic FSSAI, GST, state-specific reporting with audit trails',
      roi: 'Save $150K+ annually in compliance operations',
      route: '/regulatory-reporting',
      highlights: ['Auto-generation', 'Multi-format export', 'Submission tracking'],
      duration: 90,
    },
  ],
  analytics: [
    {
      id: 'bi-reports',
      title: 'Business Intelligence',
      description: 'Real-time dashboards and predictive analytics for decision-making.',
      businessImpact: 'Improve forecast accuracy by 35%, reduce stockouts by 40%',
      complianceValue: 'Audit-ready reports, data integrity monitoring',
      roi: 'Increase revenue by 10-15% through better inventory management',
      route: '/bi-reports',
      highlights: ['Custom dashboards', 'Predictive analytics', 'Export capabilities'],
      duration: 90,
    },
  ],
};

export const useDemoMode = () => {
  const [isActive, setIsActive] = useState(false);
  const [currentModule, setCurrentModule] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAsking, setIsAsking] = useState(false);

  const startDemo = useCallback((moduleId: string) => {
    setIsActive(true);
    setCurrentModule(moduleId);
    setCurrentStep(0);
    toast.success('Demo mode started');
  }, []);

  const stopDemo = useCallback(() => {
    setIsActive(false);
    setCurrentModule(null);
    setCurrentStep(0);
    toast.info('Demo mode ended');
  }, []);

  const nextStep = useCallback(() => {
    if (!currentModule) return;
    const steps = demoModules[currentModule];
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      stopDemo();
    }
  }, [currentModule, currentStep, stopDemo]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const askQuestion = useCallback(async (question: string) => {
    if (!question.trim()) {
      toast.error('Please enter a question');
      return null;
    }

    setIsAsking(true);
    try {
      const context = currentModule 
        ? `Discussing ${demoModules[currentModule][currentStep]?.title}`
        : 'General platform overview';

      const { data, error } = await supabase.functions.invoke('demo-assistant', {
        body: { question, context }
      });

      if (error) throw error;

      return data.answer;
    } catch (error) {
      console.error('Error asking question:', error);
      toast.error('Failed to get answer. Please try again.');
      return null;
    } finally {
      setIsAsking(false);
    }
  }, [currentModule, currentStep]);

  const getCurrentStep = useCallback(() => {
    if (!currentModule) return null;
    return demoModules[currentModule]?.[currentStep] || null;
  }, [currentModule, currentStep]);

  return {
    isActive,
    currentModule,
    currentStep,
    isAsking,
    startDemo,
    stopDemo,
    nextStep,
    previousStep,
    askQuestion,
    getCurrentStep,
    totalSteps: currentModule ? demoModules[currentModule].length : 0,
  };
};
