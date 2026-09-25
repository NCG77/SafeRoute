import { SafetyScoreChip } from "@/components/design-system/SafetyScoreChip";

import { heatColor } from "@/core/heatmap";

import { radius, spacing, typography } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

import React from "react";

import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export type ComparisonRouteKind = "safest" | "balanced" | "fastest";

export type ComparisonRoute = {
  id: string;

  kind: ComparisonRouteKind;

  label: string;

  etaMinutes: number;

  distanceKm: number;

  safetyScore: number;

  lightingScore?: number | null;

  /** 0–1 density or null */

  crowdRatio?: number | null;

  crowdLabel?: string;

  color?: string;
};

export type ComparisonRouteCardProps = {
  route: ComparisonRoute;

  selected?: boolean;

  onPress?: () => void;

  style?: StyleProp<ViewStyle>;
};

function crowdCopy(route: ComparisonRoute): string | null {
  if (route.crowdLabel) return route.crowdLabel;

  if (route.crowdRatio == null) return null;

  if (route.crowdRatio >= 0.66) return "High";

  if (route.crowdRatio >= 0.33) return "Medium";

  return "Low";
}

/**

 * Floating route comparison card — Uber-style compact chooser over the map.

 * Variants: Safest | Balanced | Fastest × Selected | Idle

 */

export function ComparisonRouteCard({
  route,

  selected = false,

  onPress,

  style,
}: ComparisonRouteCardProps) {
  const { colors: c, elevation: elev } = useAppTheme();

  const accent = route.color || heatColor(route.safetyScore);

  const crowd = crowdCopy(route);

  const isSafest = route.kind === "safest";

  return (
    <Pressable
      accessibilityRole="button"

      accessibilityState={{ selected }}

      accessibilityLabel={`${route.label}, ${route.etaMinutes} minutes, safety ${Math.round(route.safetyScore)}`}

      onPress={onPress}

      style={({ pressed }) => [
        styles.card,

        {
          backgroundColor: c.surfaceGlass,

          borderColor: c.border,

          ...elev.fab,
        },

        selected && {
          backgroundColor: c.surface,

          borderWidth: 2,

          borderColor: accent,
        },

        pressed && styles.pressed,

        style,
      ]}
    >
      <View style={[styles.rail, { backgroundColor: accent }]} />

      <View style={styles.top}>
        <Text style={[styles.eta, { color: c.textPrimary }]}>
          {route.etaMinutes}
        </Text>

        <Text style={[styles.etaUnit, { color: c.textSecondary }]}>min</Text>

        <View style={styles.flex} />

        <SafetyScoreChip score={route.safetyScore} compact />
      </View>

      <Text style={[styles.label, { color: c.textPrimary }]}>
        {route.label}
      </Text>

      {isSafest || selected ? (
        <View style={styles.metrics}>
          <Text style={[styles.metric, { color: c.textSecondary }]}>
            Safety{" "}
            <Text style={[styles.metricStrong, { color: c.charcoal }]}>
              {Math.round(route.safetyScore)}
            </Text>
          </Text>

          {route.lightingScore != null ? (
            <Text style={[styles.metric, { color: c.textSecondary }]}>
              Lighting{" "}
              <Text style={[styles.metricStrong, { color: c.charcoal }]}>
                {Math.round(route.lightingScore)}
              </Text>
            </Text>
          ) : null}

          {crowd ? (
            <Text style={[styles.metric, { color: c.textSecondary }]}>
              Crowd{" "}
              <Text style={[styles.metricStrong, { color: c.charcoal }]}>
                {crowd}
              </Text>
            </Text>
          ) : null}
        </View>
      ) : (
        <Text style={[styles.distance, { color: c.textTertiary }]}>
          {route.distanceKm.toFixed(1)} km
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 156,

    borderRadius: radius.xl,

    paddingVertical: spacing.md,

    paddingHorizontal: spacing.md,

    borderWidth: 1.5,

    overflow: "hidden",
  },

  pressed: {
    opacity: 0.94,
  },

  rail: {
    position: "absolute",

    left: 0,

    top: 0,

    bottom: 0,

    width: 4,
  },

  top: {
    flexDirection: "row",

    alignItems: "flex-end",

    gap: 2,

    marginBottom: spacing.xs,
  },

  eta: {
    fontFamily: typography.fontFamily.bold,

    fontSize: 28,

    lineHeight: 32,

    letterSpacing: -0.5,
  },

  etaUnit: {
    fontFamily: typography.fontFamily.medium,

    fontSize: typography.size.caption,

    marginBottom: 4,
  },

  flex: { flex: 1 },

  label: {
    fontFamily: typography.fontFamily.semibold,

    fontSize: typography.size.body,

    marginBottom: spacing.sm,
  },

  metrics: {
    gap: 2,
  },

  metric: {
    fontFamily: typography.fontFamily.regular,

    fontSize: typography.size.caption,
  },

  metricStrong: {
    fontFamily: typography.fontFamily.semibold,
  },

  distance: {
    fontFamily: typography.fontFamily.regular,

    fontSize: typography.size.caption,
  },
});
