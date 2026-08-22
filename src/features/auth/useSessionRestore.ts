import { useEffect } from 'react';
import { bootstrapSession } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/authStore';

// The access token is held in memory only, so every reload starts with none.
// The refresh cookie outlives the page, so it is exchanged for a session before
// the router gets to decide whether anyone is signed in.
export function useSessionRestore() {
  const restored = useAuthStore((state) => state.restored);

  useEffect(() => {
    if (restored) return;

    bootstrapSession()
      .catch(() => undefined) // No cookie, or it expired: genuinely signed out.
      .finally(() => useAuthStore.getState().markRestored());
  }, [restored]);
}
