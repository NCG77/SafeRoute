/**
 * SafeRoute 2.0 Visual Identity — Inter typography, soft indigo palette, layered elevation.
 * Light + dark (indigo-night) schemes share the same token keys.
 */

export type ColorTokens = {
  primary: string;
  primaryPressed: string;
  primaryContainer: string;
  primaryOnContainer: string;
  secondary: string;
  secondaryContainer: string;

  accent: string;
  accentContainer: string;

  success: string;
  successContainer: string;
  successText: string;
  warning: string;
  warningContainer: string;
  danger: string;
  dangerContainer: string;
  dangerPressed: string;
  errorText: string;

  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceVariant: string;
  surfaceGlass: string;

  textPrimary: string;
  textSecondary: string;
  textLabel: string;
  textTertiary: string;
  textOnPrimary: string;
  textOnDanger: string;
  textDisabled: string;
  textLink: string;

  charcoal: string;
  border: string;
  borderFocus: string;
  divider: string;
  overlay: string;
  scrim: string;

  heroWash: string;
  indigoGlow: string;
  headerWash: readonly [string, string];

  /** Legacy aliases */
  info: string;
  textLight: string;
  backgroundLight: string;
  backgroundSelected: string;
  lightGray: string;
  cardBackground: string;
  primaryLight: string;
};

/**
 * Light — soft indigo on near-white.
 */
export const lightColors: ColorTokens = {
  primary: "#4F46E5",
  primaryPressed: "#4338CA",
  primaryContainer: "#EEF2FF",
  primaryOnContainer: "#312E81",
  secondary: "#2563EB",
  secondaryContainer: "#DBEAFE",

  accent: "#7C3AED",
  accentContainer: "#F3E8FF",

  success: "#10B981",
  successContainer: "#D1FAE5",
  successText: "#059669",
  warning: "#F59E0B",
  warningContainer: "#FEF3C7",
  danger: "#EF4444",
  dangerContainer: "#FEE2E2",
  dangerPressed: "#DC2626",
  errorText: "#DC2626",

  background: "#FAFBFD",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  surfaceVariant: "#F1F5F9",
  surfaceGlass: "rgba(255, 255, 255, 0.88)",

  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  textLabel: "#475569",
  textTertiary: "#94A3B8",
  textOnPrimary: "#FFFFFF",
  textOnDanger: "#FFFFFF",
  textDisabled: "#CBD5E1",
  textLink: "#4F46E5",

  charcoal: "#0F172A",
  border: "#E2E8F0",
  borderFocus: "#4F46E5",
  divider: "#E2E8F0",
  overlay: "rgba(15, 23, 42, 0.45)",
  scrim: "rgba(15, 23, 42, 0.32)",

  heroWash: "#EEF2FF",
  indigoGlow: "rgba(79, 70, 229, 0.18)",
  headerWash: ["#EEF2FF", "#FAFBFD"] as const,

  info: "#2563EB",
  textLight: "#FAFBFD",
  backgroundLight: "#FAFBFD",
  backgroundSelected: "#EEF2FF",
  lightGray: "#F1F5F9",
  cardBackground: "#FFFFFF",
  primaryLight: "#EEF2FF",
};

/**
 * Dark — indigo-night (Material tonal surfaces + cool navy canvas).
 * Canvas #0B0F1A · cards #151A2D / #1C2238 · accent #818CF8 · text #E8EAF6 / #A6ACD6
 * Keeps SafeRoute’s indigo brand without white cards on a dark scrub.
 */
export const darkColors: ColorTokens = {
  primary: "#818CF8",
  primaryPressed: "#A5B4FC",
  primaryContainer: "#1E1B4B",
  primaryOnContainer: "#C7D2FE",
  secondary: "#60A5FA",
  secondaryContainer: "#1E3A5F",

  accent: "#A78BFA",
  accentContainer: "#2E1065",

  success: "#34D399",
  successContainer: "#064E3B",
  successText: "#6EE7B7",
  warning: "#FBBF24",
  warningContainer: "#78350F",
  danger: "#F87171",
  dangerContainer: "#7F1D1D",
  dangerPressed: "#EF4444",
  errorText: "#FCA5A5",

  background: "#0B0F1A",
  surface: "#151A2D",
  surfaceElevated: "#1C2238",
  surfaceVariant: "#1F2540",
  surfaceGlass: "rgba(21, 26, 45, 0.94)",

  textPrimary: "#E8EAF6",
  textSecondary: "#A6ACD6",
  textLabel: "#C4C9E8",
  textTertiary: "#7B82A8",
  textOnPrimary: "#0B0F1A",
  textOnDanger: "#FFFFFF",
  textDisabled: "#4A5168",
  textLink: "#A5B4FC",

  charcoal: "#E8EAF6",
  border: "#2A3150",
  borderFocus: "#818CF8",
  divider: "#2A3150",
  overlay: "rgba(0, 0, 0, 0.55)",
  scrim: "rgba(0, 0, 0, 0.45)",

  heroWash: "#1E1B4B",
  indigoGlow: "rgba(129, 140, 248, 0.22)",
  headerWash: ["#151A2D", "#0B0F1A"] as const,

  info: "#60A5FA",
  textLight: "#E8EAF6",
  backgroundLight: "#0B0F1A",
  backgroundSelected: "#1E1B4B",
  lightGray: "#1F2540",
  cardBackground: "#151A2D",
  primaryLight: "#1E1B4B",
};

/** @deprecated Prefer useAppTheme().colors — defaults to light for StyleSheet modules */
export const colors = lightColors;

export function paletteFor(scheme: "light" | "dark"): ColorTokens {
  return scheme === "dark" ? darkColors : lightColors;
}

/** Soft multi-stop fills — never plain solid CTAs */
export const lightGradients = {
  primaryButton: ["#5B5CFF", "#3B82F6"] as const,
  safetyBadge: ["#10B981", "#34D399"] as const,
  safetyMid: ["#F59E0B", "#FBBF24"] as const,
  safetyHigh: ["#EF4444", "#F43F5E"] as const,
  sos: ["#F43F5E", "#EF4444"] as const,
  navActive: ["#4F46E5", "#2563EB"] as const,
  greeting: ["#312E81", "#4F46E5"] as const,
  important: ["#4F46E5", "#7C3AED"] as const,
  iconPrimary: ["#EEF2FF", "#E0E7FF"] as const,
  iconSuccess: ["#D1FAE5", "#A7F3D0"] as const,
  iconWarning: ["#FEF3C7", "#FDE68A"] as const,
  iconDanger: ["#FEE2E2", "#FECACA"] as const,
  iconAccent: ["#F3E8FF", "#E9D5FF"] as const,
  header: ["#EEF2FF", "#FAFBFD"] as const,
} as const;

export const darkGradients = {
  primaryButton: ["#818CF8", "#6366F1"] as const,
  safetyBadge: ["#059669", "#34D399"] as const,
  safetyMid: ["#D97706", "#FBBF24"] as const,
  safetyHigh: ["#DC2626", "#F87171"] as const,
  sos: ["#F43F5E", "#EF4444"] as const,
  navActive: ["#818CF8", "#60A5FA"] as const,
  greeting: ["#A5B4FC", "#818CF8"] as const,
  important: ["#818CF8", "#A78BFA"] as const,
  iconPrimary: ["#1E1B4B", "#312E81"] as const,
  iconSuccess: ["#064E3B", "#065F46"] as const,
  iconWarning: ["#78350F", "#92400E"] as const,
  iconDanger: ["#7F1D1D", "#991B1B"] as const,
  iconAccent: ["#2E1065", "#4C1D95"] as const,
  header: ["#151A2D", "#0B0F1A"] as const,
} as const;

export const gradients = lightGradients;

export function gradientsFor(scheme: "light" | "dark") {
  return scheme === "dark" ? darkGradients : lightGradients;
}

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
} as const;

/** Prefer 24px (xl) for cards / surfaces */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  search: 24,
  hero: 24,
  pill: 999,
  full: 9999,
} as const;

/**
 * Inter scale — Display 42 · H1 34 · H2 28 · H3 22 · Body 16 · Caption 13
 * Line-heights ~135%. Large headings: letterSpacing ≈ −1%.
 */
export const typography = {
  fontFamily: {
    regular: "Inter_400Regular",
    medium: "Inter_500Medium",
    semibold: "Inter_600SemiBold",
    bold: "Inter_700Bold",
  },
  size: {
    caption: 13,
    body: 16,
    bodyLarge: 16,
    title: 22, // H3
    headline: 34, // H1
    display: 28, // H2
    hero: 42, // Display
  },
  lineHeight: {
    caption: 18, // ~138%
    body: 22, // ~138%
    bodyLarge: 22,
    title: 30, // ~136%
    headline: 46, // ~135%
    display: 38, // ~136%
    hero: 56, // ~133%
  },
  /** −1% tracking for large headings */
  tracking: {
    tight: -0.42,
    heading: -0.34,
    title: -0.22,
    body: 0,
  },
} as const;

/** Soft layered shadows — no harsh edges */
export const elevation = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  card: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  cardLift: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 8,
  },
  floating: {
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  fab: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 8,
  },
  sheet: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 14,
  },
} as const;

/** Dark mode: soft indigo glow instead of muddy black shadows */
export const elevationDark = {
  none: elevation.none,
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 3,
  },
  cardLift: {
    shadowColor: "#818CF8",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  floating: {
    shadowColor: "#818CF8",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 6,
  },
  fab: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  sheet: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 14,
  },
} as const;

export function elevationFor(scheme: "light" | "dark") {
  return scheme === "dark" ? elevationDark : elevation;
}

export const touch = {
  minTarget: 48,
  buttonHeight: 56,
  sosSize: 72,
  fabSize: 56,
  tabBarHeight: 90,
} as const;

export function tabContentBottomInset(safeBottom: number): number {
  const floatBottom = Math.max(safeBottom, spacing.sm);
  return touch.tabBarHeight + floatBottom + spacing.sm;
}

/** Micro-motion window: 180–300ms */
export const motion = {
  fast: 180,
  normal: 220,
  slow: 280,
  page: 220,
  stagger: 80,
  pressScale: 0.97,
  cardLift: -6,
  iconActive: 1.15,
  sosBreath: 2000,
  unreadPulse: 3000,
} as const;

export function safetyTone(score: number): {
  from: string;
  to: string;
  label: string;
} {
  if (score >= 70) {
    return {
      from: gradients.safetyBadge[0],
      to: gradients.safetyBadge[1],
      label: "Low risk",
    };
  }
  if (score >= 40) {
    return {
      from: gradients.safetyMid[0],
      to: gradients.safetyMid[1],
      label: "Medium",
    };
  }
  return {
    from: gradients.safetyHigh[0],
    to: gradients.safetyHigh[1],
    label: "High risk",
  };
}

export const theme = {
  colors,
  gradients,
  spacing,
  radius,
  typography,
  elevation,
  touch,
  motion,
  safetyTone,
} as const;

export type Theme = typeof theme;
export type ColorToken = keyof ColorTokens;
