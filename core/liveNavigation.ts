/**
 * Live turn-by-turn navigation helpers — snap-to-route, step advance, GMaps-style labels.
 */

export type LatLng = { latitude: number; longitude: number };

export type NavStep = {
  instruction: string;
  /** Google Directions maneuver string, e.g. "turn-left" */
  maneuver: string | null;
  distanceMeters: number;
  durationSeconds: number;
  start: LatLng;
  end: LatLng;
  coordinates: LatLng[];
};

export type LiveNavSnapshot = {
  stepIndex: number;
  instruction: string;
  maneuver: string | null;
  /** MaterialIcons name for the turn card */
  maneuverIcon: string;
  distanceToManeuverMeters: number;
  distanceToManeuverLabel: string;
  remainingMeters: number;
  remainingKm: number;
  remainingMinutes: number;
  /** Degrees clockwise from north — for camera + arrow */
  bearing: number;
  snapped: LatLng;
  traveledCoordinates: LatLng[];
  remainingCoordinates: LatLng[];
  arrived: boolean;
  offRoute: boolean;
};

const EARTH_M = 6371000;
/** Advance to next step when within this of the step end. */
const STEP_ARRIVE_M = 28;
/** Whole trip arrival radius. */
const DESTINATION_ARRIVE_M = 35;
/** Off-route if farther than this from the polyline. */
const OFF_ROUTE_M = 55;

export function haversineMeters(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial bearing from a → b in degrees [0, 360). */
export function bearingDegrees(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const φ1 = toRad(a.latitude);
  const φ2 = toRad(b.latitude);
  const Δλ = toRad(b.longitude - a.longitude);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function formatDistanceLabel(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return "—";
  if (meters < 1000) return `${Math.max(1, Math.round(meters))} m`;
  const km = meters / 1000;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

/** MaterialIcons-safe glyph for the turn card. */
export function maneuverToIcon(
  maneuver: string | null,
  instruction: string,
): string {
  const m = (maneuver || "").toLowerCase();
  const t = instruction.toLowerCase();

  if (m.includes("uturn") || t.includes("u-turn") || t.includes("u turn"))
    return "u-turn-left";
  if (m.includes("roundabout") || t.includes("roundabout")) return "sync";
  if (m.includes("merge") || t.includes("merge")) return "merge";
  if (m.includes("fork") || t.includes("fork") || t.includes("split"))
    return "call-split";
  if (
    m.includes("turn-sharp-left") ||
    t.includes("sharp left") ||
    m === "turn-left" ||
    (t.includes("turn left") && !t.includes("slight"))
  )
    return "turn-left";
  if (
    m.includes("turn-sharp-right") ||
    t.includes("sharp right") ||
    m === "turn-right" ||
    (t.includes("turn right") && !t.includes("slight"))
  )
    return "turn-right";
  if (
    m.includes("slight-left") ||
    t.includes("slight left") ||
    t.includes("keep left") ||
    m.includes("ramp-left")
  )
    return "turn-left";
  if (
    m.includes("slight-right") ||
    t.includes("slight right") ||
    t.includes("keep right") ||
    m.includes("ramp-right")
  )
    return "turn-right";
  if (m.includes("left") || /\bleft\b/.test(t)) return "turn-left";
  if (m.includes("right") || /\bright\b/.test(t)) return "turn-right";
  if (t.includes("destination") || t.includes("arrive")) return "flag";
  return "straight";
}

type ClosestResult = {
  index: number;
  point: LatLng;
  distanceMeters: number;
  /** Fraction along segment index→index+1 */
  t: number;
};

function projectOnSegment(p: LatLng, a: LatLng, b: LatLng): ClosestResult {
  const latScale = Math.cos((p.latitude * Math.PI) / 180);
  const ax = a.longitude * latScale;
  const ay = a.latitude;
  const bx = b.longitude * latScale;
  const by = b.latitude;
  const px = p.longitude * latScale;
  const py = p.latitude;
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const point = {
    latitude: a.latitude + (b.latitude - a.latitude) * t,
    longitude: a.longitude + (b.longitude - a.longitude) * t,
  };
  return {
    index: 0,
    point,
    distanceMeters: haversineMeters(p, point),
    t,
  };
}

export function closestPointOnRoute(
  position: LatLng,
  route: LatLng[],
): ClosestResult {
  if (route.length === 0) {
    return { index: 0, point: position, distanceMeters: 0, t: 0 };
  }
  if (route.length === 1) {
    return {
      index: 0,
      point: route[0],
      distanceMeters: haversineMeters(position, route[0]),
      t: 0,
    };
  }
  let best: ClosestResult = {
    index: 0,
    point: route[0],
    distanceMeters: Infinity,
    t: 0,
  };
  for (let i = 0; i < route.length - 1; i++) {
    const hit = projectOnSegment(position, route[i], route[i + 1]);
    if (hit.distanceMeters < best.distanceMeters) {
      best = { ...hit, index: i };
    }
  }
  return best;
}

/** Distance along polyline from route[0] to the closest projection. */
export function distanceAlongRoute(route: LatLng[], closest: ClosestResult): number {
  let d = 0;
  for (let i = 0; i < closest.index; i++) {
    d += haversineMeters(route[i], route[i + 1]);
  }
  if (closest.index < route.length - 1) {
    d +=
      haversineMeters(route[closest.index], route[closest.index + 1]) *
      closest.t;
  }
  return d;
}

export function totalRouteMeters(route: LatLng[]): number {
  let d = 0;
  for (let i = 0; i < route.length - 1; i++) {
    d += haversineMeters(route[i], route[i + 1]);
  }
  return d;
}

function sliceRouteFrom(
  route: LatLng[],
  closest: ClosestResult,
): { traveled: LatLng[]; remaining: LatLng[] } {
  const traveled = route.slice(0, closest.index + 1);
  traveled.push(closest.point);
  const remaining = [closest.point, ...route.slice(closest.index + 1)];
  return { traveled, remaining };
}

function bearingAlongRoute(route: LatLng[], closest: ClosestResult): number {
  const look = Math.min(route.length - 1, closest.index + 1);
  const a = closest.point;
  let b = route[look];
  // Prefer a point ~25m ahead for stable bearing
  let acc = 0;
  for (let i = closest.index; i < route.length - 1 && acc < 25; i++) {
    const from = i === closest.index ? closest.point : route[i];
    const to = route[i + 1];
    acc += haversineMeters(from, to);
    b = to;
  }
  if (haversineMeters(a, b) < 1 && closest.index > 0) {
    return bearingDegrees(route[closest.index - 1], closest.point);
  }
  return bearingDegrees(a, b);
}

/**
 * Resolve which step the user is on from along-route progress + proximity to step ends.
 */
export function resolveStepIndex(
  steps: NavStep[],
  route: LatLng[],
  alongMeters: number,
  position: LatLng,
  previousIndex: number,
): number {
  if (!steps.length) return 0;
  let idx = Math.max(0, Math.min(previousIndex, steps.length - 1));

  // Cumulative end distances using step end proximity along route
  const endsAlong: number[] = [];
  let cursor = 0;
  for (const step of steps) {
    // Approximate: walk route until near step.end
    let best = cursor;
    let bestD = Infinity;
    for (let i = cursor; i < route.length; i++) {
      const d = haversineMeters(route[i], step.end);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
      // Once we've passed a close match, stop searching far ahead
      if (bestD < 20 && i > best + 3) break;
    }
    let along = 0;
    for (let i = 0; i < best; i++) {
      along += haversineMeters(route[i], route[i + 1]);
    }
    endsAlong.push(along);
    cursor = best;
  }

  while (
    idx < steps.length - 1 &&
    (haversineMeters(position, steps[idx].end) < STEP_ARRIVE_M ||
      alongMeters >= endsAlong[idx] - 8)
  ) {
    idx += 1;
  }

  return idx;
}

export type UpdateLiveNavInput = {
  position: LatLng;
  /** Device course if available; otherwise route bearing is used */
  heading?: number | null;
  route: LatLng[];
  steps: NavStep[];
  previousStepIndex: number;
  /** Total trip duration from Directions (minutes) for ETA scaling */
  totalDurationMin: number;
  totalDistanceKm: number;
};

export function updateLiveNavigation(input: UpdateLiveNavInput): LiveNavSnapshot {
  const {
    position,
    heading,
    route,
    steps,
    previousStepIndex,
    totalDurationMin,
    totalDistanceKm,
  } = input;

  const empty: LiveNavSnapshot = {
    stepIndex: 0,
    instruction: "Continue on route",
    maneuver: null,
    maneuverIcon: "straight",
    distanceToManeuverMeters: 0,
    distanceToManeuverLabel: "—",
    remainingMeters: (totalDistanceKm || 0) * 1000,
    remainingKm: totalDistanceKm || 0,
    remainingMinutes: totalDurationMin || 0,
    bearing: typeof heading === "number" ? heading : 0,
    snapped: position,
    traveledCoordinates: [],
    remainingCoordinates: route,
    arrived: false,
    offRoute: false,
  };

  if (!route.length) return empty;

  const closest = closestPointOnRoute(position, route);
  const along = distanceAlongRoute(route, closest);
  const total = Math.max(totalRouteMeters(route), 1);
  const remainingMeters = Math.max(0, total - along);
  const { traveled, remaining } = sliceRouteFrom(route, closest);
  const routeBearing = bearingAlongRoute(route, closest);
  const bearing =
    typeof heading === "number" && Number.isFinite(heading) && heading >= 0
      ? heading
      : routeBearing;

  const dest = route[route.length - 1];
  const arrived = haversineMeters(position, dest) <= DESTINATION_ARRIVE_M;
  const offRoute = closest.distanceMeters > OFF_ROUTE_M;

  const stepIndex = arrived
    ? Math.max(0, steps.length - 1)
    : resolveStepIndex(steps, route, along, closest.point, previousStepIndex);

  const step = steps[stepIndex];
  const instruction = arrived
    ? "You have arrived"
    : step?.instruction || "Continue on route";
  const maneuver = arrived ? null : step?.maneuver ?? null;
  const maneuverIcon = arrived
    ? "flag"
    : maneuverToIcon(maneuver, instruction);

  const distanceToManeuverMeters = arrived
    ? 0
    : step
      ? haversineMeters(closest.point, step.end)
      : remainingMeters;

  const remainingKm = remainingMeters / 1000;
  const fracLeft = remainingMeters / total;
  const remainingMinutes = Math.max(
    1,
    Math.round((totalDurationMin || remainingKm * 3) * fracLeft),
  );

  return {
    stepIndex,
    instruction,
    maneuver,
    maneuverIcon,
    distanceToManeuverMeters,
    distanceToManeuverLabel: arrived
      ? "Arrived"
      : formatDistanceLabel(distanceToManeuverMeters),
    remainingMeters,
    remainingKm,
    remainingMinutes: arrived ? 0 : remainingMinutes,
    bearing,
    snapped: closest.point,
    traveledCoordinates: traveled,
    remainingCoordinates: remaining,
    arrived,
    offRoute,
  };
}

/** Map Google step JSON → NavStep (requires decodePolyline). */
export function mapGoogleStepToNavStep(
  step: any,
  decodePolyline: (encoded: string) => LatLng[],
): NavStep {
  const coords =
    step?.polyline?.points != null
      ? decodePolyline(step.polyline.points)
      : [
          {
            latitude: step.start_location.lat,
            longitude: step.start_location.lng,
          },
          {
            latitude: step.end_location.lat,
            longitude: step.end_location.lng,
          },
        ];

  return {
    instruction: String(step.html_instructions || "")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim(),
    maneuver: step.maneuver ? String(step.maneuver) : null,
    distanceMeters: Number(step.distance?.value) || 0,
    durationSeconds: Number(step.duration?.value) || 0,
    start: {
      latitude: step.start_location.lat,
      longitude: step.start_location.lng,
    },
    end: {
      latitude: step.end_location.lat,
      longitude: step.end_location.lng,
    },
    coordinates: coords,
  };
}
