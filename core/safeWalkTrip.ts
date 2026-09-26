/**
 * Safe Walk trip eligibility and walking estimates.
 * Safe Walk: walking only, short distance (≤ 3 km preferred).
 */

import type { DestinationCoordinate } from "@/core/destinationSearch";

/** Soft limit — full Safe Walk experience */
export const SAFE_WALK_SOFT_KM = 3;
/** Hard recommend — allow continue with warning */
export const SAFE_WALK_WARN_KM = 5;
/** Average walking pace used for ETA */
export const WALKING_SPEED_KMH = 5;

export const LAST_GUARDIAN_KEY = "@SafeRoute:lastSafeWalkGuardianId";

export type SafeWalkEligibility =
  | { status: "ok" }
  | { status: "warn"; message: string }
  | { status: "blocked"; message: string };

export function haversineKm(
  a: DestinationCoordinate,
  b: DestinationCoordinate,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function walkingEtaMinutes(distanceKm: number): number {
  if (distanceKm <= 0) return 1;
  return Math.max(1, Math.round((distanceKm / WALKING_SPEED_KMH) * 60));
}

export function evaluateSafeWalkDistance(distanceKm: number): SafeWalkEligibility {
  if (distanceKm > SAFE_WALK_WARN_KM) {
    return {
      status: "blocked",
      message:
        "This destination is over 5 km. Safe Walk is for short walks — use Safe Route instead.",
    };
  }
  if (distanceKm > SAFE_WALK_SOFT_KM) {
    return {
      status: "warn",
      message:
        "This walk is 3–5 km. Safe Route is recommended for longer trips, but you can continue with Safe Walk.",
    };
  }
  return { status: "ok" };
}

export function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export function formatDurationMin(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
