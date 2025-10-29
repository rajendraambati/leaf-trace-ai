import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';
import { useEnhancedOfflineSync } from '@/hooks/useEnhancedOfflineSync';
import { Heart, Brain, Battery, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

interface DriverWellnessCheckProps {
  vehicleId?: string;
  shipmentId?: string;
  onComplete?: () => void;
}

export function DriverWellnessCheck({ vehicleId, shipmentId, onComplete }: DriverWellnessCheckProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { queueOperation } = useEnhancedOfflineSync();
  
  const [moodRating, setMoodRating] = useState(5);
  const [fatigueLevel, setFatigueLevel] = useState(1);
  const [stressLevel, setStressLevel] = useState(1);
  const [drivingHours, setDrivingHours] = useState(0);
  const [breakDuration, setBreakDuration] = useState(0);
  const [concerns, setConcerns] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getRiskLevel = () => {
    if (fatigueLevel >= 8 || stressLevel >= 8 || moodRating <= 3) {
      return { level: 'high', color: 'text-destructive', icon: AlertTriangle };
    }
    if (fatigueLevel >= 5 || stressLevel >= 5 || moodRating <= 5) {
      return { level: 'medium', color: 'text-warning', icon: AlertTriangle };
    }
    return { level: 'low', color: 'text-success', icon: CheckCircle2 };
  };

  const getRecommendations = () => {
    const recommendations = [];
    
    if (fatigueLevel >= 7) {
      recommendations.push('Take a 30-minute break before continuing');
      recommendations.push('Consider switching drivers if possible');
    } else if (fatigueLevel >= 5) {
      recommendations.push('Take a 15-minute rest break');
    }
    
    if (stressLevel >= 7) {
      recommendations.push('Practice deep breathing exercises');
      recommendations.push('Contact dispatcher for route support');
    }
    
    if (moodRating <= 3) {
      recommendations.push('Consider taking a short mental health break');
      recommendations.push('Speak with a supervisor if needed');
    }
    
    if (drivingHours >= 8) {
      recommendations.push('You are approaching maximum driving hours');
      recommendations.push('Plan for mandatory rest period');
    }
    
    if (breakDuration < 15 && drivingHours >= 4) {
      recommendations.push('Take a proper meal/rest break');
    }

    if (recommendations.length === 0) {
      recommendations.push('You are in good condition to drive safely');
      recommendations.push('Continue monitoring your wellness throughout the day');
    }

    return recommendations;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const recommendations = getRecommendations();
      const riskLevel = getRiskLevel();

      const wellnessData = {
        driver_id: user?.id,
        vehicle_id: vehicleId,
        shipment_id: shipmentId,
        mood_rating: moodRating,
        fatigue_level: fatigueLevel,
        stress_level: stressLevel,
        driving_hours: drivingHours,
        break_duration_minutes: breakDuration,
        concerns: concerns || null,
        ai_recommendations: recommendations
      };

      // Use enhanced offline sync with high priority
      const result = await queueOperation(
        'driver_wellbeing_logs',
        'insert',
        wellnessData,
        10 // High priority
      );

      if (result.success) {
        // Show warning if high risk
        if (riskLevel.level === 'high') {
          toast({
            title: "High Risk Detected",
            description: "Please review recommendations before continuing",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Wellness Check Complete",
            description: result.synced ? "Thank you for checking in" : "Saved for sync",
          });
        }

        if (onComplete) {
          onComplete();
        }
      }
    } catch (error) {
      console.error('Error submitting wellness check:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit wellness check",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const riskLevel = getRiskLevel();
  const recommendations = getRecommendations();
  const RiskIcon = riskLevel.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          {t('wellness.mood', 'Driver Wellness Check')}
        </CardTitle>
        <CardDescription>
          Help us ensure your safety and wellbeing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Mood (1-10): {moodRating}
          </Label>
          <Slider
            value={[moodRating]}
            onValueChange={(value) => setMoodRating(value[0])}
            min={1}
            max={10}
            step={1}
          />
          <p className="text-xs text-muted-foreground">
            1 = Very Poor, 10 = Excellent
          </p>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Battery className="h-4 w-4" />
            {t('wellness.fatigue', 'Fatigue Level')} (1-10): {fatigueLevel}
          </Label>
          <Slider
            value={[fatigueLevel]}
            onValueChange={(value) => setFatigueLevel(value[0])}
            min={1}
            max={10}
            step={1}
          />
          <p className="text-xs text-muted-foreground">
            1 = Not Tired, 10 = Extremely Tired
          </p>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Stress Level (1-10): {stressLevel}
          </Label>
          <Slider
            value={[stressLevel]}
            onValueChange={(value) => setStressLevel(value[0])}
            min={1}
            max={10}
            step={1}
          />
          <p className="text-xs text-muted-foreground">
            1 = No Stress, 10 = High Stress
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Driving Hours Today</Label>
            <Slider
              value={[drivingHours]}
              onValueChange={(value) => setDrivingHours(value[0])}
              min={0}
              max={12}
              step={0.5}
            />
            <p className="text-xs text-muted-foreground">{drivingHours} hours</p>
          </div>

          <div className="space-y-2">
            <Label>Break Duration (min)</Label>
            <Slider
              value={[breakDuration]}
              onValueChange={(value) => setBreakDuration(value[0])}
              min={0}
              max={120}
              step={5}
            />
            <p className="text-xs text-muted-foreground">{breakDuration} minutes</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Concerns or Notes (Optional)</Label>
          <Textarea
            value={concerns}
            onChange={(e) => setConcerns(e.target.value)}
            placeholder="Any health concerns or issues you'd like to report..."
            rows={3}
          />
        </div>

        {/* Risk Assessment */}
        <div className={`p-4 border rounded-lg ${riskLevel.color}`}>
          <div className="flex items-center gap-2 mb-2">
            <RiskIcon className="h-5 w-5" />
            <h4 className="font-semibold">
              {riskLevel.level === 'high' ? 'High Risk' : 
               riskLevel.level === 'medium' ? 'Medium Risk' : 'Low Risk'}
            </h4>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Recommendations:</p>
            <ul className="text-sm space-y-1 list-disc list-inside">
              {recommendations.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
          size="lg"
          variant={riskLevel.level === 'high' ? 'destructive' : 'default'}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <CheckCircle2 className="mr-2 h-5 w-5" />
          Submit Wellness Check
        </Button>
      </CardContent>
    </Card>
  );
}