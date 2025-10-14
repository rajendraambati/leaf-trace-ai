-- Create scheduled_reports table for automation
CREATE TABLE IF NOT EXISTS public.scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL CHECK (report_type IN ('gst', 'fctc', 'esg', 'all')),
  schedule_cron TEXT NOT NULL, -- Cron expression (e.g., '0 0 1 * *' for monthly)
  format TEXT DEFAULT 'json' CHECK (format IN ('json', 'csv', 'xml')),
  enabled BOOLEAN DEFAULT true,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  portal_submission BOOLEAN DEFAULT false,
  portal_url TEXT,
  portal_credentials JSONB, -- Encrypted credentials
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create report_submissions table to track submissions
CREATE TABLE IF NOT EXISTS public.report_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_report_id UUID REFERENCES public.scheduled_reports(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  format TEXT NOT NULL,
  file_url TEXT,
  portal_submitted BOOLEAN DEFAULT false,
  portal_submission_id TEXT,
  portal_response JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generated', 'submitted', 'failed')),
  error_message TEXT,
  generated_by UUID REFERENCES auth.users(id),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  submitted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_enabled ON public.scheduled_reports(enabled);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_run ON public.scheduled_reports(next_run);
CREATE INDEX IF NOT EXISTS idx_report_submissions_status ON public.report_submissions(status);
CREATE INDEX IF NOT EXISTS idx_report_submissions_date ON public.report_submissions(generated_at DESC);

-- Enable RLS
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scheduled_reports
CREATE POLICY "Admins and auditors can manage scheduled reports"
ON public.scheduled_reports
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'auditor'::app_role));

CREATE POLICY "Everyone can view scheduled reports"
ON public.scheduled_reports
FOR SELECT
USING (true);

-- RLS Policies for report_submissions
CREATE POLICY "Admins and auditors can manage report submissions"
ON public.report_submissions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'auditor'::app_role));

CREATE POLICY "Everyone can view report submissions"
ON public.report_submissions
FOR SELECT
USING (true);

-- Add audit triggers
CREATE TRIGGER audit_scheduled_reports_changes
AFTER INSERT OR UPDATE OR DELETE ON public.scheduled_reports
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

CREATE TRIGGER audit_report_submissions_changes
AFTER INSERT OR UPDATE OR DELETE ON public.report_submissions
FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();