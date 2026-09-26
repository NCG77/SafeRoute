/**
 * Passive incident checks. A finding is shown to the user before SOS
 * unless Safe Walk is already in the unanswered check-in countdown.
 */

export type IncidentKind =
  | "sudden_sprint"
  | "phone_drop"
  | "violent_shaking"
  | "long_stationary"
  | "high_risk_area"
  | "unusual_movement";

export type SensorSample = {
  timestampMs: number;
  /** Metres per second from GPS. */
  speedMps: number | null;
  /** Acceleration magnitude in g, gravity included. */
  accelG: number | null;
  /** Gyroscope magnitude in rad/s. */
  gyroRadPerSec: number | null;
  latitude: number | null;
  longitude: number | null;
  /** Degrees, 0–360. */
  headingDeg: number | null;
  /** Current segment safety score, if known. */
  safetyScore: number | null;
};

export type IncidentFinding = {
  kind: IncidentKind;
  /** Consecutive windows required before the confirmation dialog. */
  confirmations: number;
};

const SPRINT_SPEED_MPS = 4.5;
const SPRINT_PREVIOUS_MPS = 1.5;
const FREEFALL_G = 0.25;
const IMPACT_G = 3.5;
const SHAKE_GYRO = 4;
const HIGH_RISK_SCORE = 30;
const HEADING_FLIP_DEG = 120;

export function evaluateSensors(samples: SensorSample[]): IncidentFinding | null {
  if (samples.length < 2) return null;
  const latest = samples[samples.length - 1];
  const previous = samples[samples.length - 2];

  if (
    previous.speedMps != null &&
    latest.speedMps != null &&
    previous.speedMps < SPRINT_PREVIOUS_MPS &&
    latest.speedMps > SPRINT_SPEED_MPS
  ) {
    return { kind: "sudden_sprint", confirmations: 2 };
  }

  if (
    previous.accelG != null &&
    latest.accelG != null &&
    previous.accelG < FREEFALL_G &&
    latest.accelG > IMPACT_G
  ) {
    return { kind: "phone_drop", confirmations: 2 };
  }

  const recent = samples.slice(-5);
  const shaking = recent.filter(
    (sample) => sample.gyroRadPerSec != null && sample.gyroRadPerSec > SHAKE_GYRO
  );
  if (shaking.length >= 3) {
    return { kind: "violent_shaking", confirmations: 2 };
  }

  if (latest.safetyScore != null && latest.safetyScore < HIGH_RISK_SCORE) {
    return { kind: "high_risk_area", confirmations: 2 };
  }

  if (unusualHeading(recent)) {
    return { kind: "unusual_movement", confirmations: 2 };
  }

  return null;
}

function unusualHeading(samples: SensorSample[]): boolean {
  const headings = samples
    .map((sample) => sample.headingDeg)
    .filter((heading): heading is number => heading != null);
  if (headings.length < 4) return false;
  let flips = 0;
  for (let index = 1; index < headings.length; index += 1) {
    const delta = angleDelta(headings[index - 1], headings[index]);
    if (delta > HEADING_FLIP_DEG) flips += 1;
  }
  return flips >= 3;
}

function angleDelta(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/** Second confirmation within 20 seconds escalates to the dialog. */
export function shouldPromptUser(
  findings: IncidentFinding[],
  nowMs: number,
  previousMs: number | null
): boolean {
  if (findings.length < 2) return false;
  if (findings[0].kind !== findings[1].kind) return false;
  if (previousMs == null) return false;
  return nowMs - previousMs <= 20_000;
}
