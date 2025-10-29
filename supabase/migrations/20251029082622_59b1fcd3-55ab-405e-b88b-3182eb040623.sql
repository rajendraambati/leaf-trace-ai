-- Fix and enhance RLS policies for mobile app tables

-- Drop and recreate policies for mobile_checklist_responses
DROP POLICY IF EXISTS "Drivers can view own checklist responses" ON public.mobile_checklist_responses;
DROP POLICY IF EXISTS "Drivers can insert own checklist responses" ON public.mobile_checklist_responses;
DROP POLICY IF EXISTS "Managers can view all checklist responses" ON public.mobile_checklist_responses;

CREATE POLICY "Drivers can view own checklist responses"
  ON public.mobile_checklist_responses FOR SELECT
  USING (driver_id = auth.uid());

CREATE POLICY "Drivers can insert own checklist responses"
  ON public.mobile_checklist_responses FOR INSERT
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "Drivers can update own checklist responses"
  ON public.mobile_checklist_responses FOR UPDATE
  USING (driver_id = auth.uid());

CREATE POLICY "Managers can view all checklist responses"
  ON public.mobile_checklist_responses FOR SELECT
  USING (
    has_role(auth.uid(), 'logistics_manager') OR 
    has_role(auth.uid(), 'factory_manager') OR
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'system_admin')
  );

CREATE POLICY "System can insert checklist responses"
  ON public.mobile_checklist_responses FOR INSERT
  WITH CHECK (true);

-- Fix policies for gps_tracking_logs
DROP POLICY IF EXISTS "Drivers can insert own GPS logs" ON public.gps_tracking_logs;
DROP POLICY IF EXISTS "Drivers can view own GPS logs" ON public.gps_tracking_logs;
DROP POLICY IF EXISTS "Managers can view all GPS logs" ON public.gps_tracking_logs;

CREATE POLICY "Drivers can insert own GPS logs"
  ON public.gps_tracking_logs FOR INSERT
  WITH CHECK (driver_id = auth.uid());

CREATE POLICY "System can insert GPS logs"
  ON public.gps_tracking_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Drivers can view own GPS logs"
  ON public.gps_tracking_logs FOR SELECT
  USING (driver_id = auth.uid());

CREATE POLICY "Managers can view all GPS logs"
  ON public.gps_tracking_logs FOR SELECT
  USING (
    has_role(auth.uid(), 'logistics_manager') OR 
    has_role(auth.uid(), 'factory_manager') OR
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'system_admin')
  );

CREATE POLICY "Public can view recent GPS logs"
  ON public.gps_tracking_logs FOR SELECT
  USING (created_at > NOW() - INTERVAL '24 hours');

-- Enhance policies for driver_wellness_analytics
DROP POLICY IF EXISTS "Drivers can view own wellness analytics" ON public.driver_wellness_analytics;
DROP POLICY IF EXISTS "Managers can view all wellness analytics" ON public.driver_wellness_analytics;
DROP POLICY IF EXISTS "System can insert wellness analytics" ON public.driver_wellness_analytics;

CREATE POLICY "Drivers can view own wellness analytics"
  ON public.driver_wellness_analytics FOR SELECT
  USING (driver_id = auth.uid());

CREATE POLICY "Managers can view all wellness analytics"
  ON public.driver_wellness_analytics FOR SELECT
  USING (
    has_role(auth.uid(), 'logistics_manager') OR 
    has_role(auth.uid(), 'factory_manager') OR
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'system_admin')
  );

CREATE POLICY "System can insert wellness analytics"
  ON public.driver_wellness_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update wellness analytics"
  ON public.driver_wellness_analytics FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'system_admin')
  );

-- Add missing policies for delivery_confirmations (if they need updates)
CREATE POLICY "Managers can update delivery confirmations" ON public.delivery_confirmations
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'logistics_manager') OR 
    has_role(auth.uid(), 'admin')
  );

-- Add policies for driver_wellbeing_logs updates
CREATE POLICY "Managers can view wellbeing insights" ON public.driver_wellbeing_logs
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'logistics_manager') OR 
    has_role(auth.uid(), 'admin')
  );

-- Ensure offline_sync_queue has proper policies
CREATE POLICY "Users can delete own sync queue" ON public.offline_sync_queue
  FOR DELETE
  USING (user_id = auth.uid());