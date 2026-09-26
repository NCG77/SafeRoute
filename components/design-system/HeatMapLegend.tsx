import React from "react";

import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { heatLegendStops } from "@/core/heatmap";

import { radius, spacing, typography } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

export type HeatMapLegendProps = {
  title?: string;

  style?: StyleProp<ViewStyle>;
};

export function HeatMapLegend({
  title = "Safety heat",

  style,
}: HeatMapLegendProps) {
  const { colors: c, elevation: elev } = useAppTheme();

  const stops = heatLegendStops();

  return (
    <View
      style={[
        styles.card,

        {
          backgroundColor: c.surfaceGlass,

          borderColor: c.border,

          ...elev.card,
        },

        style,
      ]}

      accessibilityRole="summary"
    >
      <Text style={[styles.title, { color: c.textSecondary }]}>{title}</Text>

      <View style={styles.track}>
        {stops.map((stop, index) => (
          <View
            key={stop.score}

            style={[
              styles.segment,

              { backgroundColor: stop.color },

              index === 0 && styles.segmentFirst,

              index === stops.length - 1 && styles.segmentLast,
            ]}
          />
        ))}
      </View>

      <View style={styles.labels}>
        <Text style={[styles.label, { color: c.textTertiary }]}>Low</Text>

        <Text style={[styles.label, { color: c.textTertiary }]}>High</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,

    borderRadius: radius.xl,

    borderWidth: 1,

    minWidth: 160,
  },

  title: {
    fontFamily: typography.fontFamily.semibold,

    fontSize: typography.size.caption,

    marginBottom: spacing.sm,
  },

  track: {
    flexDirection: "row",

    height: 8,

    borderRadius: radius.pill,

    overflow: "hidden",
  },

  segment: {
    flex: 1,

    height: "100%",
  },

  segmentFirst: {
    borderTopLeftRadius: radius.pill,

    borderBottomLeftRadius: radius.pill,
  },

  segmentLast: {
    borderTopRightRadius: radius.pill,

    borderBottomRightRadius: radius.pill,
  },

  labels: {
    flexDirection: "row",

    justifyContent: "space-between",

    marginTop: spacing.xs,
  },

  label: {
    fontFamily: typography.fontFamily.regular,

    fontSize: typography.size.caption,
  },
});
