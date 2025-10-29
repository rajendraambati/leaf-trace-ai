import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter } from 'lucide-react';
import { VehicleStatus } from '@/hooks/useDispatcherData';

interface DispatcherFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  regionFilter: string;
  onRegionChange: (value: string) => void;
  vehicleFilter: string;
  onVehicleChange: (value: string) => void;
  urgencyFilter: string;
  onUrgencyChange: (value: string) => void;
  vehicles: VehicleStatus[];
}

export function DispatcherFilters({
  searchQuery,
  onSearchChange,
  regionFilter,
  onRegionChange,
  vehicleFilter,
  onVehicleChange,
  urgencyFilter,
  onUrgencyChange,
  vehicles
}: DispatcherFiltersProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="h-5 w-5" />
        <h3 className="font-semibold">Filters</h3>
      </div>
      <div className="grid md:grid-cols-4 gap-4">
        <Input
          placeholder="Search trips..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Select value={regionFilter} onValueChange={onRegionChange}>
          <SelectTrigger>
            <SelectValue placeholder="All Regions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            <SelectItem value="Farm">Farm</SelectItem>
            <SelectItem value="Warehouse">Warehouse</SelectItem>
            <SelectItem value="Processing">Processing</SelectItem>
          </SelectContent>
        </Select>
        <Select value={vehicleFilter} onValueChange={onVehicleChange}>
          <SelectTrigger>
            <SelectValue placeholder="All Vehicles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vehicles</SelectItem>
            {vehicles.map(v => (
              <SelectItem key={v.id} value={v.id}>{v.registration_number}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={urgencyFilter} onValueChange={onUrgencyChange}>
          <SelectTrigger>
            <SelectValue placeholder="All Urgency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="urgent">Urgent (Delayed)</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
}
