import { LiveNavigationHUD } from "@/components/navigation/LiveNavigationHUD";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

const PATH = [
  { latitude: 23.2599, longitude: 77.4126 },
  { latitude: 23.252, longitude: 77.42 },
  { latitude: 23.245, longitude: 77.428 },
  { latitude: 23.233, longitude: 77.434 },
];

/**
 * Live Navigation design screen — full-screen map + dark HUD.
 * Production trips use the same HUD inside the Map tab.
 */
export default function LiveNavigationScreen() {
  const { colors: c } = useAppTheme();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [score] = useState(74);

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        userInterfaceStyle="dark"
        customMapStyle={DARK_MAP}
        initialRegion={{
          latitude: 23.248,
          longitude: 77.422,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
      >
        <Polyline
          coordinates={PATH}
          strokeColor={c.primary}
          strokeWidth={6}
          lineCap="round"
        />
        <Marker coordinate={PATH[0]} title="You" pinColor={c.primary} />
        <Marker
          coordinate={PATH[PATH.length - 1]}
          title="Destination"
          pinColor={c.success}
        />
      </MapView>

      <LiveNavigationHUD
        visible
        instruction="Turn right onto Lake Road"
        maneuverDistance="120 m"
        remainingMinutes={14}
        remainingKm={2.8}
        safetyScore={score}
        vibrationActive={score < 55}
        guardian={{ name: "Priya", connected: true, phone: "9876543210" }}
        onCallGuardian={() => {}}
        onReport={() => {}}
        onSOS={() => router.push("/SOS" as never)}
        onEnd={() => router.back()}
      />
    </View>
  );
}

/** Subtle dark basemap accents — keeps HUD contrast high at night. */
const DARK_MAP = [
  { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#304a7d" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0e1626" }],
  },
];

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0e1626",
  },
});
