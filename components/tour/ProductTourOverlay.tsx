import { PrimaryButton, SecondaryButton } from "@/components/design-system";
import { motion, radius, spacing, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useProductTour, type TourRect } from "@/hooks/useProductTour";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Extra padding so the ring fully wraps the feature, not clipping edges */
const PAD = 14;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function ProductTourOverlay() {
  const insets = useSafeAreaInsets();
  const { width: WIN_W, height: WIN_H } = useWindowDimensions();
  const { colors, elevation } = useAppTheme();
  const { active, step, stepIndex, total, targets, next, skip } =
    useProductTour();
  const rootRef = useRef<View>(null);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });

  const TOOLTIP_W = Math.min(340, WIN_W - spacing.lg * 2);
  const target = step.targetId ? targets[step.targetId] : undefined;
  const localTarget = useMemo(
    () =>
      target
        ? {
            ...target,
            x: target.x - origin.x,
            y: target.y - origin.y,
          }
        : undefined,
    [target, origin.x, origin.y],
  );
  const hole = useMemo(
    () => expandHole(localTarget, WIN_W, WIN_H),
    [localTarget, WIN_W, WIN_H],
  );

  const measureOrigin = useCallback(() => {
    rootRef.current?.measureInWindow((x, y) => {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      setOrigin((current) =>
        Math.abs(current.x - x) < 0.5 && Math.abs(current.y - y) < 0.5
          ? current
          : { x, y },
      );
    });
  }, []);

  useEffect(() => {
    if (!active) return;
    measureOrigin();
    const timers = [50, 180, 400].map((ms) =>
      setTimeout(measureOrigin, ms),
    );
    return () => timers.forEach(clearTimeout);
  }, [active, measureOrigin]);

  const hx = useSharedValue(hole.x);
  const hy = useSharedValue(hole.y);
  const hw = useSharedValue(hole.width);
  const hh = useSharedValue(hole.height);

  // Snap when the target jumps (step change / remeasure) so the hole never
  // lags behind the real card. Only ease small corrections.
  useEffect(() => {
    const dx = Math.abs(hx.value - hole.x);
    const dy = Math.abs(hy.value - hole.y);
    const dw = Math.abs(hw.value - hole.width);
    const dh = Math.abs(hh.value - hole.height);
    const shouldSnap = hw.value < 2 || dx > 24 || dy > 24 || dw > 24 || dh > 24;
    if (shouldSnap) {
      hx.value = hole.x;
      hy.value = hole.y;
      hw.value = hole.width;
      hh.value = hole.height;
      return;
    }
    const cfg = { duration: motion.fast };
    hx.value = withTiming(hole.x, cfg);
    hy.value = withTiming(hole.y, cfg);
    hw.value = withTiming(hole.width, cfg);
    hh.value = withTiming(hole.height, cfg);
  }, [hole, hx, hy, hw, hh]);

  const topStyle = useAnimatedStyle(() => ({
    height: Math.max(0, hy.value),
  }));
  const leftStyle = useAnimatedStyle(() => ({
    top: hy.value,
    height: hh.value,
    width: Math.max(0, hx.value),
  }));
  const rightStyle = useAnimatedStyle(() => ({
    top: hy.value,
    height: hh.value,
    left: hx.value + hw.value,
    width: Math.max(0, WIN_W - (hx.value + hw.value)),
  }));
  const bottomStyle = useAnimatedStyle(() => ({
    top: hy.value + hh.value,
    height: Math.max(0, WIN_H - (hy.value + hh.value)),
  }));
  const ringStyle = useAnimatedStyle(() => ({
    top: hy.value,
    left: hx.value,
    width: hw.value,
    height: hh.value,
    opacity: hw.value > 1 ? 1 : 0,
  }));

  const tooltipPos = useMemo(() => {
    if (!localTarget || step.id === "complete") {
      return {
        top: Math.max(insets.top + spacing.xl, WIN_H * 0.32),
        left: (WIN_W - TOOLTIP_W) / 2,
      };
    }
    const below = localTarget.y + localTarget.height + PAD + 16;
    const above = localTarget.y - PAD - 16;
    const placeBelow = below + 220 < WIN_H - insets.bottom;
    const top = placeBelow
      ? below
      : clamp(above - 200, insets.top + spacing.md, WIN_H - 240 - insets.bottom);
    const left = clamp(
      localTarget.x + localTarget.width / 2 - TOOLTIP_W / 2,
      spacing.md,
      WIN_W - TOOLTIP_W - spacing.md,
    );
    return { top, left };
  }, [
    localTarget,
    step.id,
    insets.top,
    insets.bottom,
    WIN_W,
    WIN_H,
    TOOLTIP_W,
  ]);

  if (!active) return null;

  const isLast = step.id === "complete";
  const progressLabel = `${stepIndex + 1}/${total}`;
  const ringRadius =
    step.targetId === "sos"
      ? radius.full
      : step.targetId === "search"
        ? radius.search
        : radius.xl;

  // Same window as Home (no Modal) so measureInWindow matches the hole and
  // the real feature shows through the cutout.
  return (
    <View
      ref={rootRef}
      collapsable={false}
      onLayout={measureOrigin}
      style={styles.root}
      pointerEvents="box-none"
    >
      <View style={styles.layer} pointerEvents="box-none">
        <Animated.View style={[styles.scrim, topStyle]} />
        <Animated.View style={[styles.scrim, styles.side, leftStyle]} />
        <Animated.View style={[styles.scrim, styles.side, rightStyle]} />
        <Animated.View style={[styles.scrim, bottomStyle]} />
        <Animated.View
          pointerEvents="none"
          style={[styles.ring, ringStyle, { borderRadius: ringRadius }]}
        />
      </View>

      <Animated.View
        key={step.id}
        entering={FadeInDown.duration(motion.normal)}
        style={[
          styles.tooltip,
          {
            top: tooltipPos.top,
            left: tooltipPos.left,
            width: TOOLTIP_W,
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.border,
            ...elevation.floating,
          },
        ]}
        accessibilityLabel={`Tour tip ${progressLabel}: ${step.title}`}
      >
        <View style={styles.tooltipHeader}>
          <Text style={[styles.progress, { color: colors.primary }]}>
            {progressLabel}
          </Text>
          {!isLast ? (
            <Pressable
              onPress={skip}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Skip product tour"
            >
              <Text style={[styles.skip, { color: colors.textSecondary }]}>
                Skip
              </Text>
            </Pressable>
          ) : null}
        </View>

        {isLast ? (
          <View style={styles.celebrate}>
            <View
              style={[
                styles.celebrateIcon,
                { backgroundColor: colors.primaryContainer },
              ]}
            >
              <MaterialIcons
                name="celebration"
                size={28}
                color={colors.primary}
              />
            </View>
          </View>
        ) : null}

        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {step.title}
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {step.description}
        </Text>

        <View style={styles.actions}>
          {!isLast ? (
            <SecondaryButton
              label="Skip"
              fullWidth={false}
              onPress={skip}
              style={styles.skipBtn}
            />
          ) : null}
          <PrimaryButton
            label={isLast ? "Done" : "Next"}
            fullWidth={isLast}
            onPress={next}
            style={isLast ? undefined : styles.nextBtn}
          />
        </View>
      </Animated.View>
    </View>
  );
}

function expandHole(
  rect: TourRect | undefined,
  winW: number,
  winH: number,
): TourRect {
  if (!rect) {
    return { x: winW / 2, y: winH / 2, width: 0, height: 0 };
  }
  const x = clamp(rect.x - PAD, 0, winW);
  const y = clamp(rect.y - PAD, 0, winH);
  const width = clamp(rect.width + PAD * 2, 0, winW - x);
  const height = clamp(rect.height + PAD * 2, 0, winH - y);
  return { x, y, width, height };
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  layer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  scrim: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  side: {
    right: undefined,
  },
  ring: {
    position: "absolute",
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.95)",
    backgroundColor: "transparent",
  },
  tooltip: {
    position: "absolute",
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  tooltipHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progress: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.size.caption,
    letterSpacing: 0.4,
  },
  skip: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.size.caption,
  },
  celebrate: {
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  celebrateIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.size.title,
    lineHeight: typography.lineHeight.title,
    letterSpacing: typography.tracking.title,
  },
  body: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.body,
    lineHeight: typography.lineHeight.body,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  skipBtn: {
    flex: 0,
    minWidth: 96,
    paddingHorizontal: spacing.md,
  },
  nextBtn: {
    flex: 1,
  },
});
