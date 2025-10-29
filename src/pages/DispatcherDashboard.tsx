import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapView, Location } from '@/components/MapView';
import { 
  Truck, User, AlertCircle, CheckCircle, Clock, 
  MapPin, TrendingUp, Filter, RefreshCw, Smile, Frown, Meh 
} from 'lucide-react';
import { toast } from 'sonner';

interface ActiveTrip {
  id: string;
  batch_id: string;
  from_location: string;
  to_location: string;
  status: string;
  vehicle_id: string | null;
  driver_name: string | null;
  eta: string | null;
  departure_time: string;
  gps_latitude: number | null;
  gps_longitude: number | null;
  estimated_delay_minutes: number;
}

interface VehicleStatus {
  id: string;
  registration_number: string;
  vehicle_type: string;
  status: string;
  current_latitude?: number | null;
  current_longitude?: number | null;
  last_maintenance_date?: string | null;
  [key: string]: any;
}

interface DriverWellbeing {
  driver_id: string;
  driver_name: string | null;
  mood_rating: number | null;
  fatigue_level: number | null;
  stress_level: number | null;
  session_status: string | null;
  last_updated: string;
}

interface AISummary {
  overall_status: string;
  critical_alerts: string[];
  recommendations: string[];
  statistics: {
    active_trips: number;
    delayed_trips: number;
    average_mood: number;
  };
}

export default function DispatcherDashboard() {
  const [trips, setTrips] = useState<ActiveTrip[]>([]);
  const [vehicles, setVehicles] = useState<VehicleStatus[]>([]);
  const [driverWellbeing, setDriverWellbeing] = useState<DriverWellbeing[]>([]);
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Filters
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [vehicleFilter, setVehicleFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchActiveTrips(),
        fetchVehicleStatus(),
        fetchDriverWellbeing()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveTrips = async () => {
    const { data, error } = await supabase
      .from('shipments')
      .select('*')
      .in('status', ['pending', 'in-transit'])
      .order('departure_time', { ascending: false });

    if (error) {
      toast.error('Failed to fetch trips');
      return;
    }

    setTrips(data || []);
  };

  const fetchVehicleStatus = async () => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('status', { ascending: true });

    if (error) {
      toast.error('Failed to fetch vehicles');
      return;
    }

    setVehicles(data || []);
  };

  const fetchDriverWellbeing = async () => {
    // Get latest wellbeing log for each active driver
    const { data: sessions } = await supabase
      .from('driver_sessions')
      .select('driver_id, status, current_latitude, current_longitude')
      .is('ended_at', null);

    if (!sessions) return;

    const driverIds = sessions.map(s => s.driver_id);
    
    const { data: wellbeingData } = await supabase
      .from('driver_wellbeing_logs')
      .select('*, shipments(driver_name)')
      .in('driver_id', driverIds)
      .order('created_at', { ascending: false });

    if (wellbeingData) {
      // Get latest entry per driver
      const latestByDriver = wellbeingData.reduce((acc, curr) => {
        if (!acc[curr.driver_id] || new Date(curr.created_at) > new Date(acc[curr.driver_id].created_at)) {
          acc[curr.driver_id] = curr;
        }
        return acc;
      }, {} as Record<string, any>);

      const formattedData: DriverWellbeing[] = Object.values(latestByDriver).map((log: any) => ({
        driver_id: log.driver_id,
        driver_name: log.shipments?.driver_name || 'Unknown',
        mood_rating: log.mood_rating,
        fatigue_level: log.fatigue_level,
        stress_level: log.stress_level,
        session_status: sessions.find(s => s.driver_id === log.driver_id)?.status || null,
        last_updated: log.created_at
      }));

      setDriverWellbeing(formattedData);
    }
  };

  const generateAISummary = async () => {
    setSummaryLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('dispatcher-summary', {
        body: {
          trips,
          vehicles,
          driverWellbeing
        }
      });

      if (error) throw error;
      setAiSummary(data);
      toast.success('AI summary generated');
    } catch (error) {
      console.error('AI summary error:', error);
      toast.error('Failed to generate AI summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  // Apply filters
  const filteredTrips = trips.filter(trip => {
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

  const getMoodIcon = (mood: number | null) => {
    if (!mood) return <Meh className="h-4 w-4" />;
    if (mood >= 4) return <Smile className="h-4 w-4 text-green-500" />;
    if (mood >= 3) return <Meh className="h-4 w-4 text-yellow-500" />;
    return <Frown className="h-4 w-4 text-red-500" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-transit': return 'bg-blue-500';
      case 'delivered': return 'bg-green-500';
      case 'delayed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const mapLocations: Location[] = filteredTrips
    .filter(t => t.gps_latitude && t.gps_longitude)
    .map(t => ({
      lat: t.gps_latitude!,
      lng: t.gps_longitude!,
      name: t.id,
      status: t.estimated_delay_minutes > 30 ? 'warning' : 'normal'
    }));

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dispatcher Dashboard</h1>
          <p className="text-muted-foreground">Real-time fleet monitoring and control</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchDashboardData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={generateAISummary} disabled={summaryLoading}>
            <TrendingUp className="h-4 w-4 mr-2" />
            {summaryLoading ? 'Generating...' : 'AI Summary'}
          </Button>
        </div>
      </div>

      {/* AI Summary Card */}
      {aiSummary && (
        <Card className="p-6 bg-gradient-to-r from-primary/10 to-secondary/10">
          <h2 className="text-xl font-semibold mb-4">AI Operations Summary</h2>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Active Trips</p>
              <p className="text-2xl font-bold">{aiSummary.statistics.active_trips}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Delayed Trips</p>
              <p className="text-2xl font-bold text-red-500">{aiSummary.statistics.delayed_trips}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Driver Mood</p>
              <p className="text-2xl font-bold">{aiSummary.statistics.average_mood.toFixed(1)}/5</p>
            </div>
          </div>
          
          {aiSummary.critical_alerts.length > 0 && (
            <div className="mb-4">
              <p className="font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Critical Alerts
              </p>
              <ul className="list-disc list-inside space-y-1">
                {aiSummary.critical_alerts.map((alert, i) => (
                  <li key={i} className="text-sm">{alert}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="font-semibold mb-2">AI Recommendations</p>
            <ul className="list-disc list-inside space-y-1">
              {aiSummary.recommendations.map((rec, i) => (
                <li key={i} className="text-sm">{rec}</li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-5 w-5" />
          <h3 className="font-semibold">Filters</h3>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          <Input
            placeholder="Search trips..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Select value={regionFilter} onValueChange={setRegionFilter}>
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
          <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
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
          <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
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

      {/* Main Content */}
      <Tabs defaultValue="trips" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trips">Active Trips ({filteredTrips.length})</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles ({vehicles.length})</TabsTrigger>
          <TabsTrigger value="drivers">Driver Wellbeing ({driverWellbeing.length})</TabsTrigger>
          <TabsTrigger value="map">Live Map</TabsTrigger>
        </TabsList>

        <TabsContent value="trips" className="space-y-4">
          {filteredTrips.map(trip => (
            <Card key={trip.id} className="p-4">
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
          ))}
        </TabsContent>

        <TabsContent value="vehicles" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {vehicles.map(vehicle => (
              <Card key={vehicle.id} className="p-4">
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
            ))}
          </div>
        </TabsContent>

        <TabsContent value="drivers" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {driverWellbeing.map(driver => (
              <Card key={driver.driver_id} className="p-4">
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
            ))}
          </div>
        </TabsContent>

        <TabsContent value="map">
          <Card className="p-0 overflow-hidden" style={{ height: '600px' }}>
            <MapView locations={mapLocations} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
