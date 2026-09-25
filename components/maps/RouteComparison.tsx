import {
  HeatMapLegend,
  PrimaryButton,
  RouteCard,
  type RouteKind,
} from "@/components/design-system";
import { motion, radius, spacing, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import {
  buildRouteExplanation,
  crowdLabel,
  inferRouteKind,
} from "@/core/routeExplanation";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type ComparisonRoute = {
  id: string;
  title: string;
  duration: number;
  distance: number;
  color?: string;
  safety?: {
    score?: number | null;
    lighting?: number | null;
    crowd?: number | null;
  };
};

export type RouteComparisonProps = {
  isVisible: boolean;
  routes: ComparisonRoute[];
  selectedIndex: number;
  onSelectRoute: (index: number) => void;
  onStartSafeWalk: () => void;
  onViewDirections?: () => void;
  onClose?: () => void;
};

/**
 * Edge-to-edge map companion chrome:
 * floating cards + glass legend + AI why panel + Safe Walk CTA.
 * Map itself stays full-bleed underneath (parent MapDisplay).
 */
export function RouteComparison({
  isVisible,
  routes,
  selectedIndex,
  onSelectRoute,
  onStartSafeWalk,
  onViewDirections,
  onClose,
}: RouteComparisonProps) {
  const { colors: c, elevation: elev } = useAppTheme();
  const insets = useSafeAreaInsets();

  const selected = routes[selectedIndex];
  const reasons = useMemo(() => {
    if (!selected) return [];
    const kind = inferRouteKind(selected.title, selectedIndex);
    return buildRouteExplanation({
      kind,
      safetyScore: selected.safety?.score,
      lighting: selected.safety?.lighting,
      crowd: selected.safety?.crowd,
      nearPolice: kind === "safest" || (selected.safety?.score ?? 0) >= 85,
      poorlyLitAvoided:
        kind === "safest" ? 2 : kind === "balanced" ? 1 : undefined,
    });
  }, [selected, selectedIndex]);

  if (!isVisible || routes.length === 0) return null;

  return (
    <View style={styles.root} pointerEvents="box-none">
      {/* Top: heat legend — floats over map, does not cover edges */}
      <Animated.View
        entering={FadeIn.duration(motion.normal)}
        style={[styles.legendWrap, { top: Math.max(insets.top, 12) + 56 }]}
        pointerEvents="box-none"
      >
        <HeatMapLegend title="Safety heat" style={styles.legend} />
      </Animated.View>

      {onClose ? (
        <Pressable
          onPress={onClose}
          style={[
            styles.closeBtn,
            {
              top: Math.max(insets.top, 12) + 8,
              backgroundColor: c.surfaceGlass,
              borderColor: c.border,
              ...elev.card,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Close route comparison"
        >
          <MaterialIcons name="close" size={20} color={c.textPrimary} />
        </Pressable>
      ) : null}

      <Animated.View
        entering={FadeInUp.duration(motion.slow).springify().damping(16)}
        style={[
          styles.dock,
          { paddingBottom: Math.max(insets.bottom, spacing.md) + 72 },
        ]}
      >
        {/* Three floating route cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsRow}
          decelerationRate="fast"
          snapToInterval={176}
        >
          {routes.slice(0, 3).map((route, index) => {
            const kind: RouteKind = inferRouteKind(route.title, index);
            const safety = Math.round(route.safety?.score ?? 50);
            const lighting =
              route.safety?.lighting == null
                ? undefined
                : Math.round(route.safety.lighting * 100);
            const crowd = crowdLabel(route.safety?.crowd);
            const selectedCard = index === selectedIndex;

            return (
              <RouteCard
                key={route.id}
                kind={kind}
                etaMinutes={Math.round(route.duration)}
                distanceKm={route.distance}
                safetyScore={safety}
                lightScore={lighting}
                crowdScore={
                  route.safety?.crowd == null
                    ? undefined
                    : Math.round(route.safety.crowd * 100)
                }
                selected={selectedCard}
                onPress={() => onSelectRoute(index)}
                style={styles.card}
                detailLine={
                  lighting != null
                    ? `Lighting ${lighting} · Crowd ${crowd}`
                    : `Crowd ${crowd}`
                }
              />
            );
          })}
        </ScrollView>

        {/* AI explanation panel */}
        {selected ? (
          <View
            style={[
              styles.whyCard,
              {
                backgroundColor: c.surfaceGlass,
                borderColor: c.border,
                ...elev.card,
              },
            ]}
            accessibilityRole="summary"
          >
            <View style={styles.whyHeader}>
              <View
                style={[
                  styles.aiBadge,
                  { backgroundColor: c.primaryContainer },
                ]}
              >
                <MaterialIcons
                  name="auto-awesome"
                  size={14}
                  color={c.primary}
                />
                <Text style={[styles.aiBadgeText, { color: c.primary }]}>
                  AI
                </Text>
              </View>
              <Text style={[styles.whyTitle, { color: c.textPrimary }]}>
                Why this route?
              </Text>
            </View>
            {reasons.map((reason) => (
              <View key={reason} style={styles.reasonRow}>
                <View
                  style={[styles.reasonDot, { backgroundColor: c.success }]}
                />
                <Text style={[styles.reasonText, { color: c.charcoal }]}>
                  {reason}
                </Text>
              </View>
            ))}
            {onViewDirections ? (
              <Pressable
                onPress={onViewDirections}
                hitSlop={8}
                accessibilityRole="button"
                style={styles.directionsLink}
              >
                <Text style={[styles.directionsLinkText, { color: c.primary }]}>
                  View turn-by-turn
                </Text>
                <MaterialIcons
                  name="chevron-right"
                  size={18}
                  color={c.primary}
                />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <PrimaryButton
          label="Start Safe Walk"
          onPress={onStartSafeWalk}
          accessibilityHint="Share live location with your primary guardian along this route"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  legendWrap: {
    position: "absolute",
    right: spacing.md,
    zIndex: 5,
  },
  legend: {
    minWidth: 140,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  closeBtn: {
    position: "absolute",
    left: spacing.md,
    zIndex: 6,
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  dock: {
    paddingTop: spacing.md,
    gap: spacing.md,
    // Transparent dock so map stays edge-to-edge; only cards cast elevation
    backgroundColor: "transparent",
  },
  cardsRow: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  card: {
    marginRight: spacing.sm,
  },
  whyCard: {
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.sm,
  },
  whyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  aiBadgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  whyTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.size.bodyLarge,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  reasonDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    marginTop: 7,
  },
  reasonText: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.body,
    lineHeight: typography.lineHeight.body,
  },
  directionsLink: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  directionsLinkText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.size.body,
  },
});
