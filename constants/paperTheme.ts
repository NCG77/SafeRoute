import {
  MD3DarkTheme,
  MD3LightTheme,
  configureFonts,
  type MD3Theme,
} from "react-native-paper";
import { darkColors, lightColors, typography } from "./theme";

const fontConfig = {
  fontFamily: typography.fontFamily.regular,
} as const;

function buildPaper(base: MD3Theme, c: typeof lightColors): MD3Theme {
  return {
    ...base,
    roundness: 24,
    colors: {
      ...base.colors,
      primary: c.primary,
      primaryContainer: c.primaryContainer,
      onPrimary: c.textOnPrimary,
      onPrimaryContainer: c.primaryOnContainer,
      secondary: c.secondary,
      secondaryContainer: c.secondaryContainer,
      onSecondary: c.textOnPrimary,
      onSecondaryContainer: c.textPrimary,
      tertiary: c.accent,
      tertiaryContainer: c.successContainer,
      error: c.errorText,
      errorContainer: c.dangerContainer,
      onError: c.textOnDanger,
      background: c.background,
      onBackground: c.textPrimary,
      surface: c.surface,
      onSurface: c.textPrimary,
      surfaceVariant: c.surfaceVariant,
      onSurfaceVariant: c.textSecondary,
      outline: c.border,
      outlineVariant: c.divider,
      inverseSurface: c.charcoal,
      inverseOnSurface: c.textLight,
      inversePrimary: c.primaryContainer,
      elevation: {
        level0: "transparent",
        level1: c.surface,
        level2: c.surfaceElevated,
        level3: c.surfaceElevated,
        level4: c.surfaceElevated,
        level5: c.surfaceElevated,
      },
    },
    fonts: configureFonts({ config: fontConfig }),
  };
}

export const paperTheme = buildPaper(MD3LightTheme, lightColors);
export const paperThemeDark = buildPaper(MD3DarkTheme, darkColors);

export function paperThemeFor(scheme: "light" | "dark"): MD3Theme {
  return scheme === "dark" ? paperThemeDark : paperTheme;
}
