import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuditLog } from '@/hooks/useAuditLog';
import { mockSupabaseClient, createMockUser } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: createMockUser(),
    userRole: 'admin',
  }),
}));

describe('useAuditLog Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides logAction function', () => {
    const { result } = renderHook(() => useAuditLog());
    expect(result.current.logAction).toBeDefined();
  });

  it('logs action with correct data', async () => {
    const insertMock = vi.fn().mockResolvedValue({ data: {}, error: null });
    mockSupabaseClient.from.mockReturnValue({
      insert: insertMock,
    });

    const { result } = renderHook(() => useAuditLog());

    await act(async () => {
      await result.current.logAction({
        action: 'CREATE',
        resource: 'farmers',
        resourceId: '123',
        dataSnapshot: { name: 'Test Farmer' },
      });
    });

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('audit_logs');
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'CREATE',
        resource: 'farmers',
        resource_id: '123',
        status: 'success',
      })
    );
  });

  it('handles errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSupabaseClient.from.mockReturnValue({
      insert: vi.fn().mockRejectedValue(new Error('Database error')),
    });

    const { result } = renderHook(() => useAuditLog());

    await act(async () => {
      await result.current.logAction({
        action: 'DELETE',
        resource: 'batches',
      });
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to log audit event:',
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });
});
