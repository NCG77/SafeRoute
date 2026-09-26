/**
 * User trust score in [0, 100]. New accounts start at 50.
 * Counts are already decayed by the caller (half-life 90 days).
 */

export type TrustCounts = {
  accurateReports: number;
  verifiedReports: number;
  participationWeeks: number;
  spamReports: number;
  fakeReports: number;
  locationMismatches: number;
  deletedReports: number;
};

export type TrustLevel = "untrusted" | "low" | "standard" | "trusted" | "guardian";

export type TrustResult = {
  score: number;
  level: TrustLevel;
  reportWeight: number;
};

const HALF_LIFE_DAYS = 90;

export function decayWeight(ageDays: number): number {
  return Math.pow(0.5, Math.max(0, ageDays) / HALF_LIFE_DAYS);
}

export function calculateTrustScore(counts: TrustCounts): TrustResult {
  const raw =
    50 +
    8 * counts.accurateReports +
    12 * counts.verifiedReports +
    4 * counts.participationWeeks -
    15 * counts.spamReports -
    20 * counts.fakeReports -
    10 * counts.locationMismatches -
    6 * counts.deletedReports;
  const score = Math.round(Math.min(100, Math.max(0, raw)));
  const level = trustLevel(score);
  return { score, level, reportWeight: reportWeightForLevel(level) };
}

export function trustLevel(score: number): TrustLevel {
  if (score <= 20) return "untrusted";
  if (score <= 40) return "low";
  if (score <= 60) return "standard";
  if (score <= 80) return "trusted";
  return "guardian";
}

export function reportWeightForLevel(level: TrustLevel): number {
  switch (level) {
    case "untrusted":
      return 0;
    case "low":
      return 0.25;
    case "standard":
      return 0.6;
    case "trusted":
      return 1;
    case "guardian":
      return 1.4;
  }
}

/** Weight of one report inside a segment's community rating. */
export function weightedReportContribution(input: {
  trustScore: number;
  ageDays: number;
  verified: boolean;
}): number {
  const weight = reportWeightForLevel(trustLevel(input.trustScore));
  const recency = decayWeight(input.ageDays);
  const verifiedBoost = input.verified ? 1.5 : 1;
  return weight * recency * verifiedBoost;
}

export const REPORT_LIMIT_PER_HOUR = 5;
export const DUPLICATE_WINDOW_MS = 60 * 60 * 1000;
export const MAX_LOCATION_MISMATCH_M = 200;

export function isRateLimited(reportTimestampsMs: number[], nowMs: number): boolean {
  const hourAgo = nowMs - 60 * 60 * 1000;
  const recent = reportTimestampsMs.filter((ts) => ts >= hourAgo);
  return recent.length >= REPORT_LIMIT_PER_HOUR;
}

export function isDuplicateReport(input: {
  lastGeohash: string | null;
  lastCategory: string | null;
  lastTimestampMs: number | null;
  geohash: string;
  category: string;
  nowMs: number;
}): boolean {
  if (!input.lastGeohash || input.lastTimestampMs == null) return false;
  return (
    input.lastGeohash === input.geohash &&
    input.lastCategory === input.category &&
    input.nowMs - input.lastTimestampMs < DUPLICATE_WINDOW_MS
  );
}

export function isLocationMismatch(distanceFromDeviceM: number): boolean {
  return distanceFromDeviceM > MAX_LOCATION_MISMATCH_M;
}
