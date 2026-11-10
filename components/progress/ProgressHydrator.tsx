"use client";

import { useStartProgressHydration } from "./useProgressHydrated";

/** Mounted once in the site shell: loads saved progress after the page hydrates. */
export function ProgressHydrator() {
  useStartProgressHydration();
  return null;
}
