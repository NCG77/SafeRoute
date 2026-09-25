import {
  elevationFor,
  gradientsFor,
  paletteFor,
  type ColorTokens,
} from "@/constants/theme";
import { useAppearance } from "@/hooks/useAppearance";
import { useMemo } from "react";

export type AppTheme = {
  scheme: "light" | "dark";
  isDark: boolean;
  colors: ColorTokens;
  gradients: ReturnType<typeof gradientsFor>;
  elevation: ReturnType<typeof elevationFor>;
};

/** Active SafeRoute palette for the current appearance scheme. */
export function useAppTheme(): AppTheme {
  const { scheme } = useAppearance();
  return useMemo(
    () => ({
      scheme,
      isDark: scheme === "dark",
      colors: paletteFor(scheme),
      gradients: gradientsFor(scheme),
      elevation: elevationFor(scheme),
    }),
    [scheme],
  );
}
