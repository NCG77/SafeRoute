import { TourAnchor } from "@/components/tour/TourAnchor";
import { radius, spacing, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

export type LiveMiniMapProps = {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  mapTourId?: string;
};

/** Web fallback. Native builds use LiveMiniMap.native.tsx. */
export function LiveMiniMap({
  onPress,
  style,
  mapTourId = "heatmap",
}: LiveMiniMapProps) {
  const { colors: c, elevation: elev, isDark } = useAppTheme();

  return (
    <TourAnchor
      id={mapTourId}
      style={[
        styles.card,
        {
          backgroundColor: c.surface,
          borderColor: c.border,
          ...elev.card,
        },
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Open live map"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.textPrimary }]}>
            Around you
          </Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            Open the map to see your live area
          </Text>
        </View>
        <LinearGradient
          colors={
            isDark
              ? ["#1E1B4B", "#312E81", "#4338CA"]
              : ["#EEF2FF", "#C7D2FE", "#A5B4FC"]
          }
          style={styles.mapFrame}
        >
          <View
            style={[
              styles.dot,
              {
                backgroundColor: c.primary,
                borderColor: c.surface,
              },
            ]}
          />
          <Text style={[styles.mapLabel, { color: c.primaryOnContainer }]}>
            Live map
          </Text>
        </LinearGradient>
      </Pressable>
    </TourAnchor>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.size.title,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.body,
  },
  mapFrame: {
    height: 210,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
  },
  mapLabel: {
    fontFamily: typography.fontFamily.semibold,
  },
});
