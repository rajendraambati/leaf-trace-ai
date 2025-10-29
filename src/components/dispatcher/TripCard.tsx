import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, User, Truck, Clock, AlertCircle } from 'lucide-react';
import { ActiveTrip } from '@/hooks/useDispatcherData';

interface TripCardProps {
  trip: ActiveTrip;
}

export function TripCard({ trip }: TripCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-transit': return 'bg-blue-500';
      case 'delivered': return 'bg-green-500';
      case 'delayed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={getStatusColor(trip.status)}>
              {trip.status}
            </Badge>
            {trip.estimated_delay_minutes > 30 && (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                Delayed {trip.estimated_delay_minutes}m
              </Badge>
            )}
          </div>
          <p className="font-semibold text-lg">{trip.id}</p>
          <div className="grid md:grid-cols-2 gap-2 mt-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{trip.from_location} → {trip.to_location}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{trip.driver_name || 'No driver'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <span>{trip.vehicle_id || 'No vehicle'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>ETA: {trip.eta ? new Date(trip.eta).toLocaleString() : 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
