import { useState, useEffect } from "react";
import { ClipboardList, Calendar, MapPin, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function TechnicianActivity() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    activity_type: "",
    batch_id: "",
    location: "",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    const { data } = await supabase
      .from('batch_quality_tests')
      .select('*')
      .order('test_date', { ascending: false })
      .limit(10);
    
    setActivities(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.from('batch_quality_tests').insert({
        batch_id: formData.batch_id,
        notes: `${formData.activity_type} at ${formData.location}: ${formData.notes}`,
        tested_by: user?.id,
        test_date: new Date().toISOString()
      });

      if (error) throw error;

      toast.success("Activity logged successfully!");
      setFormData({ activity_type: "", batch_id: "", location: "", notes: "" });
      fetchActivities();
    } catch (error: any) {
      toast.error(error.message || "Failed to log activity");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4 pb-20">
      <div className="max-w-lg mx-auto space-y-4">
        <div className="text-center pt-6 pb-4">
          <ClipboardList className="h-12 w-12 mx-auto text-primary mb-3" />
          <h1 className="text-2xl font-bold">Technician Activity Log</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Record your field activities
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Log New Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="activity_type" className="text-base">
                  Activity Type *
                </Label>
                <Select
                  value={formData.activity_type}
                  onValueChange={(v) => setFormData({ ...formData, activity_type: v })}
                  required
                >
                  <SelectTrigger id="activity_type" className="h-12 text-base">
                    <SelectValue placeholder="Select activity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quality_inspection">Quality Inspection</SelectItem>
                    <SelectItem value="batch_testing">Batch Testing</SelectItem>
                    <SelectItem value="farmer_visit">Farmer Visit</SelectItem>
                    <SelectItem value="warehouse_check">Warehouse Check</SelectItem>
                    <SelectItem value="delivery_verification">Delivery Verification</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="batch_id" className="text-base">
                  Batch ID *
                </Label>
                <Input
                  id="batch_id"
                  type="text"
                  required
                  placeholder="BATCH-XXXXXX"
                  value={formData.batch_id}
                  onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location *
                </Label>
                <Input
                  id="location"
                  type="text"
                  required
                  placeholder="Location of activity"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes *
                </Label>
                <Textarea
                  id="notes"
                  required
                  placeholder="Describe your activity..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="min-h-24 text-base"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={submitting}
              >
                {submitting ? "Logging..." : "Log Activity"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                No activities logged yet
              </p>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-3 rounded-lg border border-border bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{activity.batch_id}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {activity.notes}
                        </p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(activity.test_date).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
