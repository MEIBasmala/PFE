// src/lib/prefetch.ts
// Call this right after login or on dashboard mount to warm the cache
// so navigating to any page feels instant

import { cachedFetch } from "./apiCache";
import { getPatientProfile, getMyAppointments, getMyProgress, getBlogArticles } from "@/services/api";

/**
 * Prefetch all data the patient dashboard needs in parallel.
 * Call once on PatientDashboard mount (not on every child).
 * Results are stored in apiCache so every useAsync with a matching
 * cacheKey returns immediately without a network round-trip.
 */
export async function prefetchDashboardData(): Promise<void> {
  try {
    await Promise.allSettled([
      cachedFetch("patient:profile",      () => getPatientProfile(),    120_000),
      cachedFetch("patient:appointments", () => getMyAppointments(),     30_000),
      cachedFetch("patient:progress",     () => getMyProgress(),         60_000),
      cachedFetch("blog:all",             () => getBlogArticles({}),    300_000),
    ]);
  } catch {
    // Prefetch is best-effort — errors are silently swallowed
  }
}