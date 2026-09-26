import { LinearGradient } from "expo-linear-gradient";

import * as Haptics from "expo-haptics";

import React, { useEffect, useRef } from "react";

import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { motion, radius, touch, typography } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

export type SOSButtonProps = {
  onPress?: () => void;

  onLongPress?: () => void;

  holding?: boolean;

  label?: string;

  compact?: boolean;

  style?: StyleProp<ViewStyle>;
};

/**

 * Safety-first SOS control with breathing glow + ripple (visual polish only).

 */

export function SOSButton({
  onPress,

  onLongPress,

  holding = false,

  label = "SOS",

  compact = false,

  style,
}: SOSButtonProps) {
  const { colors: c, elevation: elev, gradients: grads } = useAppTheme();

  const scale = useRef(new Animated.Value(1)).current;

  const breath = useRef(new Animated.Value(0)).current;

  const ripple = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,

          duration: motion.sosBreath / 2,

          easing: Easing.inOut(Easing.ease),

          useNativeDriver: true,
        }),

        Animated.timing(breath, {
          toValue: 0,

          duration: motion.sosBreath / 2,

          easing: Easing.inOut(Easing.ease),

          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => loop.stop();
  }, [breath]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(ripple, {
          toValue: 1,

          duration: motion.sosBreath,

          easing: Easing.out(Easing.ease),

          useNativeDriver: true,
        }),

        Animated.timing(ripple, {
          toValue: 0,

          duration: 0,

          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => loop.stop();
  }, [ripple]);

  const animateTo = (to: number) => {
    Animated.spring(scale, {
      toValue: to,

      useNativeDriver: true,

      friction: 6,

      tension: 120,
    }).start();
  };

  const glowScale = breath.interpolate({
    inputRange: [0, 1],

    outputRange: [1, 1.08],
  });

  const glowOpacity = breath.interpolate({
    inputRange: [0, 1],

    outputRange: [0.35, 0.7],
  });

  const rippleScale = ripple.interpolate({
    inputRange: [0, 1],

    outputRange: [1, 1.45],
  });

  const rippleOpacity = ripple.interpolate({
    inputRange: [0, 1],

    outputRange: [0.4, 0],
  });

  const handleLongPress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    onLongPress?.();
  };

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact, style]}>
      <Animated.View
        pointerEvents="none"

        style={[
          styles.ripple,

          compact && styles.rippleCompact,

          { transform: [{ scale: rippleScale }], opacity: rippleOpacity },
        ]}
      />

      <Animated.View
        pointerEvents="none"

        style={[
          styles.glow,

          compact && styles.glowCompact,

          { transform: [{ scale: glowScale }], opacity: glowOpacity },
        ]}
      />

      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          accessibilityRole="button"

          accessibilityLabel="Emergency SOS"

          accessibilityHint="Press and hold to trigger emergency assistance"

          onPress={onPress}

          onLongPress={handleLongPress}

          delayLongPress={600}

          onPressIn={() => animateTo(0.94)}

          onPressOut={() => animateTo(1)}
        >
          <LinearGradient
            colors={[...grads.sos]}

            start={{ x: 0, y: 0 }}

            end={{ x: 1, y: 1 }}

            style={[
              styles.button,

              compact && styles.buttonCompact,

              holding && styles.holding,

              elev.fab,
            ]}
          >
            <Text
              style={[
                styles.label,

                compact && styles.labelCompact,

                { color: c.textOnDanger },
              ]}
            >
              {label}
            </Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: touch.sosSize + 16,

    height: touch.sosSize + 16,

    alignItems: "center",

    justifyContent: "center",
  },

  wrapCompact: {
    width: 76,

    height: 76,
  },

  glow: {
    position: "absolute",

    width: touch.sosSize + 8,

    height: touch.sosSize + 8,

    borderRadius: radius.full,

    backgroundColor: "rgba(244, 63, 94, 0.35)",
  },

  glowCompact: {
    width: 70,

    height: 70,
  },

  ripple: {
    position: "absolute",

    width: touch.sosSize + 14,

    height: touch.sosSize + 14,

    borderRadius: radius.full,

    borderWidth: 2,

    borderColor: "rgba(244, 63, 94, 0.45)",
  },

  rippleCompact: {
    width: 74,

    height: 74,
  },

  button: {
    width: touch.sosSize,

    height: touch.sosSize,

    borderRadius: radius.full,

    alignItems: "center",

    justifyContent: "center",
  },

  buttonCompact: {
    width: 64,

    height: 64,
  },

  holding: {
    opacity: 0.92,
  },

  label: {
    fontFamily: typography.fontFamily.bold,

    fontSize: typography.size.title,

    letterSpacing: 1,
  },

  labelCompact: {
    fontSize: 15,

    letterSpacing: 0.6,
  },
});
