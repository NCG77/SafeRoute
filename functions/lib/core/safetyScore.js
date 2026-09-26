"use strict";
/**
 * Real-time safety score in [0, 100].
 * Higher is safer.
 *
 * The weighted formula is the score the app and Cloud Functions compute on
 * every request. XGBoost, when a published model returns pRisk, is blended
 * in by applyXgbRisk. There is no trained booster in this repository.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SAFETY_WEIGHTS = exports.SAFETY_FEATURES = void 0;
exports.clamp = clamp;
exports.normalizeTimeOfDay = normalizeTimeOfDay;
exports.normalizeDayOfWeek = normalizeDayOfWeek;
exports.normalizeCommunityRating = normalizeCommunityRating;
exports.normalizeVisibility = normalizeVisibility;
exports.normalizePoliceProximity = normalizePoliceProximity;
exports.normalizeIncidentCount = normalizeIncidentCount;
exports.buildSafetyVector = buildSafetyVector;
exports.calculateSafetyScore = calculateSafetyScore;
exports.applyXgbRisk = applyXgbRisk;
exports.round1 = round1;
exports.legacySafetyLabel = legacySafetyLabel;
exports.SAFETY_FEATURES = [
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
];
/** Weights sum to 1. Community reports and time of day dominate. */
exports.SAFETY_WEIGHTS = {
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
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
/** 1 = safer. Night and early morning are the low plateau. */
function normalizeTimeOfDay(hour) {
    const h = ((hour % 24) + 24) % 24;
    if (h >= 10 && h < 17)
        return 1;
    if (h >= 17 && h < 21)
        return 1 - 0.55 * ((h - 17) / 4);
    if (h >= 21 || h < 5)
        return 0.25;
    return 0.25 + 0.75 * ((h - 5) / 5);
}
/** Friday and Saturday nights carry more recorded risk in the beta reviews. */
function normalizeDayOfWeek(day) {
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
function normalizeCommunityRating(rating) {
    return clamp((rating - 1) / 4, 0, 1);
}
function normalizeVisibility(visibilityKm) {
    return clamp(visibilityKm / 10, 0, 1);
}
/** 0 m → 1, 2000 m or more → 0. */
function normalizePoliceProximity(distanceM) {
    return clamp(1 - distanceM / 2000, 0, 1);
}
/** 0 incidents → 1. Each additional verified incident reduces the feature. */
function normalizeIncidentCount(count) {
    return 1 / (1 + Math.max(0, count));
}
function buildSafetyVector(input) {
    return {
        timeOfDay: normalizeTimeOfDay(input.hour),
        dayOfWeek: normalizeDayOfWeek(input.dayOfWeek),
        communityRating: input.communityRating == null
            ? null
            : normalizeCommunityRating(input.communityRating),
        crowdDensity: input.crowdDensity == null ? null : clamp(input.crowdDensity, 0, 1),
        streetLighting: input.streetLighting == null ? null : clamp(input.streetLighting, 0, 1),
        weatherVisibility: input.visibilityKm == null ? null : normalizeVisibility(input.visibilityKm),
        policeProximity: input.policeDistanceM == null
            ? null
            : normalizePoliceProximity(input.policeDistanceM),
        cctvAvailability: input.cctv == null ? null : clamp(input.cctv, 0, 1),
        verifiedIncidents: input.verifiedIncidents30d == null
            ? null
            : normalizeIncidentCount(input.verifiedIncidents30d),
        historicalReports: input.historicalReports == null
            ? null
            : normalizeIncidentCount(input.historicalReports),
    };
}
/**
 * Renormalizes weights over observed features only.
 * Confidence is the sum of the original weights of observed features.
 */
function calculateSafetyScore(input) {
    const vector = buildSafetyVector(input);
    let observedWeight = 0;
    for (const feature of exports.SAFETY_FEATURES) {
        if (vector[feature] != null)
            observedWeight += exports.SAFETY_WEIGHTS[feature];
    }
    const weightsUsed = {};
    let weighted = 0;
    if (observedWeight > 0) {
        for (const feature of exports.SAFETY_FEATURES) {
            const value = vector[feature];
            if (value == null) {
                weightsUsed[feature] = 0;
                continue;
            }
            const weight = exports.SAFETY_WEIGHTS[feature] / observedWeight;
            weightsUsed[feature] = weight;
            weighted += weight * value;
        }
    }
    const weightedScore = clamp(weighted * 100, 0, 100);
    const blended = applyXgbRisk(weightedScore, input.xgbRisk, input.xgbConfidence);
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
function applyXgbRisk(weightedScore, xgbRisk, xgbConfidence) {
    if (xgbRisk == null || xgbConfidence == null || xgbConfidence <= 0) {
        return { score: weightedScore, modelApplied: false };
    }
    const alpha = clamp(xgbConfidence, 0, 1);
    const p = clamp(xgbRisk, 0, 1);
    const score = (1 - alpha) * weightedScore + alpha * 100 * (1 - p);
    return { score: clamp(score, 0, 100), modelApplied: true };
}
function round1(value) {
    return Math.round(value * 10) / 10;
}
/**
 * Legacy three-way label kept so existing navigation guards keep working.
 * The map itself uses the continuous score.
 */
function legacySafetyLabel(score, confidence) {
    if (confidence < 0.3)
        return "unreviewed";
    if (score >= 70)
        return "safe";
    if (score >= 40)
        return "caution";
    return "dangerous";
}
