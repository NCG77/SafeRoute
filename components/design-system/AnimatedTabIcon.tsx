import { LinearGradient } from "expo-linear-gradient";

import React, { useEffect } from "react";

import { StyleSheet, View } from "react-native";

import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { motion, radius, typography } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

type TabIconProps = {
  focused: boolean;

  color: string | number;

  children: (opts: { color: string; size: number }) => React.ReactNode;
};

/** Spring-scaled tab glyph with indigo gradient wash when active. */

export function AnimatedTabIcon({ focused, color, children }: TabIconProps) {
  const { colors: c, gradients: grads } = useAppTheme();

  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, {
      damping: 14,

      stiffness: 220,

      mass: 0.6,
    });
  }, [focused, progress]);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + (motion.iconActive - 1) * progress.value }],
  }));

  return (
    <Animated.View style={[styles.iconWrap, wrapStyle]}>
      {focused ? (
        <LinearGradient
          colors={[...grads.navActive]}

          start={{ x: 0, y: 0 }}

          end={{ x: 1, y: 1 }}

          style={styles.wash}
        />
      ) : null}

      {children({
        color: focused ? c.textOnPrimary : String(color),

        size: 22,
      })}
    </Animated.View>
  );
}

type TabLabelProps = {
  focused: boolean;

  children: string;
};

export function AnimatedTabLabel({ focused, children }: TabLabelProps) {
  const { colors: c } = useAppTheme();

  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(focused ? 1 : 0, { duration: motion.normal });
  }, [focused, progress]);

  const style = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,

      [0, 1],

      [c.textSecondary, c.primary],
    ),

    opacity: 0.75 + 0.25 * progress.value,
  }));

  return (
    <Animated.Text style={[styles.label, style]}>{children}</Animated.Text>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 40,

    height: 28,

    borderRadius: radius.pill,

    alignItems: "center",

    justifyContent: "center",

    overflow: "hidden",
  },

  wash: {
    ...StyleSheet.absoluteFill,

    borderRadius: radius.pill,

    opacity: 0.95,
  },

  label: {
    fontSize: 11,

    fontFamily: typography.fontFamily.semibold,

    marginTop: 2,
  },
});
