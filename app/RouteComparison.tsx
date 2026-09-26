import { RouteComparisonOverlay } from "@/components/route/RouteComparisonOverlay";
import type { ComparisonRoute } from "@/components/route/ComparisonRouteCard";
import { useAppTheme } from "@/hooks/useAppTheme";
import { heatColor } from "@/core/heatmap";
import { useNavigation } from "expo-router/react-navigation";
import { useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

/** Demo polylines — slight offsets so three routes read on the map */
const ORIGIN = { latitude: 23.2599, longitude: 77.4126 };
const DEST = { latitude: 23.233, longitude: 77.434 };

function buildPath(bulge: number) {
  return [
    ORIGIN,
    {
      latitude:
        ORIGIN.latitude + (DEST.latitude - ORIGIN.latitude) * 0.35 + bulge,
      longitude:
        ORIGIN.longitude +
        (DEST.longitude - ORIGIN.longitude) * 0.4 -
        bulge * 0.5,
    },
    {
      latitude:
        ORIGIN.latitude + (DEST.latitude - ORIGIN.latitude) * 0.7 - bulge * 0.3,
      longitude:
        ORIGIN.longitude + (DEST.longitude - ORIGIN.longitude) * 0.75 + bulge,
    },
    DEST,
  ];
}

const DEMO_ROUTES: (ComparisonRoute & {
  coordinates: { latitude: number; longitude: number }[];
})[] = [
  {
    id: "safest",
    kind: "safest",
    label: "Safest",
    etaMinutes: 18,
    distanceKm: 4.2,
    safetyScore: 92,
    lightingScore: 89,
    crowdRatio: 0.82,
    crowdLabel: "High",
    color: heatColor(92),
    coordinates: buildPath(0.008),
  },
  {
    id: "balanced",
    kind: "balanced",
    label: "Balanced",
    etaMinutes: 14,
    distanceKm: 3.6,
    safetyScore: 78,
    lightingScore: 72,
    crowdRatio: 0.55,
    crowdLabel: "Medium",
    color: heatColor(78),
    coordinates: buildPath(0),
  },
  {
    id: "fastest",
    kind: "fastest",
    label: "Fastest",
    etaMinutes: 11,
    distanceKm: 3.1,
    safetyScore: 61,
    lightingScore: 54,
    crowdRatio: 0.28,
    crowdLabel: "Low",
    color: heatColor(61),
    coordinates: buildPath(-0.007),
  },
];

/**
 * Route Comparison — Apple Maps × Uber.
 * Edge-to-edge map, floating cards, AI rationale, Start Safe Walk.
 */
export default function RouteComparisonScreen() {
  const { colors: c } = useAppTheme();
  const router = useRouter();
  const navigation = useNavigation() as {
    navigate: (name: string, params?: object) => void;
  };
  const mapRef = useRef<MapView>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const routes: ComparisonRoute[] = useMemo(
    () => DEMO_ROUTES.map(({ coordinates: _c, ...rest }) => rest),
    [],
  );

  const selected = DEMO_ROUTES[selectedIndex];

  const onSelectRoute = (index: number) => {
    setSelectedIndex(index);
    const route = DEMO_ROUTES[index];
    mapRef.current?.fitToCoordinates(route.coordinates, {
      edgePadding: { top: 120, right: 40, bottom: 340, left: 40 },
      animated: true,
    });
  };

  const onStartSafeWalk = () => {
    navigation.navigate("LiveLocationShareScreen", { startSharing: true });
  };

  return (
    <View style={[styles.root, { backgroundColor: c.charcoal }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: (ORIGIN.latitude + DEST.latitude) / 2,
          longitude: (ORIGIN.longitude + DEST.longitude) / 2,
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
        }}
        onMapReady={() => onSelectRoute(0)}
      >
        {DEMO_ROUTES.map((route, index) => (
          <Polyline
            key={route.id}
            coordinates={route.coordinates}
            strokeColor={
              index === selectedIndex ? route.color : `${route.color}55`
            }
            strokeWidth={index === selectedIndex ? 6 : 4}
            lineCap="round"
            lineJoin="round"
            tappable
            onPress={() => onSelectRoute(index)}
          />
        ))}
        <Marker coordinate={ORIGIN} title="You" pinColor={c.primary} />
        <Marker coordinate={DEST} title="Destination" pinColor={c.success} />
      </MapView>

      <RouteComparisonOverlay
        visible
        routes={routes}
        selectedIndex={selectedIndex}
        onSelectRoute={onSelectRoute}
        onStartSafeWalk={onStartSafeWalk}
        onClose={() => router.back()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
