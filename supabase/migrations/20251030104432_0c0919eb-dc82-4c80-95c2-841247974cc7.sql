-- Contract Templates and Clauses System
CREATE TABLE IF NOT EXISTS public.contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('nda', 'consulting_agreement', 'vendor_onboarding', 'service_agreement', 'partnership_agreement')),
  description TEXT,
  default_clauses JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  category TEXT,
  jurisdiction TEXT DEFAULT 'international',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual Clause Library
CREATE TABLE IF NOT EXISTS public.contract_clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clause_name TEXT NOT NULL,
  clause_type TEXT NOT NULL CHECK (clause_type IN (
    'emd', 'bank_guarantee', 'ip_protection', 'sla', 
    'confidentiality', 'payment_terms', 'termination', 
    'liability', 'dispute_resolution', 'indemnification',
    'force_majeure', 'governing_law', 'warranty', 'non_compete'
  )),
  clause_content TEXT NOT NULL,
  legal_hint TEXT,
  customization_fields JSONB DEFAULT '[]'::jsonb,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  is_mandatory BOOLEAN DEFAULT FALSE,
  applicable_contract_types TEXT[] DEFAULT ARRAY['all']::TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated Contracts
CREATE TABLE IF NOT EXISTS public.generated_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT UNIQUE NOT NULL,
  template_id UUID REFERENCES public.contract_templates(id),
  contract_type TEXT NOT NULL,
  party_a_name TEXT NOT NULL,
  party_a_details JSONB DEFAULT '{}'::jsonb,
  party_b_name TEXT NOT NULL,
  party_b_details JSONB DEFAULT '{}'::jsonb,
  selected_clauses JSONB DEFAULT '[]'::jsonb,
  customizations JSONB DEFAULT '{}'::jsonb,
  generated_content TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'executed', 'archived')),
  effective_date DATE,
  expiry_date DATE,
  contract_value NUMERIC,
  currency TEXT DEFAULT 'USD',
  signed_by_party_a UUID REFERENCES auth.users(id),
  signed_by_party_b UUID REFERENCES auth.users(id),
  signed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contract Version History
CREATE TABLE IF NOT EXISTS public.contract_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.generated_contracts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  changes_summary TEXT,
  changed_clauses JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contract Approvals
CREATE TABLE IF NOT EXISTS public.contract_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.generated_contracts(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES auth.users(id),
  approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected', 'revision_requested')),
  comments TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_clauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contract_templates
CREATE POLICY "Everyone can view active contract templates" ON public.contract_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authorized users can manage contract templates" ON public.contract_templates
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'system_admin'::app_role)
  );

-- RLS Policies for contract_clauses
CREATE POLICY "Everyone can view contract clauses" ON public.contract_clauses
  FOR SELECT USING (true);

CREATE POLICY "Authorized users can manage contract clauses" ON public.contract_clauses
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'system_admin'::app_role)
  );

-- RLS Policies for generated_contracts
CREATE POLICY "Users can view their own contracts" ON public.generated_contracts
  FOR SELECT USING (
    created_by = auth.uid() OR
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'system_admin'::app_role)
  );

CREATE POLICY "Authenticated users can create contracts" ON public.generated_contracts
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own draft contracts" ON public.generated_contracts
  FOR UPDATE USING (
    (created_by = auth.uid() AND status = 'draft') OR
    has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS Policies for contract_versions
CREATE POLICY "Users can view contract versions" ON public.contract_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.generated_contracts
      WHERE id = contract_versions.contract_id
      AND (created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "System can create contract versions" ON public.contract_versions
  FOR INSERT WITH CHECK (true);

-- RLS Policies for contract_approvals
CREATE POLICY "Users can view contract approvals" ON public.contract_approvals
  FOR SELECT USING (
    approver_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.generated_contracts
      WHERE id = contract_approvals.contract_id
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "Approvers can manage their approvals" ON public.contract_approvals
  FOR ALL USING (approver_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_contract_templates_updated_at
  BEFORE UPDATE ON public.contract_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contract_clauses_updated_at
  BEFORE UPDATE ON public.contract_clauses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generated_contracts_updated_at
  BEFORE UPDATE ON public.generated_contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_contract_templates_type ON public.contract_templates(template_type);
CREATE INDEX idx_contract_clauses_type ON public.contract_clauses(clause_type);
CREATE INDEX idx_generated_contracts_status ON public.generated_contracts(status);
CREATE INDEX idx_generated_contracts_created_by ON public.generated_contracts(created_by);
CREATE INDEX idx_contract_versions_contract_id ON public.contract_versions(contract_id);

-- Insert default clause templates
INSERT INTO public.contract_clauses (clause_name, clause_type, clause_content, legal_hint, customization_fields, risk_level, is_mandatory, applicable_contract_types) VALUES
(
  'Earnest Money Deposit (EMD)',
  'emd',
  'The Party B shall deposit an Earnest Money Deposit (EMD) of {{emd_amount}} {{currency}} within {{emd_timeline}} days from the date of this agreement. The EMD shall be {{emd_refundable}} and will be {{emd_adjustment}} against the final payment upon successful completion of the contract.',
  'EMD is a good faith deposit showing serious intent. Ensure clarity on refund conditions and timeline. Consider market standards (typically 1-10% of contract value).',
  '[{"field": "emd_amount", "type": "number", "label": "EMD Amount", "required": true}, {"field": "currency", "type": "select", "label": "Currency", "options": ["USD", "EUR", "GBP", "INR"], "default": "USD"}, {"field": "emd_timeline", "type": "number", "label": "Payment Timeline (days)", "default": 7}, {"field": "emd_refundable", "type": "select", "label": "Refundability", "options": ["fully refundable", "partially refundable", "non-refundable"], "default": "partially refundable"}, {"field": "emd_adjustment", "type": "select", "label": "Adjustment Terms", "options": ["adjusted", "not adjusted"], "default": "adjusted"}]',
  'medium',
  false,
  ARRAY['vendor_onboarding', 'consulting_agreement', 'service_agreement']
),
(
  'Bank Guarantee',
  'bank_guarantee',
  'Party B shall provide a Bank Guarantee from a reputable financial institution for an amount of {{bg_amount}} {{currency}}, representing {{bg_percentage}}% of the total contract value. The Bank Guarantee shall remain valid for {{bg_validity}} months from the effective date and shall be {{bg_type}}. The guarantee may be invoked in case of {{bg_invocation_conditions}}.',
  'Bank Guarantees protect against non-performance. Ensure the issuing bank is acceptable. Consider irrevocable guarantees for high-risk contracts. Typical range: 5-10% of contract value.',
  '[{"field": "bg_amount", "type": "number", "label": "BG Amount", "required": true}, {"field": "currency", "type": "select", "label": "Currency", "options": ["USD", "EUR", "GBP", "INR"], "default": "USD"}, {"field": "bg_percentage", "type": "number", "label": "Percentage of Contract", "default": 10}, {"field": "bg_validity", "type": "number", "label": "Validity (months)", "default": 12}, {"field": "bg_type", "type": "select", "label": "BG Type", "options": ["irrevocable", "revocable", "conditional"], "default": "irrevocable"}, {"field": "bg_invocation_conditions", "type": "text", "label": "Invocation Conditions", "default": "material breach or non-performance"}]',
  'high',
  false,
  ARRAY['vendor_onboarding', 'service_agreement']
),
(
  'Intellectual Property Protection',
  'ip_protection',
  'All Intellectual Property rights, including but not limited to patents, copyrights, trademarks, trade secrets, and any work product created under this agreement shall {{ip_ownership}}. Party B {{ip_license}} to Party A. Party B agrees to maintain confidentiality and not {{ip_restrictions}} without prior written consent. Any breach shall result in {{ip_remedies}}.',
  'IP clauses are critical. Clearly define ownership, especially for work-for-hire. Consider future use rights and derivative works. Include assignment clauses and moral rights waivers where applicable.',
  '[{"field": "ip_ownership", "type": "select", "label": "IP Ownership", "options": ["vest exclusively with Party A", "be jointly owned by both parties", "remain with Party B with license to Party A"], "default": "vest exclusively with Party A"}, {"field": "ip_license", "type": "select", "label": "License Type", "options": ["grants a non-exclusive, royalty-free license", "grants an exclusive license", "grants a limited license"], "default": "grants a non-exclusive, royalty-free license"}, {"field": "ip_restrictions", "type": "text", "label": "Usage Restrictions", "default": "use, reproduce, or distribute the IP for purposes outside this agreement"}, {"field": "ip_remedies", "type": "text", "label": "Breach Remedies", "default": "immediate termination and liability for damages including legal fees"}]',
  'critical',
  true,
  ARRAY['consulting_agreement', 'vendor_onboarding', 'service_agreement']
),
(
  'Service Level Agreement (SLA)',
  'sla',
  'Party B commits to maintaining the following service levels: {{sla_uptime}}% uptime, response time of {{sla_response_time}} hours, and resolution time of {{sla_resolution_time}} hours for {{sla_severity}}. Performance will be measured {{sla_measurement}}. Failure to meet SLA targets for {{sla_breach_threshold}} consecutive periods shall entitle Party A to {{sla_remedies}}.',
  'SLAs define performance expectations. Be realistic but firm. Include measurement methodology, exclusions (planned maintenance), and proportional remedies. Consider tiered SLAs for different severity levels.',
  '[{"field": "sla_uptime", "type": "number", "label": "Uptime Percentage", "default": 99.9}, {"field": "sla_response_time", "type": "number", "label": "Response Time (hours)", "default": 2}, {"field": "sla_resolution_time", "type": "number", "label": "Resolution Time (hours)", "default": 24}, {"field": "sla_severity", "type": "select", "label": "Severity Level", "options": ["critical issues", "high priority issues", "all issues"], "default": "critical issues"}, {"field": "sla_measurement", "type": "select", "label": "Measurement Period", "options": ["monthly", "quarterly", "annually"], "default": "monthly"}, {"field": "sla_breach_threshold", "type": "number", "label": "Breach Threshold", "default": 2}, {"field": "sla_remedies", "type": "text", "label": "Remedies", "default": "service credits of 10% of monthly fees or right to terminate without penalty"}]',
  'high',
  true,
  ARRAY['service_agreement', 'vendor_onboarding']
),
(
  'Confidentiality & Non-Disclosure',
  'confidentiality',
  'Both parties agree to maintain strict confidentiality of all Confidential Information disclosed during the term of this agreement and for {{confidentiality_period}} years thereafter. Confidential Information includes {{confidentiality_scope}}. Exceptions include information that is {{confidentiality_exceptions}}. Breach of this clause shall result in {{confidentiality_remedies}}.',
  'NDAs are fundamental. Define "Confidential Information" broadly. Standard exceptions: publicly available, independently developed, lawfully obtained. Consider mutual vs. unilateral NDA needs.',
  '[{"field": "confidentiality_period", "type": "number", "label": "Confidentiality Period (years)", "default": 3}, {"field": "confidentiality_scope", "type": "text", "label": "Scope of Confidential Info", "default": "technical data, business processes, customer lists, pricing, and proprietary information"}, {"field": "confidentiality_exceptions", "type": "text", "label": "Exceptions", "default": "publicly available, independently developed, or required by law to be disclosed"}, {"field": "confidentiality_remedies", "type": "text", "label": "Breach Remedies", "default": "injunctive relief and damages including attorney fees"}]',
  'critical',
  true,
  ARRAY['nda', 'consulting_agreement', 'vendor_onboarding', 'service_agreement']
),
(
  'Payment Terms',
  'payment_terms',
  'Party A shall pay Party B a total amount of {{payment_amount}} {{currency}} as follows: {{payment_schedule}}. Payments shall be made within {{payment_due_days}} days of invoice receipt via {{payment_method}}. Late payments shall incur interest at {{payment_interest_rate}}% per month. Taxes shall be {{payment_tax_responsibility}}.',
  'Clear payment terms prevent disputes. Specify payment milestones, method, and late payment consequences. Consider retention amounts and escrow for large projects.',
  '[{"field": "payment_amount", "type": "number", "label": "Total Amount", "required": true}, {"field": "currency", "type": "select", "label": "Currency", "options": ["USD", "EUR", "GBP", "INR"], "default": "USD"}, {"field": "payment_schedule", "type": "text", "label": "Payment Schedule", "default": "50% upfront, 30% at midpoint, 20% upon completion"}, {"field": "payment_due_days", "type": "number", "label": "Payment Due (days)", "default": 30}, {"field": "payment_method", "type": "select", "label": "Payment Method", "options": ["wire transfer", "check", "ACH", "credit card"], "default": "wire transfer"}, {"field": "payment_interest_rate", "type": "number", "label": "Late Payment Interest (%)", "default": 1.5}, {"field": "payment_tax_responsibility", "type": "select", "label": "Tax Responsibility", "options": ["borne by Party A", "borne by Party B", "shared equally"], "default": "borne by Party A"}]',
  'high',
  true,
  ARRAY['consulting_agreement', 'vendor_onboarding', 'service_agreement']
),
(
  'Termination Clause',
  'termination',
  'Either party may terminate this agreement {{termination_notice}} days written notice. Immediate termination is permitted in case of {{termination_breach}}. Upon termination, {{termination_obligations}}. Party B shall {{termination_deliverables}}. {{termination_payment}} shall be made for work completed up to the termination date.',
  'Termination clauses protect both parties. Include notice periods, termination for cause/convenience, and post-termination obligations. Consider return of materials, final payments, and survival of certain clauses.',
  '[{"field": "termination_notice", "type": "number", "label": "Notice Period (days)", "default": 30}, {"field": "termination_breach", "type": "text", "label": "Material Breach Conditions", "default": "material breach, insolvency, or violation of confidentiality"}, {"field": "termination_obligations", "type": "text", "label": "Post-Termination Obligations", "default": "all confidentiality obligations shall survive"}, {"field": "termination_deliverables", "type": "text", "label": "Deliverables Treatment", "default": "return all confidential materials and work product"}, {"field": "termination_payment", "type": "select", "label": "Payment Terms", "options": ["Pro-rated payment", "Full payment", "No payment"], "default": "Pro-rated payment"}]',
  'medium',
  true,
  ARRAY['consulting_agreement', 'vendor_onboarding', 'service_agreement']
);

-- Insert default templates
INSERT INTO public.contract_templates (template_name, template_type, description, category, jurisdiction) VALUES
('Standard NDA', 'nda', 'Mutual Non-Disclosure Agreement for business discussions', 'General', 'international'),
('Consulting Services Agreement', 'consulting_agreement', 'Comprehensive consulting agreement with IP and payment terms', 'Professional Services', 'international'),
('Vendor Onboarding Contract', 'vendor_onboarding', 'Vendor agreement including EMD, BG, and SLA requirements', 'Procurement', 'international');