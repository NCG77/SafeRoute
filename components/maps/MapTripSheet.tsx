import { FloatingActionButton } from "@/components/design-system/FloatingActionButton";
import { PrimaryButton } from "@/components/design-system/PrimaryButton";
import { SafetyScoreChip } from "@/components/design-system/SafetyScoreChip";
import {
  ComparisonRouteCard,
  type ComparisonRoute,
} from "@/components/route/ComparisonRouteCard";
import {
  radius,
  spacing,
  tabContentBottomInset,
  typography,
} from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: WINDOW_HEIGHT } = Dimensions.get("window");
/** Idle "Plan a trip" — title + subtitle only, no empty padding. */
const IDLE = 138;
/** Destination selected — copy + CTA + Save/Share. */
const DESTINATION = 210;
/** Route cards visible. */
const EXPANDED = Math.min(420, Math.round(WINDOW_HEIGHT * 0.48));
/** Extra gap so the floating tab bar never covers the sheet CTA. */
const TAB_CLEARANCE = spacing.md;

export type MapTripSheetProps = {
  visible?: boolean;
  destinationTitle?: string | null;
  destinationSubtitle?: string | null;
  routes: ComparisonRoute[];
  selectedIndex: number;
  safetyScore?: number | null;
  onSelectRoute: (index: number) => void;
  onFindRoutes?: () => void;
  onStartNavigation?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  onMyLocation?: () => void;
  onReport?: () => void;
};

export function MapTripSheet({
  visible = true,
  destinationTitle,
  destinationSubtitle,
  routes,
  selectedIndex,
  safetyScore,
  onSelectRoute,
  onFindRoutes,
  onStartNavigation,
  onSave,
  onShare,
  onMyLocation,
  onReport,
}: MapTripSheetProps) {
  const insets = useSafeAreaInsets();
  const { colors: c, elevation: elev } = useAppTheme();
  const hasRoutes = routes.length > 0;
  const hasDestination = Boolean(destinationTitle);
  const targetHeight = hasRoutes
    ? EXPANDED
    : hasDestination
      ? DESTINATION
      : IDLE;
  const minHeight = hasRoutes ? DESTINATION : targetHeight;
  const maxHeight = hasRoutes ? EXPANDED : targetHeight;
  const height = useRef(new Animated.Value(IDLE)).current;
  const heightRef = useRef(IDLE);
  const dragStart = useRef(IDLE);
  const hasRoutesRef = useRef(hasRoutes);
  hasRoutesRef.current = hasRoutes;
  const targetHeightRef = useRef(targetHeight);
  targetHeightRef.current = targetHeight;

  useEffect(() => {
    const id = height.addListener(({ value }) => {
      heightRef.current = value;
    });
    return () => height.removeListener(id);
  }, [height]);

  const snapTo = (to: number) => {
    Animated.spring(height, {
      toValue: to,
      useNativeDriver: false,
      friction: 8,
      tension: 80,
    }).start();
  };

  // Resize with content: idle → destination → routes.
  useEffect(() => {
    snapTo(targetHeight);
  }, [targetHeight]);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        hasRoutesRef.current && Math.abs(gesture.dy) > 6,
      onPanResponderGrant: () => {
        dragStart.current = heightRef.current;
      },
      onPanResponderMove: (_, gesture) => {
        if (!hasRoutesRef.current) return;
        const next = dragStart.current - gesture.dy;
        height.setValue(Math.min(EXPANDED, Math.max(DESTINATION, next)));
      },
      onPanResponderRelease: (_, gesture) => {
        if (!hasRoutesRef.current) {
          snapTo(targetHeightRef.current);
          return;
        }
        const current = heightRef.current;
        if (gesture.vy < -0.35 || gesture.dy < -28) snapTo(EXPANDED);
        else if (gesture.vy > 0.35 || gesture.dy > 28) snapTo(DESTINATION);
        else
          snapTo(
            current > (DESTINATION + EXPANDED) / 2 ? EXPANDED : DESTINATION,
          );
      },
    }),
  ).current;

  if (!visible) return null;

  const score = Number.isFinite(safetyScore) ? Number(safetyScore) : null;

  return (
    <Animated.View
      style={[
        styles.sheet,
        {
          height,
          maxHeight,
          minHeight,
          bottom: tabContentBottomInset(insets.bottom) + TAB_CLEARANCE,
          backgroundColor: c.surface,
          ...elev.sheet,
        },
      ]}
    >
      <View style={styles.fabs} pointerEvents="box-none">
        {onReport ? (
          <FloatingActionButton
            icon="add-location-alt"
            variant="surface"
            accessibilityLabel="Report this area"
            onPress={onReport}
          />
        ) : null}
        {onMyLocation ? (
          <FloatingActionButton
            icon="my-location"
            variant="primary"
            accessibilityLabel="Current location"
            onPress={onMyLocation}
          />
        ) : null}
      </View>

      <View style={[styles.clip, { backgroundColor: c.surface }]}>
        <View {...pan.panHandlers} style={styles.handleHit}>
          <View style={[styles.handle, { backgroundColor: c.border }]} />
        </View>

        <View style={styles.body}>
          <Text style={[styles.kicker, { color: c.primary }]}>
            {hasDestination ? "Destination" : "Plan a trip"}
          </Text>
          <Text
            style={[styles.title, { color: c.textPrimary }]}
            numberOfLines={1}
          >
            {destinationTitle || "Where are you headed?"}
          </Text>
          <Text
            style={[styles.subtitle, { color: c.textSecondary }]}
            numberOfLines={2}
          >
            {destinationSubtitle ||
              "Search above to compare lighting, crowds, and community reports."}
          </Text>

          {score != null ? (
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreLabel, { color: c.textPrimary }]}>
                Safety score
              </Text>
              <SafetyScoreChip score={score} compact />
            </View>
          ) : null}

          {hasRoutes ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.routes}
            >
              {routes.map((route, index) => (
                <ComparisonRouteCard
                  key={route.id}
                  route={route}
                  selected={index === selectedIndex}
                  onPress={() => onSelectRoute(index)}
                  style={styles.routeCard}
                />
              ))}
            </ScrollView>
          ) : null}

          {hasRoutes && onStartNavigation ? (
            <PrimaryButton
              label="Start Navigation"
              onPress={onStartNavigation}
            />
          ) : hasDestination && onFindRoutes ? (
            <PrimaryButton label="Find safe routes" onPress={onFindRoutes} />
          ) : null}

          {hasDestination ? (
            <View style={styles.actions}>
              {onSave ? (
                <Pressable
                  onPress={onSave}
                  style={styles.action}
                  accessibilityRole="button"
                >
                  <Text style={[styles.actionText, { color: c.primary }]}>
                    Save
                  </Text>
                </Pressable>
              ) : null}
              {onShare ? (
                <Pressable
                  onPress={onShare}
                  style={styles.action}
                  accessibilityRole="button"
                >
                  <Text style={[styles.actionText, { color: c.primary }]}>
                    Share
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    borderRadius: radius.hero,
    overflow: "visible",
    zIndex: 20,
  },
  clip: {
    flex: 1,
    overflow: "hidden",
    borderRadius: radius.hero,
  },
  fabs: {
    position: "absolute",
    right: 0,
    top: -132,
    gap: spacing.sm + 4,
    alignItems: "center",
  },
  handleHit: {
    alignItems: "center",
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.pill,
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  kicker: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.size.title,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.caption,
    lineHeight: typography.lineHeight.caption,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  scoreLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.size.body,
  },
  routes: {
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  routeCard: {
    marginRight: spacing.sm,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
  },
  action: {
    minHeight: 36,
    justifyContent: "center",
  },
  actionText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.size.body,
  },
});
