import React from "react";

import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { heatColor } from "@/core/heatmap";

import { radius, spacing, typography } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

import { SafetyScoreChip } from "./SafetyScoreChip";

export type RouteKind = "safest" | "balanced" | "fastest";

export type RouteCardProps = {
  kind: RouteKind;

  etaMinutes: number;

  distanceKm: number;

  safetyScore: number;

  crowdScore?: number;

  lightScore?: number;

  selected?: boolean;

  onPress?: () => void;

  style?: StyleProp<ViewStyle>;
};

const KIND_LABEL: Record<RouteKind, string> = {
  safest: "Safest Route",

  balanced: "Balanced",

  fastest: "Fastest",
};

export function RouteCard({
  kind,

  etaMinutes,

  distanceKm,

  safetyScore,

  crowdScore,

  lightScore,

  selected = false,

  onPress,

  style,
}: RouteCardProps) {
  const { colors: c, elevation: elev } = useAppTheme();

  const accent = heatColor(safetyScore);

  return (
    <Pressable
      accessibilityRole="button"

      accessibilityState={{ selected }}

      onPress={onPress}

      style={[
        styles.card,

        {
          backgroundColor: c.surface,

          borderColor: c.border,

          ...elev.card,
        },

        selected && { borderColor: c.primary, borderWidth: 2 },

        style,
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: accent }]} />

      <View style={styles.header}>
        <Text style={[styles.eta, { color: c.textPrimary }]}>
          {etaMinutes} min
        </Text>

        <SafetyScoreChip score={safetyScore} compact />
      </View>

      <Text style={[styles.title, { color: c.textPrimary }]}>
        {KIND_LABEL[kind]}
      </Text>

      <Text style={[styles.meta, { color: c.textSecondary }]}>
        {distanceKm.toFixed(1)} km
      </Text>

      {(crowdScore != null || lightScore != null) && (
        <Text style={[styles.submeta, { color: c.textTertiary }]}>
          {crowdScore != null ? `Crowd ${crowdScore}` : null}

          {crowdScore != null && lightScore != null ? " · " : null}

          {lightScore != null ? `Light ${lightScore}` : null}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 168,

    borderRadius: radius.xl,

    padding: spacing.md,

    overflow: "hidden",

    borderWidth: 1,
  },

  accentBar: {
    position: "absolute",

    top: 0,

    left: 0,

    right: 0,

    height: 4,
  },

  header: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    marginBottom: spacing.sm,

    marginTop: spacing.xs,
  },

  eta: {
    fontFamily: typography.fontFamily.bold,

    fontSize: typography.size.headline,

    lineHeight: typography.lineHeight.headline,
  },

  title: {
    fontFamily: typography.fontFamily.semibold,

    fontSize: typography.size.body,

    lineHeight: typography.lineHeight.body,

    marginBottom: spacing.xs,
  },

  meta: {
    fontFamily: typography.fontFamily.regular,

    fontSize: typography.size.body,
  },

  submeta: {
    marginTop: spacing.sm,

    fontFamily: typography.fontFamily.regular,

    fontSize: typography.size.caption,
  },
});
