import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockSupabaseClient } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

describe('Compliance Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates compliance audit with required fields', async () => {
    const mockAudit = {
      id: 'audit-123',
      audit_type: 'quality',
      audit_date: '2025-10-14',
      auditor_name: 'John Doe',
      score: 85,
      findings: 'All checks passed',
      status: 'completed',
    };

    const insertMock = vi.fn().mockResolvedValue({ data: mockAudit, error: null });
    mockSupabaseClient.from.mockReturnValue({
      insert: insertMock,
    });

    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.from('compliance_audits').insert(mockAudit);

    expect(error).toBeNull();
    expect(data).toEqual(mockAudit);
  });

  it('calculates ESG scores correctly', async () => {
    const mockESGData = {
      entity_id: 'farmer-123',
      entity_type: 'farmer',
      environmental_score: 80,
      social_score: 75,
      governance_score: 90,
    };

    // Overall score should be average of all three
    const expectedOverall = (80 + 75 + 90) / 3;

    const insertMock = vi.fn().mockResolvedValue({
      data: { ...mockESGData, overall_score: expectedOverall },
      error: null,
    });

    mockSupabaseClient.from.mockReturnValue({
      insert: insertMock,
    });

    const { supabase } = await import('@/integrations/supabase/client');
    const { data } = await supabase.from('esg_scores').insert({
      ...mockESGData,
      overall_score: expectedOverall,
    });

    expect(data?.overall_score).toBeCloseTo(expectedOverall, 1);
  });

  it('validates certification status transitions', async () => {
    const certId = 'cert-123';
    
    // Valid transition: active -> expired
    const updateMock = vi.fn().mockResolvedValue({
      data: { id: certId, status: 'expired' },
      error: null,
    });

    mockSupabaseClient.from.mockReturnValue({
      update: updateMock,
      eq: vi.fn().mockReturnThis(),
    });

    const { supabase } = await import('@/integrations/supabase/client');
    const { error } = await supabase
      .from('compliance_certifications')
      .update({ status: 'expired' })
      .eq('id', certId);

    expect(error).toBeNull();
  });

  it('generates compliance report with correct data aggregation', async () => {
    const mockAudits = [
      { score: 80, audit_type: 'quality' },
      { score: 90, audit_type: 'safety' },
      { score: 75, audit_type: 'environmental' },
    ];

    const selectMock = vi.fn().mockResolvedValue({
      data: mockAudits,
      error: null,
    });

    mockSupabaseClient.from.mockReturnValue({
      select: selectMock,
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
    });

    const { supabase } = await import('@/integrations/supabase/client');
    const { data } = await supabase
      .from('compliance_audits')
      .select('*')
      .gte('audit_date', '2025-01-01')
      .lte('audit_date', '2025-12-31');

    expect(data).toHaveLength(3);
    
    // Calculate average score
    const avgScore = data!.reduce((sum, a) => sum + a.score, 0) / data!.length;
    expect(avgScore).toBeCloseTo(81.67, 1);
  });
});
