import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck } from 'lucide-react';
import { VehicleStatus } from '@/hooks/useDispatcherData';

interface VehicleCardProps {
  vehicle: VehicleStatus;
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3 mb-3">
        <Truck className="h-8 w-8 text-primary" />
        <div>
          <p className="font-semibold">{vehicle.registration_number}</p>
          <p className="text-sm text-muted-foreground">{vehicle.vehicle_type}</p>
        </div>
      </div>
      <Badge className={vehicle.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}>
        {vehicle.status}
      </Badge>
      {vehicle.last_maintenance_date && (
        <p className="text-xs text-muted-foreground mt-2">
          Last maintenance: {new Date(vehicle.last_maintenance_date).toLocaleDateString()}
        </p>
      )}
    </Card>
  );
}
