import { encodeGeohash, geohashPrecisionForZoom } from "@/core/geohash";
import { heatColor } from "@/core/heatmap";

export type ReviewPoint = {
  id: string | number;
  latitude: number;
  longitude: number;
  rating: number;
  comment?: string;
  category?: string;
};

export type SafetyHeatCell = {
  id: string;
  latitude: number;
  longitude: number;
  /** 0–100 safety score (from avg rating) */
  score: number;
  count: number;
  radius: number;
  color: string;
};

export type ReviewDetailPin = {
  id: string | number;
  latitude: number;
  longitude: number;
  rating: number;
  comment?: string;
  category?: string;
  color: string;
};

const MAX_HEAT_CELLS = 72;
const MAX_DETAIL_PINS = 24;

function ratingToScore(rating: number): number {
  // 1★ → 0, 5★ → 100
  return ((Math.min(5, Math.max(1, rating)) - 1) / 4) * 100;
}

/**
 * Aggregate reviews into soft heat cells (geohash buckets).
 * Zoomed-out maps stay readable with thousands of reports.
 */
export function buildSafetyHeatLayer(
  reviews: ReviewPoint[],
  latitudeDelta: number,
): SafetyHeatCell[] {
  if (!reviews.length) return [];

  const precision = Math.min(
    7,
    Math.max(4, geohashPrecisionForZoom(latitudeDelta)),
  );
  const buckets = new Map<
    string,
    { lat: number; lng: number; scoreSum: number; count: number }
  >();

  for (const review of reviews) {
    const id = encodeGeohash(review.latitude, review.longitude, precision);
    const existing = buckets.get(id);
    const score = ratingToScore(review.rating);
    if (existing) {
      existing.lat += review.latitude;
      existing.lng += review.longitude;
      existing.scoreSum += score;
      existing.count += 1;
    } else {
      buckets.set(id, {
        lat: review.latitude,
        lng: review.longitude,
        scoreSum: score,
        count: 1,
      });
    }
  }

  // Larger cells when zoomed out; tighter when street-level.
  const baseRadius =
    latitudeDelta > 0.08 ? 420 : latitudeDelta > 0.03 ? 260 : 140;

  const cells: SafetyHeatCell[] = [...buckets.entries()].map(([id, b]) => {
    const avg = b.scoreSum / b.count;
    const radius = Math.min(
      700,
      baseRadius + Math.log2(b.count + 1) * 35,
    );
    return {
      id,
      latitude: b.lat / b.count,
      longitude: b.lng / b.count,
      score: avg,
      count: b.count,
      radius,
      color: heatColor(avg),
    };
  });

  // Prefer denser / more severe cells if we hit the render cap.
  cells.sort((a, b) => {
    const aWeight = a.count * (100 - a.score);
    const bWeight = b.count * (100 - b.score);
    return bWeight - aWeight;
  });

  return cells.slice(0, MAX_HEAT_CELLS);
}

/**
 * Individual pins only when zoomed in close — never dump thousands of markers.
 */
export function buildReviewDetailPins(
  reviews: ReviewPoint[],
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null,
): ReviewDetailPin[] {
  if (!reviews.length || !region) return [];
  // Street / neighborhood zoom only
  if (region.latitudeDelta > 0.025) return [];

  const halfLat = region.latitudeDelta / 2;
  const halfLng = region.longitudeDelta / 2;
  const inView = reviews.filter(
    (r) =>
      Math.abs(r.latitude - region.latitude) <= halfLat * 1.15 &&
      Math.abs(r.longitude - region.longitude) <= halfLng * 1.15,
  );

  inView.sort((a, b) => {
    const da =
      (a.latitude - region.latitude) ** 2 +
      (a.longitude - region.longitude) ** 2;
    const db =
      (b.latitude - region.latitude) ** 2 +
      (b.longitude - region.longitude) ** 2;
    return da - db;
  });

  return inView.slice(0, MAX_DETAIL_PINS).map((r) => ({
    id: r.id,
    latitude: r.latitude,
    longitude: r.longitude,
    rating: r.rating,
    comment: r.comment,
    category: r.category,
    color: heatColor(ratingToScore(r.rating)),
  }));
}
