-- Create feedback table for user feedback on AI features
CREATE TABLE public.user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  feature_type TEXT NOT NULL, -- 'ai_grading', 'esg_scoring', 'route_optimization', 'crop_health'
  resource_id TEXT, -- ID of the specific resource (batch_id, shipment_id, etc.)
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  category TEXT, -- 'bug', 'feature_request', 'improvement', 'praise'
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'implemented', 'dismissed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id)
);

-- Create AI usage analytics table
CREATE TABLE public.ai_usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  feature_type TEXT NOT NULL,
  model_name TEXT,
  input_data JSONB,
  output_data JSONB,
  confidence_score NUMERIC,
  execution_time_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  user_accepted BOOLEAN, -- Did user accept the AI suggestion?
  user_modified BOOLEAN, -- Did user modify the AI output?
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create model performance metrics table
CREATE TABLE public.model_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_type TEXT NOT NULL,
  model_version TEXT NOT NULL,
  metric_type TEXT NOT NULL, -- 'accuracy', 'precision', 'recall', 'f1_score', 'user_acceptance_rate'
  metric_value NUMERIC NOT NULL,
  sample_size INTEGER,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Feedback policies
CREATE POLICY "Users can submit their own feedback"
  ON public.user_feedback
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback"
  ON public.user_feedback
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins and auditors can view all feedback"
  ON public.user_feedback
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'auditor'::app_role));

CREATE POLICY "Admins can manage feedback"
  ON public.user_feedback
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- AI usage analytics policies
CREATE POLICY "System can insert analytics"
  ON public.ai_usage_analytics
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins and auditors can view analytics"
  ON public.ai_usage_analytics
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'auditor'::app_role));

-- Model performance policies
CREATE POLICY "Everyone can view performance metrics"
  ON public.model_performance_metrics
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage performance metrics"
  ON public.model_performance_metrics
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_user_feedback_feature ON public.user_feedback(feature_type, created_at DESC);
CREATE INDEX idx_user_feedback_status ON public.user_feedback(status, created_at DESC);
CREATE INDEX idx_ai_usage_feature ON public.ai_usage_analytics(feature_type, created_at DESC);
CREATE INDEX idx_ai_usage_success ON public.ai_usage_analytics(success, created_at DESC);
CREATE INDEX idx_model_metrics_feature ON public.model_performance_metrics(feature_type, calculated_at DESC);