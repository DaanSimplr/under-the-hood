"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useProgress } from "@/lib/progress";

let started = false;

/** Rehydrates the persisted progress once on the client. */
export function useStartProgressHydration() {
  useEffect(() => {
    if (started) return;
    started = true;
    void useProgress.persist.rehydrate();
  }, []);
}

/** False until saved progress has been read. Use it to avoid showing "0 done" before data arrives. */
export function useProgressHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => useProgress.persist.onFinishHydration(cb),
    () => useProgress.persist.hasHydrated(),
    () => false,
  );
}
