import { useState, useMemo } from 'react';
import { ActiveTrip } from './useDispatcherData';

export function useDispatcherFilters(trips: ActiveTrip[]) {
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      const matchesSearch = !searchQuery || 
        trip.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.batch_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.driver_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRegion = regionFilter === 'all' || 
        trip.from_location.includes(regionFilter) || 
        trip.to_location.includes(regionFilter);

      const matchesVehicle = vehicleFilter === 'all' || trip.vehicle_id === vehicleFilter;

      const matchesUrgency = urgencyFilter === 'all' || 
        (urgencyFilter === 'urgent' && trip.estimated_delay_minutes > 30) ||
        (urgencyFilter === 'normal' && trip.estimated_delay_minutes <= 30);

      return matchesSearch && matchesRegion && matchesVehicle && matchesUrgency;
    });
  }, [trips, searchQuery, regionFilter, vehicleFilter, urgencyFilter]);

  return {
    regionFilter,
    setRegionFilter,
    vehicleFilter,
    setVehicleFilter,
    urgencyFilter,
    setUrgencyFilter,
    searchQuery,
    setSearchQuery,
    filteredTrips
  };
}
