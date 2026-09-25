import { LinearGradient } from "expo-linear-gradient";

import React, { useEffect, useState } from "react";

import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import {
  motion,
  radius,
  safetyTone,
  spacing,
  typography,
} from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

export type SafetyScoreChipProps = {
  score: number;

  compact?: boolean;

  label?: string;

  style?: StyleProp<ViewStyle>;
};

export function SafetyScoreChip({
  score,

  compact = false,

  label,

  style,
}: SafetyScoreChipProps) {
  const { colors: c } = useAppTheme();

  const clamped = Math.min(100, Math.max(0, Math.round(score)));

  const tone = safetyTone(clamped);

  const [display, setDisplay] = useState(0);

  const pulse = useSharedValue(1);

  useEffect(() => {
    let frame = 0;

    const frames = 18;

    const id = setInterval(
      () => {
        frame += 1;

        const next = Math.round((clamped * frame) / frames);

        setDisplay(next);

        if (frame >= frames) clearInterval(id);
      },
      Math.max(12, Math.floor(motion.slow / frames)),
    );

    return () => clearInterval(id);
  }, [clamped]);

  useEffect(() => {
    pulse.value = withSequence(
      withTiming(1.06, {
        duration: motion.normal,

        easing: Easing.out(Easing.ease),
      }),

      withTiming(1, {
        duration: motion.slow,

        easing: Easing.inOut(Easing.ease),
      }),
    );
  }, [clamped, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View style={[pulseStyle, style]}>
      <LinearGradient
        colors={[tone.from, tone.to]}

        start={{ x: 0, y: 0 }}

        end={{ x: 1, y: 1 }}

        style={[styles.chip, compact && styles.compact]}
      >
        <View
          accessibilityRole="text"

          accessibilityLabel={`Safety score ${clamped}, ${tone.label}`}

          style={styles.inner}
        >
          {!compact ? (
            <Text style={[styles.prefix, { color: c.textOnPrimary }]}>
              {label ?? tone.label}
            </Text>
          ) : null}

          <Text style={[styles.score, { color: c.textOnPrimary }]}>
            {display}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.pill,

    paddingHorizontal: spacing.md,

    paddingVertical: spacing.sm,

    shadowColor: "#059669",

    shadowOffset: { width: 0, height: 4 },

    shadowOpacity: 0.16,

    shadowRadius: 10,

    elevation: 3,
  },

  compact: {
    paddingHorizontal: spacing.sm + 2,

    paddingVertical: spacing.xs + 2,

    minWidth: 40,
  },

  inner: {
    flexDirection: "row",

    alignItems: "center",

    gap: spacing.xs,
  },

  prefix: {
    fontFamily: typography.fontFamily.medium,

    fontSize: typography.size.caption,

    lineHeight: typography.lineHeight.caption,
  },

  score: {
    fontFamily: typography.fontFamily.bold,

    fontSize: typography.size.body,

    lineHeight: typography.lineHeight.body,
  },
});
