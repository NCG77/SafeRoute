"use strict";
/**
 * User trust score in [0, 100]. New accounts start at 50.
 * Counts are already decayed by the caller (half-life 90 days).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_LOCATION_MISMATCH_M = exports.DUPLICATE_WINDOW_MS = exports.REPORT_LIMIT_PER_HOUR = void 0;
exports.decayWeight = decayWeight;
exports.calculateTrustScore = calculateTrustScore;
exports.trustLevel = trustLevel;
exports.reportWeightForLevel = reportWeightForLevel;
exports.weightedReportContribution = weightedReportContribution;
exports.isRateLimited = isRateLimited;
exports.isDuplicateReport = isDuplicateReport;
exports.isLocationMismatch = isLocationMismatch;
const HALF_LIFE_DAYS = 90;
function decayWeight(ageDays) {
    return Math.pow(0.5, Math.max(0, ageDays) / HALF_LIFE_DAYS);
}
function calculateTrustScore(counts) {
    const raw = 50 +
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
function trustLevel(score) {
    if (score <= 20)
        return "untrusted";
    if (score <= 40)
        return "low";
    if (score <= 60)
        return "standard";
    if (score <= 80)
        return "trusted";
    return "guardian";
}
function reportWeightForLevel(level) {
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
function weightedReportContribution(input) {
    const weight = reportWeightForLevel(trustLevel(input.trustScore));
    const recency = decayWeight(input.ageDays);
    const verifiedBoost = input.verified ? 1.5 : 1;
    return weight * recency * verifiedBoost;
}
exports.REPORT_LIMIT_PER_HOUR = 5;
exports.DUPLICATE_WINDOW_MS = 60 * 60 * 1000;
exports.MAX_LOCATION_MISMATCH_M = 200;
function isRateLimited(reportTimestampsMs, nowMs) {
    const hourAgo = nowMs - 60 * 60 * 1000;
    const recent = reportTimestampsMs.filter((ts) => ts >= hourAgo);
    return recent.length >= exports.REPORT_LIMIT_PER_HOUR;
}
function isDuplicateReport(input) {
    if (!input.lastGeohash || input.lastTimestampMs == null)
        return false;
    return (input.lastGeohash === input.geohash &&
        input.lastCategory === input.category &&
        input.nowMs - input.lastTimestampMs < exports.DUPLICATE_WINDOW_MS);
}
function isLocationMismatch(distanceFromDeviceM) {
    return distanceFromDeviceM > exports.MAX_LOCATION_MISMATCH_M;
}
