import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapView, type Location } from "@/components/MapView";
import { MapPin } from "lucide-react";

export default function TrackByPhone() {
  const [phone, setPhone] = useState("");
  const [tracking, setTracking] = useState(false);
  const [path, setPath] = useState<Location[]>([]);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  const startTracking = async () => {
    if (!phone) return;
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const channel = supabase.channel(`driver:${phone}`);

    channel
      .on("presence", { event: "sync" }, () => {
        const state: any = channel.presenceState();
        // state is an object of presences; pick the first one
        const firstKey = Object.keys(state)[0];
        const pres = firstKey ? state[firstKey][0] : null;
        if (pres && pres.lat && pres.lng) {
          setPath((prev) => [
            ...prev,
            { lat: pres.lat, lng: pres.lng, name: `Driver ${phone}`, status: "normal" },
          ].slice(-200));
        }
      })
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") setTracking(true);
      });

    channelRef.current = channel;
  };

  const stopTracking = () => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    channelRef.current = null;
    setTracking(false);
  };

  return (
    <div className="min-h-screen p-4 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" /> Track Vehicle by Phone
        </h1>
        <Badge variant="secondary">Live</Badge>
      </header>

      <Card className="p-4 space-y-3">
        <div className="grid sm:grid-cols-[1fr_auto] gap-2">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter driver's phone number"
            type="tel"
          />
          {tracking ? (
            <Button variant="outline" onClick={stopTracking}>Stop</Button>
          ) : (
            <Button onClick={startTracking} disabled={!phone}>Start Tracking</Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">Share this with customers to track a driver in real-time.</p>
      </Card>

      <MapView locations={path} />
    </div>
  );
}
