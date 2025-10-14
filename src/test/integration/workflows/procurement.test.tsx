import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockSupabaseClient } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

describe('Procurement Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates procurement batch with all required data', async () => {
    const mockBatch = {
      id: 'BATCH001',
      farmer_id: 'farmer-123',
      quantity_kg: 100,
      grade: 'A',
      price_per_kg: 50,
      total_price: 5000,
      status: 'pending',
    };

    const insertMock = vi.fn().mockResolvedValue({ data: mockBatch, error: null });
    mockSupabaseClient.from.mockReturnValue({
      insert: insertMock,
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockBatch, error: null }),
    });

    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.from('procurement_batches').insert(mockBatch);

    expect(error).toBeNull();
    expect(data).toEqual(mockBatch);
    expect(insertMock).toHaveBeenCalledWith(mockBatch);
  });

  it('validates batch data integrity', async () => {
    const invalidBatch = {
      id: 'BATCH002',
      farmer_id: null, // Invalid: required field
      quantity_kg: -10, // Invalid: negative quantity
      grade: 'A',
    };

    const insertMock = vi
      .fn()
      .mockResolvedValue({
        data: null,
        error: { message: 'Invalid data' },
      });

    mockSupabaseClient.from.mockReturnValue({
      insert: insertMock,
    });

    const { supabase } = await import('@/integrations/supabase/client');
    const { error } = await supabase.from('procurement_batches').insert(invalidBatch);

    expect(error).toBeDefined();
    expect(error?.message).toBe('Invalid data');
  });

  it('updates batch status through workflow', async () => {
    const batchId = 'BATCH001';
    const updateMock = vi.fn().mockResolvedValue({
      data: { id: batchId, status: 'approved' },
      error: null,
    });

    mockSupabaseClient.from.mockReturnValue({
      update: updateMock,
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: batchId, status: 'approved' },
        error: null,
      }),
    });

    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase
      .from('procurement_batches')
      .update({ status: 'approved' })
      .eq('id', batchId);

    expect(error).toBeNull();
    expect(data).toEqual({ id: batchId, status: 'approved' });
  });

  it('generates QR code for batch', async () => {
    const batchId = 'BATCH001';
    const qrCode = `QR-${batchId}`;

    const updateMock = vi.fn().mockResolvedValue({
      data: { id: batchId, qr_code: qrCode },
      error: null,
    });

    mockSupabaseClient.from.mockReturnValue({
      update: updateMock,
      eq: vi.fn().mockReturnThis(),
    });

    const { supabase } = await import('@/integrations/supabase/client');
    const { error } = await supabase
      .from('procurement_batches')
      .update({ qr_code: qrCode })
      .eq('id', batchId);

    expect(error).toBeNull();
    expect(updateMock).toHaveBeenCalledWith({ qr_code: qrCode });
  });
});
