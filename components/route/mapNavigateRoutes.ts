import type { ComparisonRoute } from "@/components/route/ComparisonRouteCard";
import { heatColor } from "@/core/heatmap";

/** Adapt navigate.tsx route option objects into comparison cards. */
export function mapNavigateRoutesToComparison(
  routeOptions: any[],
): ComparisonRoute[] {
  const kinds: ComparisonRoute["kind"][] = ["safest", "balanced", "fastest"];
  const labels = ["Safest", "Balanced", "Fastest"];

  return routeOptions.slice(0, 3).map((route, index) => {
    const score = Number.isFinite(route?.safety?.score)
      ? Number(route.safety.score)
      : 70 - index * 8;
    const lighting =
      route?.safety?.lighting == null
        ? null
        : Math.round(Number(route.safety.lighting) * 100);
    const crowdRatio =
      route?.safety?.crowd == null ? null : Number(route.safety.crowd);

    return {
      id: String(route?.id ?? `route-${index}`),
      kind: kinds[index] ?? "balanced",
      label: labels[index] ?? route?.title ?? `Route ${index + 1}`,
      etaMinutes: Math.round(Number(route?.duration) || 0),
      distanceKm: Number(route?.distance) || 0,
      safetyScore: score,
      lightingScore: lighting,
      crowdRatio,
      color: route?.color || heatColor(score),
    };
  });
}
