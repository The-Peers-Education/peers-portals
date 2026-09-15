"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";

export function useHasHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const finish = () => setHydrated(true);
    const unsubscribe = useAuthStore.persist.onFinishHydration(finish);
    void useAuthStore.persist.rehydrate();
    if (useAuthStore.persist.hasHydrated()) finish();
    return unsubscribe;
  }, []);

  return hydrated;
}
