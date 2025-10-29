import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Smile, Frown, Meh } from 'lucide-react';
import { DriverWellbeing } from '@/hooks/useDispatcherData';

interface DriverWellbeingCardProps {
  driver: DriverWellbeing;
}

export function DriverWellbeingCard({ driver }: DriverWellbeingCardProps) {
  const getMoodIcon = (mood: number | null) => {
    if (!mood) return <Meh className="h-4 w-4" />;
    if (mood >= 4) return <Smile className="h-4 w-4 text-green-500" />;
    if (mood >= 3) return <Meh className="h-4 w-4 text-yellow-500" />;
    return <Frown className="h-4 w-4 text-red-500" />;
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <User className="h-6 w-6" />
          <div>
            <p className="font-semibold">{driver.driver_name}</p>
            <Badge variant="outline">{driver.session_status}</Badge>
          </div>
        </div>
        {getMoodIcon(driver.mood_rating)}
      </div>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <p className="text-muted-foreground">Mood</p>
          <p className="font-semibold">{driver.mood_rating || 'N/A'}/5</p>
        </div>
        <div>
          <p className="text-muted-foreground">Fatigue</p>
          <p className="font-semibold">{driver.fatigue_level || 'N/A'}/5</p>
        </div>
        <div>
          <p className="text-muted-foreground">Stress</p>
          <p className="font-semibold">{driver.stress_level || 'N/A'}/5</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Updated: {new Date(driver.last_updated).toLocaleString()}
      </p>
    </Card>
  );
}
