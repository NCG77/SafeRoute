import { useProductTourOptional } from "@/hooks/useProductTour";
import React, { useCallback, useEffect, useRef } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

type TourAnchorProps = {
  id: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Measures window position for the product-tour spotlight. */
export function TourAnchor({ id, children, style }: TourAnchorProps) {
  const tour = useProductTourOptional();
  const ref = useRef<View>(null);

  const measure = useCallback(() => {
    if (!tour) return;
    // Double-rAF waits for layout + scroll paint before reading bounds
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ref.current?.measureInWindow((x, y, width, height) => {
          if (
            width > 1 &&
            height > 1 &&
            Number.isFinite(x) &&
            Number.isFinite(y)
          ) {
            tour.registerTarget(id, { x, y, width, height });
          }
        });
      });
    });
  }, [id, tour]);

  // Remeasure after layout, scroll settles, and each tour step — spotlight
  // must match the live feature box, not a mid-animation frame.
  useEffect(() => {
    if (!tour?.active) return;
    let cancelled = false;
    const delays = [0, 80, 200, 400, 650, 1000];
    const timers = delays.map((ms) =>
      setTimeout(() => {
        if (!cancelled) measure();
      }, ms),
    );
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [measure, tour?.active, tour?.stepIndex, tour?.measureEpoch]);

  return (
    <View
      ref={ref}
      collapsable={false}
      onLayout={measure}
      style={style}
    >
      {children}
    </View>
  );
}
