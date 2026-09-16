"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/store";

function markHydrated() {
  useAuthStore.getState().setHasHydrated(true);
}

export function useHasHydrated() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  useEffect(() => {
    const unsubscribe = useAuthStore.persist.onFinishHydration(markHydrated);
    void Promise.resolve(useAuthStore.persist.rehydrate()).then(markHydrated, markHydrated);
    if (useAuthStore.persist.hasHydrated()) markHydrated();
    return unsubscribe;
  }, []);

  return hasHydrated;
}
