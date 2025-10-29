import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ActiveTrip {
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

export interface VehicleStatus {
  id: string;
  registration_number: string;
  vehicle_type: string;
  status: string;
  current_latitude?: number | null;
  current_longitude?: number | null;
  last_maintenance_date?: string | null;
  [key: string]: any;
}

export interface DriverWellbeing {
  driver_id: string;
  driver_name: string | null;
  mood_rating: number | null;
  fatigue_level: number | null;
  stress_level: number | null;
  session_status: string | null;
  last_updated: string;
}

export interface AISummary {
  overall_status: string;
  critical_alerts: string[];
  recommendations: string[];
  statistics: {
    active_trips: number;
    delayed_trips: number;
    average_mood: number;
  };
}

export function useDispatcherData() {
  const [trips, setTrips] = useState<ActiveTrip[]>([]);
  const [vehicles, setVehicles] = useState<VehicleStatus[]>([]);
  const [driverWellbeing, setDriverWellbeing] = useState<DriverWellbeing[]>([]);
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);

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

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    trips,
    vehicles,
    driverWellbeing,
    aiSummary,
    loading,
    summaryLoading,
    fetchDashboardData,
    generateAISummary
  };
}
