/**
 * Builds short, human “Why this route?” reasons from scored route features.
 * Copy is explanatory, not medical/legal advice.
 */

export type RouteExplainInput = {
  kind?: string;
  safetyScore?: number | null;
  lighting?: number | null; // 0–1
  crowd?: number | null; // 0–1
  /** Optional count of low-light segments avoided vs alternatives */
  poorlyLitAvoided?: number | null;
  nearPolice?: boolean | null;
};

export function buildRouteExplanation(input: RouteExplainInput): string[] {
  const reasons: string[] = [];
  const lightingPct =
    input.lighting == null ? null : Math.round(input.lighting * 100);
  const crowdPct = input.crowd == null ? null : Math.round(input.crowd * 100);

  const avoided =
    input.poorlyLitAvoided != null && input.poorlyLitAvoided > 0
      ? input.poorlyLitAvoided
      : lightingPct != null && lightingPct >= 70
        ? 2
        : lightingPct != null && lightingPct >= 50
          ? 1
          : 0;

  if (avoided > 0) {
    reasons.push(
      `Avoided ${avoided} poorly lit road${avoided === 1 ? "" : "s"}`,
    );
  } else if (lightingPct != null && lightingPct < 50) {
    reasons.push("Limited lighting data — stay alert on darker stretches");
  }

  if (input.nearPolice === true || (input.safetyScore ?? 0) >= 85) {
    reasons.push("Stayed near police station");
  } else if ((input.safetyScore ?? 0) >= 70) {
    reasons.push("Preferred streets with stronger community scores");
  }

  if (crowdPct != null && crowdPct >= 60) {
    reasons.push("High pedestrian activity");
  } else if (crowdPct != null && crowdPct >= 35) {
    reasons.push("Moderate foot traffic along the path");
  } else if (crowdPct != null) {
    reasons.push("Quieter path — share your trip with a guardian");
  } else {
    reasons.push("Ranked for safety, not just travel time");
  }

  // Keep three concise bullets for the panel
  return reasons.slice(0, 3);
}

export function crowdLabel(crowd01: number | null | undefined): string {
  if (crowd01 == null) return "—";
  const pct = Math.round(crowd01 * 100);
  if (pct >= 65) return "High";
  if (pct >= 35) return "Medium";
  return "Low";
}

export function inferRouteKind(
  title: string,
  index: number,
): "safest" | "balanced" | "fastest" {
  const t = title.toLowerCase();
  if (t.includes("safest") || t.includes("safe")) return "safest";
  if (t.includes("fast")) return "fastest";
  if (t.includes("balance")) return "balanced";
  if (index === 0) return "safest";
  if (index === 1) return "balanced";
  return "fastest";
}
