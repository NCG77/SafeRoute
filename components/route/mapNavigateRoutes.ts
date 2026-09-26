import type { ComparisonRoute } from "@/components/route/ComparisonRouteCard";
import {
  ROUTE_KIND_COLORS,
  ROUTE_KIND_LABELS,
} from "@/services/safeRouteApi";
import { heatColor } from "@/core/heatmap";

/** Adapt navigate.tsx route option objects into comparison cards. */
export function mapNavigateRoutesToComparison(
  routeOptions: any[],
): ComparisonRoute[] {
  const fallbackKinds: ComparisonRoute["kind"][] = [
    "safest",
    "balanced",
    "fastest",
  ];

  const fastestEta = Math.min(
    ...routeOptions
      .slice(0, 3)
      .map((r) => Number(r?.duration) || Infinity)
      .filter((n) => Number.isFinite(n)),
  );

  return routeOptions.slice(0, 3).map((route, index) => {
    const kind: ComparisonRoute["kind"] =
      route?.mode === "safest" ||
      route?.mode === "balanced" ||
      route?.mode === "fastest"
        ? route.mode
        : (fallbackKinds[index] ?? "balanced");

    const score = Number.isFinite(route?.safety?.score)
      ? Number(route.safety.score)
      : 70 - index * 8;
    const lighting =
      route?.safety?.lighting == null
        ? null
        : Math.round(Number(route.safety.lighting) * 100);
    const crowdRatio =
      route?.safety?.crowd == null ? null : Number(route.safety.crowd);

    const reasons = Array.isArray(route?.reasons)
      ? route.reasons
      : Array.isArray(route?.explanation?.reasons)
        ? route.explanation.reasons
        : undefined;

    const confidence =
      route?.confidence ??
      route?.confidence_detail?.confidence ??
      route?.explanation?.confidence?.confidence ??
      null;

    const advisory =
      route?.confidence_detail?.advisory ??
      route?.explanation?.confidence?.advisory ??
      null;

    const eta = Math.round(Number(route?.duration) || 0);
    const delta =
      Number.isFinite(fastestEta) && eta > fastestEta
        ? eta - fastestEta
        : null;

    return {
      id: String(route?.id ?? `route-${index}`),
      kind,
      label: ROUTE_KIND_LABELS[kind] ?? route?.title ?? `Route ${index + 1}`,
      etaMinutes: eta,
      distanceKm: Number(route?.distance) || 0,
      safetyScore: score,
      lightingScore: lighting,
      crowdRatio,
      color: route?.color || ROUTE_KIND_COLORS[kind] || heatColor(score),
      confidence: confidence == null ? null : Number(confidence),
      reasons,
      lowConfidenceAdvisory: advisory,
      etaDeltaVsFastestMin: delta,
    };
  });
}
