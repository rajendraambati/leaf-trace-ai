import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Navigation, Clock, AlertTriangle, Brain, TrendingUp } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { MapView, type Location } from './MapView';
import { useLogisticsAI } from '@/hooks/useLogisticsAI';

interface Vehicle {
  id: string;
  registration_number: string;
  status: string;
  current_location: string;
  current_latitude: number | null;
  current_longitude: number | null;
  fuel_level: number | null;
}

interface Shipment {
  id: string;
  vehicle_id: string;
  status: string;
  from_location: string;
  to_location: string;
  eta: string | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
  estimated_delay_minutes: number;
  route: any;
  ai_predicted_eta: string | null;
  ai_eta_confidence: number | null;
  ai_anomaly_detected: boolean;
  ai_anomaly_severity: string | null;
}

interface TrackingData {
  id: string;
  vehicle_id: string;
  latitude: number;
  longitude: number;
  speed_kmh: number | null;
  recorded_at: string;
  driver_status: string | null;
}

export function RealTimeVehicleMap() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [shipments, setShipments] = useState<Map<string, Shipment>>(new Map());
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [vehiclePositions, setVehiclePositions] = useState<Map<string, TrackingData>>(new Map());
  const { loading, predictDelay, detectAnomalies, scoreDriverPerformance } = useLogisticsAI();

  // Fetch vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('status', 'active');
      
      if (error) {
        console.error('Error fetching vehicles:', error);
        return;
      }
      
      if (data) {
        setVehicles(data);
      }
    };

    fetchVehicles();

    // Subscribe to vehicle updates
    const channel = supabase
      .channel('vehicles-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicles'
        },
        () => {
          fetchVehicles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch shipments for vehicles
  useEffect(() => {
    const fetchShipments = async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .in('status', ['in-transit', 'pending']);
      
      if (error) {
        console.error('Error fetching shipments:', error);
        return;
      }
      
      if (data) {
        const shipmentMap = new Map(data.map(s => [s.vehicle_id, s]));
        setShipments(shipmentMap);
      }
    };

    fetchShipments();

    // Subscribe to shipment updates
    const channel = supabase
      .channel('shipments-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shipments'
        },
        () => {
          fetchShipments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Subscribe to tracking updates
  useEffect(() => {
    const channel = supabase
      .channel('tracking-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vehicle_tracking_history'
        },
        (payload) => {
          const tracking = payload.new as TrackingData;
          setVehiclePositions(prev => new Map(prev).set(tracking.vehicle_id, tracking));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Initialize vehicle positions from current data
  useEffect(() => {
    vehicles.forEach(vehicle => {
      if (vehicle.current_latitude && vehicle.current_longitude) {
        setVehiclePositions(prev => {
          const newMap = new Map(prev);
          if (!newMap.has(vehicle.id)) {
            newMap.set(vehicle.id, {
              id: vehicle.id,
              vehicle_id: vehicle.id,
              latitude: vehicle.current_latitude!,
              longitude: vehicle.current_longitude!,
              speed_kmh: null,
              recorded_at: new Date().toISOString(),
              driver_status: null
            });
          }
          return newMap;
        });
      }
    });
  }, [vehicles]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-transit':
        return 'bg-primary';
      case 'delivered':
        return 'bg-success';
      case 'pending':
        return 'bg-muted';
      default:
        return 'bg-secondary';
    }
  };

  const getAlertLevel = (delayMinutes: number) => {
    if (delayMinutes > 30) return { level: 'critical', color: 'destructive' };
    if (delayMinutes > 10) return { level: 'warning', color: 'warning' };
    return { level: 'normal', color: 'success' };
  };

  const getStatusBadgeColor = (vehicle: Vehicle, shipment?: Shipment) => {
    if (vehicle.status === 'maintenance') return 'maintenance';
    if (shipment) {
      if (shipment.estimated_delay_minutes > 30) return 'major-delay';
      if (shipment.estimated_delay_minutes > 10) return 'minor-delay';
    }
    return 'normal';
  };

  // Convert vehicle positions to Location format for MapView
  const mapLocations: Location[] = Array.from(vehiclePositions.entries()).map(([vehicleId, tracking]) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    const shipment = shipments.get(vehicleId);
    const statusColor = getStatusBadgeColor(vehicle!, shipment);
    
    return {
      lat: tracking.latitude,
      lng: tracking.longitude,
      name: vehicle?.registration_number || 'Unknown',
      status: statusColor
    };
  });

  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);
  const selectedShipment = selectedVehicle ? shipments.get(selectedVehicle) : null;

  const handlePredictDelay = async () => {
    if (!selectedShipment || !selectedVehicle) return;
    
    const tracking = vehiclePositions.get(selectedVehicle);
    if (!tracking) return;

    await predictDelay({
      shipment_id: selectedShipment.id,
      current_location: { lat: tracking.latitude, lng: tracking.longitude },
      destination: { 
        lat: selectedShipment.gps_latitude || 0, 
        lng: selectedShipment.gps_longitude || 0,
        name: selectedShipment.to_location 
      },
      weather_conditions: 'Clear',
      road_conditions: 'Normal'
    });
  };

  const handleDetectAnomalies = async () => {
    if (!selectedShipment || !selectedVehicle) return;
    
    const tracking = vehiclePositions.get(selectedVehicle);
    if (!tracking) return;

    await detectAnomalies({
      shipment_id: selectedShipment.id,
      current_location: { lat: tracking.latitude, lng: tracking.longitude },
      weather_conditions: 'Clear'
    });
  };

  const handleScorePerformance = async () => {
    if (!selectedVehicle) return;
    await scoreDriverPerformance({ vehicle_id: selectedVehicle });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
      {/* Map */}
      <div className="lg:col-span-2">
        <MapView locations={mapLocations} />
      </div>

      {/* Vehicle List & Details */}
      <div className="space-y-4 overflow-y-auto">
        {/* Legend */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Status Legend
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-success border-2 border-white" />
              <span>Normal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-warning border-2 border-white" />
              <span>Minor Delay / Idle</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-destructive border-2 border-white" />
              <span>Major Delay</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-muted border-2 border-white" />
              <span>Maintenance</span>
            </div>
          </div>
        </Card>

        {/* Selected Vehicle Details */}
        {selectedVehicleData && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              {selectedVehicleData.registration_number}
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={getStatusColor(selectedVehicleData.status)}>
                  {selectedVehicleData.status}
                </Badge>
              </div>
              
              {selectedShipment && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Route</p>
                    <p className="text-sm font-medium">
                      {selectedShipment.from_location} → {selectedShipment.to_location}
                    </p>
                  </div>
                  
                  {selectedShipment.eta && (
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        ETA
                      </p>
                      <p className="text-sm font-medium">
                        {new Date(selectedShipment.eta).toLocaleString()}
                      </p>
                    </div>
                  )}
                  
                  {selectedShipment.ai_predicted_eta && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <Brain className="h-4 w-4 text-primary mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-primary flex items-center gap-2">
                          AI Predicted ETA
                          {selectedShipment.ai_eta_confidence && (
                            <Badge variant="outline" className="text-xs">
                              {Math.round(selectedShipment.ai_eta_confidence * 100)}% confident
                            </Badge>
                          )}
                        </p>
                        <p className="text-sm">
                          {new Date(selectedShipment.ai_predicted_eta).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedShipment.ai_anomaly_detected && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                      <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-warning">
                          Anomaly Detected
                        </p>
                        <p className="text-sm">
                          Severity: {selectedShipment.ai_anomaly_severity}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedShipment.estimated_delay_minutes > 0 && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-destructive">
                          Delay Alert
                        </p>
                        <p className="text-sm">
                          {selectedShipment.estimated_delay_minutes} minutes behind schedule
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Fuel Level</p>
                  <p className="text-sm font-medium">
                    {selectedVehicleData.fuel_level ? `${selectedVehicleData.fuel_level}%` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="text-sm font-medium truncate">
                    {selectedVehicleData.current_location || 'Unknown'}
                  </p>
                </div>
              </div>

              {/* AI Actions */}
              <div className="pt-3 border-t space-y-2">
                <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  AI Analysis
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handlePredictDelay}
                    disabled={loading || !selectedShipment}
                    className="text-xs"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    ETA
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleDetectAnomalies}
                    disabled={loading || !selectedShipment}
                    className="text-xs"
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Anomaly
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleScorePerformance}
                    disabled={loading}
                    className="text-xs"
                  >
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Score
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Active Vehicles List */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Active Vehicles ({vehicles.length})</h3>
          <div className="space-y-2">
            {vehicles.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No active vehicles found. Vehicles will appear here when they are in transit.
              </p>
            )}
            {vehicles.map(vehicle => {
              const shipment = shipments.get(vehicle.id);
              const alert = shipment ? getAlertLevel(shipment.estimated_delay_minutes) : null;
              
              return (
                <div
                  key={vehicle.id}
                  onClick={() => setSelectedVehicle(vehicle.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent ${
                    selectedVehicle === vehicle.id ? 'border-primary bg-accent' : 'border-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{vehicle.registration_number}</span>
                    {alert && alert.level !== 'normal' && (
                      <Badge variant={alert.color as any} className="text-xs">
                        {alert.level}
                      </Badge>
                    )}
                  </div>
                  {shipment && (
                    <p className="text-xs text-muted-foreground truncate">
                      → {shipment.to_location}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
