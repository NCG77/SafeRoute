import { LinearGradient } from "expo-linear-gradient";
import React, { useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { motion, radius, spacing, touch, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

export type PrimaryButtonProps = PressableProps & {
  label: string;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({
  label,
  loading = false,
  fullWidth = true,
  disabled,
  style,
  onPressIn,
  onPressOut,
  ...rest
}: PrimaryButtonProps) {
  const { colors: c, gradients: grads } = useAppTheme();
  const isDisabled = disabled || loading;
  const scale = useRef(new Animated.Value(1)).current;

  const animatePress = (down: boolean) => {
    Animated.spring(scale, {
      toValue: down ? motion.pressScale : 1,
      useNativeDriver: true,
      friction: 7,
      tension: 160,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.wrap,
        fullWidth && styles.fullWidth,
        { transform: [{ scale }], shadowColor: c.primary },
        isDisabled && styles.disabled,
        style,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!isDisabled, busy: loading }}
        disabled={isDisabled}
        onPressIn={(e) => {
          if (!isDisabled) animatePress(true);
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          if (!isDisabled) animatePress(false);
          onPressOut?.(e);
        }}
        {...rest}
      >
        <LinearGradient
          colors={[...grads.primaryButton]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.base}
        >
          {loading ? (
            <ActivityIndicator color={c.textOnPrimary} />
          ) : (
            <Text style={[styles.label, { color: c.textOnPrimary }]}>
              {label}
            </Text>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.pill,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  base: {
    minHeight: touch.buttonHeight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.size.body,
    lineHeight: typography.lineHeight.body,
    letterSpacing: 0.2,
  },
});
