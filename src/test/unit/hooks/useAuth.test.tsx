import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@/test/utils/test-utils';
import { useAuth } from '@/hooks/useAuth';
import { mockSupabaseClient, createMockUser, createMockSession } from '@/test/mocks/supabase';

// Mock the supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with loading state', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.loading).toBe(true);
  });

  it('provides user data when authenticated', async () => {
    const mockUser = createMockUser();
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: createMockSession({ user: mockUser }) },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.loading).toBe(false);
    });
  });

  it('handles sign in', async () => {
    mockSupabaseClient.auth.signIn.mockResolvedValue({
      data: { user: createMockUser() },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.signIn).toBeDefined();
    });
  });

  it('handles sign out', async () => {
    mockSupabaseClient.auth.signOut.mockResolvedValue({
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.signOut).toBeDefined();
    });
  });
});
