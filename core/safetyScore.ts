/**
 * Real-time safety score in [0, 100].
 * Higher is safer.
 *
 * The weighted formula is the score the app and Cloud Functions compute on
 * every request. XGBoost, when a published model returns pRisk, is blended
 * in by applyXgbRisk. There is no trained booster in this repository.
 */

export const SAFETY_FEATURES = [
  "timeOfDay",
  "dayOfWeek",
  "communityRating",
  "crowdDensity",
  "streetLighting",
  "weatherVisibility",
  "policeProximity",
  "cctvAvailability",
  "verifiedIncidents",
  "historicalReports",
] as const;

export type SafetyFeature = (typeof SAFETY_FEATURES)[number];

/** Weights sum to 1. Community reports and time of day dominate. */
export const SAFETY_WEIGHTS: Record<SafetyFeature, number> = {
  timeOfDay: 0.14,
  dayOfWeek: 0.06,
  communityRating: 0.22,
  crowdDensity: 0.1,
  streetLighting: 0.12,
  weatherVisibility: 0.06,
  policeProximity: 0.08,
  cctvAvailability: 0.06,
  verifiedIncidents: 0.1,
  historicalReports: 0.06,
};

export type SafetyInputs = {
  /** Local hour in [0, 24). */
  hour: number;
  /** 0 = Sunday … 6 = Saturday. */
  dayOfWeek: number;
  /** Mean community rating in [1, 5], or null when no trusted reports exist. */
  communityRating: number | null;
  /** Safety-oriented density in [0, 1], or null. See crowdDensity.ts. */
  crowdDensity: number | null;
  /** 0 = unlit, 1 = well lit, or null. */
  streetLighting: number | null;
  /** Visibility in kilometres, or null. */
  visibilityKm: number | null;
  /** Metres to the nearest police station, or null. */
  policeDistanceM: number | null;
  /** 0 = none, 1 = verified coverage, or null. */
  cctv: number | null;
  /** Verified incidents in the last 30 days. Null means unknown. */
  verifiedIncidents30d: number | null;
  /** Decayed historical report count. Null means unknown. */
  historicalReports: number | null;
  /**
   * Optional XGBoost P(incident). Null when no model version is published.
   * Range [0, 1], where 1 is highest predicted risk.
   */
  xgbRisk: number | null;
  /** Model confidence in [0, 1]. Ignored when xgbRisk is null. */
  xgbConfidence: number | null;
};

export type SafetyVector = Record<SafetyFeature, number | null>;

export type SafetyScoreResult = {
  score: number;
  weightedScore: number;
  confidence: number;
  vector: SafetyVector;
  weightsUsed: Record<SafetyFeature, number>;
  modelApplied: boolean;
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** 1 = safer. Night and early morning are the low plateau. */
export function normalizeTimeOfDay(hour: number): number {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 10 && h < 17) return 1;
  if (h >= 17 && h < 21) return 1 - 0.55 * ((h - 17) / 4);
  if (h >= 21 || h < 5) return 0.25;
  return 0.25 + 0.75 * ((h - 5) / 5);
}

/** Friday and Saturday nights carry more recorded risk in the beta reviews. */
export function normalizeDayOfWeek(day: number): number {
  switch (Math.trunc(day)) {
    case 1:
    case 2:
    case 3:
    case 4:
      return 0.85;
    case 5:
      return 0.7;
    case 6:
      return 0.6;
    case 0:
      return 0.75;
    default:
      return 0.75;
  }
}

export function normalizeCommunityRating(rating: number): number {
  return clamp((rating - 1) / 4, 0, 1);
}

export function normalizeVisibility(visibilityKm: number): number {
  return clamp(visibilityKm / 10, 0, 1);
}

/** 0 m → 1, 2000 m or more → 0. */
export function normalizePoliceProximity(distanceM: number): number {
  return clamp(1 - distanceM / 2000, 0, 1);
}

/** 0 incidents → 1. Each additional verified incident reduces the feature. */
export function normalizeIncidentCount(count: number): number {
  return 1 / (1 + Math.max(0, count));
}

export function buildSafetyVector(input: SafetyInputs): SafetyVector {
  return {
    timeOfDay: normalizeTimeOfDay(input.hour),
    dayOfWeek: normalizeDayOfWeek(input.dayOfWeek),
    communityRating:
      input.communityRating == null
        ? null
        : normalizeCommunityRating(input.communityRating),
    crowdDensity:
      input.crowdDensity == null ? null : clamp(input.crowdDensity, 0, 1),
    streetLighting:
      input.streetLighting == null ? null : clamp(input.streetLighting, 0, 1),
    weatherVisibility:
      input.visibilityKm == null ? null : normalizeVisibility(input.visibilityKm),
    policeProximity:
      input.policeDistanceM == null
        ? null
        : normalizePoliceProximity(input.policeDistanceM),
    cctvAvailability:
      input.cctv == null ? null : clamp(input.cctv, 0, 1),
    verifiedIncidents:
      input.verifiedIncidents30d == null
        ? null
        : normalizeIncidentCount(input.verifiedIncidents30d),
    historicalReports:
      input.historicalReports == null
        ? null
        : normalizeIncidentCount(input.historicalReports),
  };
}

/**
 * Renormalizes weights over observed features only.
 * Confidence is the sum of the original weights of observed features.
 */
export function calculateSafetyScore(input: SafetyInputs): SafetyScoreResult {
  const vector = buildSafetyVector(input);
  let observedWeight = 0;
  for (const feature of SAFETY_FEATURES) {
    if (vector[feature] != null) observedWeight += SAFETY_WEIGHTS[feature];
  }

  const weightsUsed = {} as Record<SafetyFeature, number>;
  let weighted = 0;
  if (observedWeight > 0) {
    for (const feature of SAFETY_FEATURES) {
      const value = vector[feature];
      if (value == null) {
        weightsUsed[feature] = 0;
        continue;
      }
      const weight = SAFETY_WEIGHTS[feature] / observedWeight;
      weightsUsed[feature] = weight;
      weighted += weight * value;
    }
  }

  const weightedScore = clamp(weighted * 100, 0, 100);
  const blended = applyXgbRisk(
    weightedScore,
    input.xgbRisk,
    input.xgbConfidence
  );

  return {
    score: round1(blended.score),
    weightedScore: round1(weightedScore),
    confidence: round1(observedWeight),
    vector,
    weightsUsed,
    modelApplied: blended.modelApplied,
  };
}

/**
 * S = (1 - α) * S_weighted + α * 100 * (1 - pRisk)
 * α is the published model confidence. α = 0 when no model is loaded.
 */
export function applyXgbRisk(
  weightedScore: number,
  xgbRisk: number | null,
  xgbConfidence: number | null
): { score: number; modelApplied: boolean } {
  if (xgbRisk == null || xgbConfidence == null || xgbConfidence <= 0) {
    return { score: weightedScore, modelApplied: false };
  }
  const alpha = clamp(xgbConfidence, 0, 1);
  const p = clamp(xgbRisk, 0, 1);
  const score = (1 - alpha) * weightedScore + alpha * 100 * (1 - p);
  return { score: clamp(score, 0, 100), modelApplied: true };
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Legacy three-way label kept so existing navigation guards keep working.
 * The map itself uses the continuous score.
 */
export function legacySafetyLabel(score: number, confidence: number): string {
  if (confidence < 0.3) return "unreviewed";
  if (score >= 70) return "safe";
  if (score >= 40) return "caution";
  return "dangerous";
}
