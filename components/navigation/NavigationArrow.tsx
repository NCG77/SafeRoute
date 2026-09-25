import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { Marker } from "react-native-maps";

export type NavigationArrowProps = {
  coordinate: { latitude: number; longitude: number };
  /** Degrees clockwise from north */
  heading: number;
  color?: string;
};

/**
 * GMaps-style chevron / navigation puck that rotates with travel heading.
 */
export function NavigationArrow({
  coordinate,
  heading,
  color = "#4F46E5",
}: NavigationArrowProps) {
  const markerRef = useRef<any>(null);

  // Brief tracksViewChanges so the custom view paints, then freeze for perf.
  useEffect(() => {
    const t = setTimeout(() => {
      markerRef.current?.setNativeProps?.({ tracksViewChanges: false });
    }, 500);
    return () => clearTimeout(t);
  }, [coordinate.latitude, coordinate.longitude, heading, color]);

  return (
    <Marker
      ref={markerRef}
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      flat
      rotation={heading}
      tracksViewChanges
      zIndex={10}
      accessibilityLabel="Your navigation position"
    >
      <View style={styles.wrap}>
        <View style={[styles.glow, { borderColor: color }]} />
        <View style={[styles.puck, { backgroundColor: color }]}>
          <View style={styles.chevron} />
        </View>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  puck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  /** Points "up" (north); Marker.rotation turns it with heading */
  chevron: {
    width: 0,
    height: 0,
    marginTop: -2,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#FFFFFF",
  },
});
