import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Battery, Brain, CheckCircle } from 'lucide-react';

interface WellnessCheckProps {
  onComplete: (data: {
    mood_rating: number;
    fatigue_level: number;
    stress_level: number;
    concerns: string;
  }) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function WellnessCheck({ onComplete, onCancel, loading }: WellnessCheckProps) {
  const [moodRating, setMoodRating] = useState([7]);
  const [fatigueLevel, setFatigueLevel] = useState([3]);
  const [stressLevel, setStressLevel] = useState([3]);
  const [concerns, setConcerns] = useState('');

  const handleSubmit = () => {
    onComplete({
      mood_rating: moodRating[0],
      fatigue_level: fatigueLevel[0],
      stress_level: stressLevel[0],
      concerns: concerns || 'None'
    });
  };

  const getFatigueColor = (level: number) => {
    if (level <= 3) return 'text-green-500';
    if (level <= 6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStressColor = (level: number) => {
    if (level <= 3) return 'text-green-500';
    if (level <= 6) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Heart className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-xl font-bold">Driver Wellness Check</h2>
            <p className="text-sm text-muted-foreground">
              Quick health assessment before starting your trip
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Mood Rating */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-3">
              <Heart className="h-4 w-4" />
              How are you feeling? ({moodRating[0]}/10)
            </label>
            <Slider
              value={moodRating}
              onValueChange={setMoodRating}
              min={1}
              max={10}
              step={1}
              className="mb-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </div>

          {/* Fatigue Level */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-3">
              <Battery className={`h-4 w-4 ${getFatigueColor(fatigueLevel[0])}`} />
              Fatigue Level ({fatigueLevel[0]}/10)
            </label>
            <Slider
              value={fatigueLevel}
              onValueChange={setFatigueLevel}
              min={1}
              max={10}
              step={1}
              className="mb-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Alert</span>
              <span>Exhausted</span>
            </div>
          </div>

          {/* Stress Level */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-3">
              <Brain className={`h-4 w-4 ${getStressColor(stressLevel[0])}`} />
              Stress Level ({stressLevel[0]}/10)
            </label>
            <Slider
              value={stressLevel}
              onValueChange={setStressLevel}
              min={1}
              max={10}
              step={1}
              className="mb-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Calm</span>
              <span>Very Stressed</span>
            </div>
          </div>

          {/* Concerns */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Any health or safety concerns?
            </label>
            <Textarea
              value={concerns}
              onChange={(e) => setConcerns(e.target.value)}
              placeholder="Optional: Mention any concerns..."
              rows={3}
            />
          </div>

          {/* Warnings */}
          {(fatigueLevel[0] > 7 || stressLevel[0] > 7) && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-500">
                ⚠️ High {fatigueLevel[0] > 7 ? 'fatigue' : 'stress'} detected
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Consider taking a break before starting your trip
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={loading}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {loading ? 'Starting Trip...' : 'Complete & Start Trip'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
