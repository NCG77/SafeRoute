import { HeatMapLegend } from "@/components/design-system/HeatMapLegend";

import { PrimaryButton } from "@/components/design-system/PrimaryButton";

import {
  ComparisonRouteCard,
  type ComparisonRoute,
} from "@/components/route/ComparisonRouteCard";

import { WhyThisRoute, type WhyReason } from "@/components/route/WhyThisRoute";

import { spacing } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import React, { useMemo } from "react";

import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";

import { useSafeAreaInsets } from "react-native-safe-area-context";

export type RouteComparisonOverlayProps = {
  visible: boolean;

  routes: ComparisonRoute[];

  selectedIndex: number;

  onSelectRoute: (index: number) => void;

  onStartSafeWalk: () => void;

  onClose?: () => void;

  reasons?: WhyReason[];

  style?: StyleProp<ViewStyle>;
};

const DEFAULT_REASONS: WhyReason[] = [
  { icon: "highlight-off", text: "Avoided 2 poorly lit roads" },

  { icon: "local-police", text: "Stayed near police station" },

  { icon: "groups", text: "High pedestrian activity" },
];

function reasonsForKind(kind: ComparisonRoute["kind"]): WhyReason[] {
  if (kind === "safest") return DEFAULT_REASONS;

  if (kind === "balanced")
    return [
      { icon: "balance", text: "Balances time with safer segments" },

      {
        icon: "wb-twilight",
        text: "Acceptable lighting along most of the path",
      },

      { icon: "groups", text: "Moderate pedestrian activity" },
    ];

  return [
    { icon: "speed", text: "Shortest ETA among viable options" },

    { icon: "alt-route", text: "Uses primary roads for speed" },

    { icon: "info-outline", text: "May pass quieter or less-lit stretches" },
  ];
}

/**

 * Apple Maps × Uber route chooser: floating chrome over an edge-to-edge map.

 * Parent owns the map; this layer only floats UI.

 */

export function RouteComparisonOverlay({
  visible,

  routes,

  selectedIndex,

  onSelectRoute,

  onStartSafeWalk,

  onClose,

  reasons,

  style,
}: RouteComparisonOverlayProps) {
  const { colors: c } = useAppTheme();

  const insets = useSafeAreaInsets();

  const selected = routes[selectedIndex];

  const why = useMemo(() => {
    if (reasons) return reasons;

    if (!selected) return DEFAULT_REASONS;

    return reasonsForKind(selected.kind);
  }, [reasons, selected]);

  if (!visible || routes.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"

      style={[styles.root, style]}

      accessibilityLabel="Route comparison"
    >
      {/* Top chrome — legend + close */}

      <Animated.View
        entering={FadeInDown.duration(280)}

        pointerEvents="box-none"

        style={[styles.topRow, { paddingTop: Math.max(insets.top, 12) }]}
      >
        {onClose ? (
          <Pressable
            onPress={onClose}

            style={[
              styles.backBtn,

              {
                backgroundColor: c.surfaceGlass,

                borderColor: c.border,
              },
            ]}

            accessibilityRole="button"

            accessibilityLabel="Close route comparison"
          >
            <MaterialIcons name="arrow-back" size={22} color={c.textPrimary} />
          </Pressable>
        ) : (
          <View style={styles.backSpacer} />
        )}

        <HeatMapLegend title="Safety heat" style={styles.legend} />
      </Animated.View>

      {/* Bottom stack — cards → AI why → CTA */}

      <View
        pointerEvents="box-none"

        style={[
          styles.bottom,

          { paddingBottom: Math.max(insets.bottom, spacing.md) + 8 },
        ]}
      >
        <Animated.View entering={FadeInRight.duration(320)}>
          <ScrollView
            horizontal

            showsHorizontalScrollIndicator={false}

            contentContainerStyle={styles.cardsRow}

            decelerationRate="fast"

            snapToInterval={168}
          >
            {routes.map((route, index) => (
              <ComparisonRouteCard
                key={route.id}

                route={route}

                selected={index === selectedIndex}

                onPress={() => onSelectRoute(index)}

                style={styles.cardGap}
              />
            ))}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(300)}>
          <WhyThisRoute reasons={why} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).duration(300)}>
          <PrimaryButton
            label="Start Safe Walk"

            onPress={onStartSafeWalk}

            accessibilityHint="Begin Safe Walk with the selected route"
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,

    justifyContent: "space-between",
  },

  topRow: {
    flexDirection: "row",

    alignItems: "flex-start",

    justifyContent: "space-between",

    paddingHorizontal: spacing.md,

    gap: spacing.md,
  },

  backBtn: {
    width: 44,

    height: 44,

    borderRadius: 22,

    alignItems: "center",

    justifyContent: "center",

    borderWidth: 1,
  },

  backSpacer: {
    width: 44,
  },

  legend: {
    maxWidth: 180,
  },

  bottom: {
    paddingHorizontal: spacing.md,

    gap: spacing.md,
  },

  cardsRow: {
    paddingRight: spacing.md,

    paddingTop: spacing.sm,

    paddingBottom: spacing.xs,
  },

  cardGap: {
    marginRight: spacing.sm + 4,
  },
});
