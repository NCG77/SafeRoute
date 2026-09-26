import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { motion, radius, spacing, touch, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

export type SecondaryButtonProps = PressableProps & {
  label: string;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function SecondaryButton({
  label,
  fullWidth = true,
  disabled,
  style,
  ...rest
}: SecondaryButtonProps) {
  const { colors: c, elevation: elev } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: c.surface,
          borderColor: pressed && !disabled ? c.primary : c.border,
          ...(pressed && !disabled ? elev.cardLift : elev.card),
          ...(pressed && !disabled
            ? {
                backgroundColor: c.surfaceVariant,
                transform: [{ scale: motion.pressScale }],
              }
            : null),
        },
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      <Text style={[styles.label, { color: c.textPrimary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touch.buttonHeight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.size.body,
    lineHeight: typography.lineHeight.body,
  },
});
