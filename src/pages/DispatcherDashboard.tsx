import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { MapView, Location } from '@/components/MapView';
import { useDispatcherData } from '@/hooks/useDispatcherData';
import { useDispatcherFilters } from '@/hooks/useDispatcherFilters';
import { DispatcherHeader } from '@/components/dispatcher/DispatcherHeader';
import { AISummaryCard } from '@/components/dispatcher/AISummaryCard';
import { DispatcherFilters } from '@/components/dispatcher/DispatcherFilters';
import { TripCard } from '@/components/dispatcher/TripCard';
import { VehicleCard } from '@/components/dispatcher/VehicleCard';
import { DriverWellbeingCard } from '@/components/dispatcher/DriverWellbeingCard';
import { LiveAlertsPanel } from '@/components/dispatcher/LiveAlertsPanel';
import { FloatingAssistant } from '@/components/FloatingAssistant';
import { AssistantWelcome } from '@/components/AssistantWelcome';
import AnomalyMonitor from '@/components/AnomalyMonitor';

export default function DispatcherDashboard() {
  
  const {
    trips,
    vehicles,
    driverWellbeing,
    aiSummary,
    summaryLoading,
    fetchDashboardData,
    generateAISummary
  } = useDispatcherData();

  const {
    regionFilter,
    setRegionFilter,
    vehicleFilter,
    setVehicleFilter,
    urgencyFilter,
    setUrgencyFilter,
    searchQuery,
    setSearchQuery,
    filteredTrips
  } = useDispatcherFilters(trips);

  const mapLocations: Location[] = filteredTrips
    .filter(t => t.gps_latitude && t.gps_longitude)
    .map(t => ({
      lat: t.gps_latitude!,
      lng: t.gps_longitude!,
      name: t.id,
      status: t.estimated_delay_minutes > 30 ? 'warning' : 'normal'
    }));

  return (
    <>
      <div className="min-h-screen p-6 space-y-6">
        <DispatcherHeader
          onRefresh={fetchDashboardData}
          onGenerateSummary={generateAISummary}
          summaryLoading={summaryLoading}
        />

        {aiSummary && <AISummaryCard summary={aiSummary} />}

        <AssistantWelcome />

      <DispatcherFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        regionFilter={regionFilter}
        onRegionChange={setRegionFilter}
        vehicleFilter={vehicleFilter}
        onVehicleChange={setVehicleFilter}
        urgencyFilter={urgencyFilter}
        onUrgencyChange={setUrgencyFilter}
        vehicles={vehicles}
      />

      <Tabs defaultValue="trips" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trips">Active Trips ({filteredTrips.length})</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles ({vehicles.length})</TabsTrigger>
          <TabsTrigger value="drivers">Driver Wellbeing ({driverWellbeing.length})</TabsTrigger>
          <TabsTrigger value="map">Live Map</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
        </TabsList>

        <TabsContent value="trips" className="space-y-4">
          {filteredTrips.map(trip => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </TabsContent>

        <TabsContent value="vehicles" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {vehicles.map(vehicle => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="drivers" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {driverWellbeing.map(driver => (
              <DriverWellbeingCard key={driver.driver_id} driver={driver} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="map">
          <Card className="p-0 overflow-hidden" style={{ height: '600px' }}>
            <MapView locations={mapLocations} />
          </Card>
        </TabsContent>

        <TabsContent value="anomalies">
          <AnomalyMonitor />
        </TabsContent>
      </Tabs>
      </div>

      <FloatingAssistant userRole="dispatcher" pageContext="dispatcher-dashboard" />
      <LiveAlertsPanel />
    </>
  );
}
