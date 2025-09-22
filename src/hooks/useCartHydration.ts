"use client";

import { useEffect, useState } from 'react';
import { useCartStore } from '@/store/cart';

/**
 * Custom hook to handle cart hydration state
 * Prevents SSR/CSR mismatches by tracking when Zustand has finished hydrating
 */
export function useCartHydration() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const persistApi: any = (useCartStore as any).persist;
    if (persistApi?.hasHydrated?.()) {
      setHasHydrated(true);
    }
    const unsubscribe = persistApi?.onFinishHydration?.(() => setHasHydrated(true));
    return () => unsubscribe?.();
  }, []);

  return hasHydrated;
}
