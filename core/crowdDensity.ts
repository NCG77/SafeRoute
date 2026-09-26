import { encodeGeohash } from "./geohash";

export type DensityBucket = "empty" | "low" | "moderate" | "high" | "very_high";

export const CROWD_UPDATE_INTERVAL_MS = 60_000;
export const CROWD_MOVE_THRESHOLD_M = 30;
export const CROWD_STATIONARY_STOP_MS = 5 * 60_000;
export const CROWD_GEOHASH_PRECISION = 7;

export function densityBucket(deviceCount: number): DensityBucket {
  if (deviceCount <= 0) return "empty";
  if (deviceCount <= 3) return "low";
  if (deviceCount <= 10) return "moderate";
  if (deviceCount <= 25) return "high";
  return "very_high";
}

/**
 * Crowd feature used by the safety score.
 * A moderate presence is safer for a woman walking than an empty street
 * or a very dense, hard-to-leave crowd.
 */
export function crowdSafetyFeature(bucket: DensityBucket): number {
  switch (bucket) {
    case "empty":
      return 0.2;
    case "low":
      return 0.45;
    case "moderate":
      return 0.85;
    case "high":
      return 0.7;
    case "very_high":
      return 0.55;
  }
}

export type CrowdPing = {
  geohash: string;
  bucketStartMs: number;
};

/**
 * Anonymous ping. The payload has no user id.
 * bucketStartMs is the start of the current minute so repeats in the
 * same cell and minute collapse to one write.
 */
export function buildAnonymousPing(
  latitude: number,
  longitude: number,
  nowMs: number
): CrowdPing {
  const bucketStartMs = nowMs - (nowMs % CROWD_UPDATE_INTERVAL_MS);
  return {
    geohash: encodeGeohash(latitude, longitude, CROWD_GEOHASH_PRECISION),
    bucketStartMs,
  };
}

export function shouldSendCrowdPing(input: {
  movedMeters: number;
  stationaryMs: number;
  elapsedSinceLastPingMs: number;
  safeWalkActive: boolean;
}): boolean {
  if (input.stationaryMs >= CROWD_STATIONARY_STOP_MS && !input.safeWalkActive) {
    return false;
  }
  if (input.elapsedSinceLastPingMs < CROWD_UPDATE_INTERVAL_MS) return false;
  if (input.safeWalkActive) return true;
  return input.movedMeters >= CROWD_MOVE_THRESHOLD_M;
}
