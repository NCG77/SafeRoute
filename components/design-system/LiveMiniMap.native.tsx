import { TourAnchor } from "@/components/tour/TourAnchor";
import { motion, radius, spacing, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

export type LiveMiniMapProps = {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  mapTourId?: string;
};

const FALLBACK = {
  latitude: 23.2599,
  longitude: 77.4126,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

/** Live map preview card for Home. SOS floats on the screen, not inside this card. */
export function LiveMiniMap({
  onPress,
  style,
  mapTourId = "heatmap",
}: LiveMiniMapProps) {
  const { colors: c, elevation: elev, isDark } = useAppTheme();
  const pulse = useSharedValue(1);
  const [region, setRegion] = useState(FALLBACK);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.15, {
        duration: motion.slow * 2,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, [pulse]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== Location.PermissionStatus.GRANTED || cancelled) return;
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        setRegion({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        });
      } catch {
        // Keep the fallback region so the card still shows a map.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const liveDotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 2 - pulse.value,
  }));

  return (
    <TourAnchor
      id={mapTourId}
      style={[
        styles.card,
        {
          backgroundColor: c.surface,
          borderColor: c.border,
          ...elev.card,
        },
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Open live map"
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: c.textPrimary }]}>
              Around you
            </Text>
            <View
              style={[styles.livePill, { backgroundColor: c.dangerContainer }]}
            >
              <Animated.View
                style={[
                  styles.liveDot,
                  { backgroundColor: c.danger },
                  liveDotStyle,
                ]}
              />
              <Text style={[styles.liveText, { color: c.danger }]}>LIVE</Text>
            </View>
          </View>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            Your area, updating as you move
          </Text>
        </View>

        <View style={[styles.mapFrame, { backgroundColor: c.heroWash }]}>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            region={region}
            pointerEvents="none"
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            showsUserLocation
            showsMyLocationButton={false}
            toolbarEnabled={false}
            userInterfaceStyle={isDark ? "dark" : "light"}
          />
        </View>
      </Pressable>
    </TourAnchor>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.98,
  },
  header: {
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.size.title,
    letterSpacing: -0.3,
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  liveText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.body,
    lineHeight: typography.lineHeight.body,
  },
  mapFrame: {
    height: 210,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: "100%",
  },
});
