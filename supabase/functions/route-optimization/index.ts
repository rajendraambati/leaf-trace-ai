import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Location {
  lat: number;
  lng: number;
  name: string;
}

interface RouteRequest {
  shipmentId: string;
  origin: Location;
  destination: Location;
  vehicleType?: string;
  priority?: 'standard' | 'urgent';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { shipmentId, origin, destination, vehicleType, priority }: RouteRequest = await req.json();

    // Calculate distance (simplified Haversine formula)
    const R = 6371; // Earth's radius in km
    const dLat = (destination.lat - origin.lat) * Math.PI / 180;
    const dLon = (destination.lng - origin.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(origin.lat * Math.PI / 180) * Math.cos(destination.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    // AI-based route optimization factors
    const speedFactor = vehicleType === 'truck' ? 60 : 80; // km/h
    const priorityFactor = priority === 'urgent' ? 1.2 : 1.0;
    const trafficFactor = 0.85; // Assume 15% traffic delay
    
    const estimatedTime = (distance / speedFactor) / trafficFactor * priorityFactor;
    const eta = new Date(Date.now() + estimatedTime * 60 * 60 * 1000);

    // Generate optimized waypoints (simplified - in production, use actual routing API)
    const waypoints = [
      origin,
      {
        lat: (origin.lat + destination.lat) / 2,
        lng: (origin.lng + destination.lng) / 2,
        name: 'Midpoint Checkpoint'
      },
      destination
    ];

    // Update shipment with optimized route
    const { error: updateError } = await supabaseClient
      .from('shipments')
      .update({
        eta: eta.toISOString(),
        status: 'optimized'
      })
      .eq('id', shipmentId);

    if (updateError) {
      console.error('Error updating shipment:', updateError);
    }

    const optimizedRoute = {
      shipmentId,
      distance: Math.round(distance * 100) / 100,
      estimatedTime: Math.round(estimatedTime * 100) / 100,
      eta: eta.toISOString(),
      waypoints,
      trafficConditions: 'moderate',
      fuelEstimate: Math.round(distance * 0.15 * 100) / 100, // Liters
      recommendations: [
        priority === 'urgent' ? 'Use express route' : 'Use standard route',
        'Avoid peak hours (8-10 AM, 5-7 PM)',
        distance > 100 ? 'Schedule rest stop at midpoint' : 'Direct route recommended'
      ]
    };

    console.log('Route optimized:', optimizedRoute);

    return new Response(JSON.stringify(optimizedRoute), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in route-optimization:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
