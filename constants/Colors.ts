/**
 * Expo Router / React Navigation color scheme.
 * Aligns with SafeRoute 2.0 design tokens.
 */
import { darkColors, lightColors } from "./theme";

export const Colors = {
  light: {
    text: lightColors.textPrimary,
    background: lightColors.background,
    tint: lightColors.primary,
    icon: lightColors.textSecondary,
    tabIconDefault: lightColors.textSecondary,
    tabIconSelected: lightColors.primary,
  },
  dark: {
    text: darkColors.textPrimary,
    background: darkColors.background,
    tint: darkColors.primary,
    icon: darkColors.textSecondary,
    tabIconDefault: darkColors.textTertiary,
    tabIconSelected: darkColors.primary,
  },
};
