import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Navigation, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card } from './ui/card';

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
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [shipments, setShipments] = useState<Map<string, Shipment>>(new Map());
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);

  // Fetch Mapbox token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (error) throw error;
        setMapboxToken(data.token);
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
      }
    };
    fetchToken();
  }, []);

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
          updateVehicleMarker(tracking);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;
    if (map.current) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [78.9629, 20.5937], // Center of India
      zoom: 5,
      pitch: 45,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  // Update vehicle markers
  useEffect(() => {
    if (!map.current) return;

    vehicles.forEach(vehicle => {
      if (vehicle.current_latitude && vehicle.current_longitude) {
        updateVehicleMarker({
          id: vehicle.id,
          vehicle_id: vehicle.id,
          latitude: vehicle.current_latitude,
          longitude: vehicle.current_longitude,
          speed_kmh: null,
          recorded_at: new Date().toISOString(),
          driver_status: null
        });
      }
    });
  }, [vehicles]);

  const updateVehicleMarker = (tracking: TrackingData) => {
    if (!map.current) return;

    const vehicle = vehicles.find(v => v.id === tracking.vehicle_id);
    if (!vehicle) return;

    const shipment = shipments.get(tracking.vehicle_id);
    
    // Determine color based on status and alerts
    let color = '#10b981'; // green - normal
    if (shipment) {
      if (shipment.estimated_delay_minutes > 30) {
        color = '#ef4444'; // red - major delay
      } else if (shipment.estimated_delay_minutes > 10) {
        color = '#f59e0b'; // orange - minor delay
      }
    }
    if (vehicle.status === 'maintenance') {
      color = '#6b7280'; // gray - maintenance
    }
    if (tracking.speed_kmh !== null && tracking.speed_kmh < 1) {
      color = '#f59e0b'; // orange - idle
    }

    // Create or update marker
    let marker = markers.current.get(tracking.vehicle_id);
    
    if (marker) {
      marker.setLngLat([tracking.longitude, tracking.latitude]);
      const el = marker.getElement();
      el.style.backgroundColor = color;
    } else {
      const el = document.createElement('div');
      el.className = 'vehicle-marker';
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = color;
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';
      el.style.transition = 'all 0.3s';

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
      });

      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      marker = new mapboxgl.Marker({ element: el })
        .setLngLat([tracking.longitude, tracking.latitude])
        .addTo(map.current);

      // Add popup with vehicle info
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 8px 0; font-weight: bold;">${vehicle.registration_number}</h3>
          <p style="margin: 4px 0;"><strong>Status:</strong> ${vehicle.status}</p>
          ${shipment ? `
            <p style="margin: 4px 0;"><strong>To:</strong> ${shipment.to_location}</p>
            <p style="margin: 4px 0;"><strong>ETA:</strong> ${shipment.eta ? new Date(shipment.eta).toLocaleString() : 'N/A'}</p>
            ${shipment.estimated_delay_minutes > 0 ? `
              <p style="margin: 4px 0; color: #ef4444;"><strong>Delay:</strong> ${shipment.estimated_delay_minutes} min</p>
            ` : ''}
          ` : ''}
          ${tracking.speed_kmh !== null ? `
            <p style="margin: 4px 0;"><strong>Speed:</strong> ${tracking.speed_kmh.toFixed(1)} km/h</p>
          ` : ''}
        </div>
      `);

      marker.setPopup(popup);
      
      el.addEventListener('click', () => {
        setSelectedVehicle(tracking.vehicle_id);
      });

      markers.current.set(tracking.vehicle_id, marker);
    }
  };

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

  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle);
  const selectedShipment = selectedVehicle ? shipments.get(selectedVehicle) : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
      {/* Map */}
      <div className="lg:col-span-2 rounded-lg overflow-hidden border border-border">
        <div ref={mapContainer} className="h-full w-full" />
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
            </div>
          </Card>
        )}

        {/* Active Vehicles List */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Active Vehicles ({vehicles.length})</h3>
          <div className="space-y-2">
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
