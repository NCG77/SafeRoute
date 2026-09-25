import { db } from "@/config/firebase";
import { spacing, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type LivePoint = {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  recordedAtMs?: number;
};

export default function LiveWalkViewer() {
  const { colors: c } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId?: string; collection?: string }>();
  const collection = params.collection === "emergencies" ? "emergencies" : "routes";
  const [point, setPoint] = useState<LivePoint | null>(null);
  const [destination, setDestination] = useState<LivePoint | null>(null);
  const [status, setStatus] = useState("active");
  const [title, setTitle] = useState("Live safety session");
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const stopLiveRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5_000);
    if (!params.sessionId) {
      return () => clearInterval(timer);
    }
    const sessionRef = doc(db, collection, params.sessionId);
    const liveRef = doc(db, collection, params.sessionId, "live", "current");
    const stopSession = onSnapshot(
      sessionRef,
      (snap) => {
        if (!snap.exists()) {
          setError("This safety session is no longer available.");
          return;
        }
        const data = snap.data();
        const nextStatus = String(data.state ?? data.status ?? "active");
        setStatus(nextStatus);
        if (["completed", "cancelled", "expired", "resolved"].includes(nextStatus)) {
          stopLiveRef.current?.();
          stopLiveRef.current = null;
        }
        const nextDestination = data.destination as LivePoint | undefined;
        if (
          typeof nextDestination?.latitude === "number" &&
          typeof nextDestination.longitude === "number"
        ) {
          setDestination(nextDestination);
        }
        setTitle(
          String(
            data.walkerName ??
              (collection === "emergencies" ? "Emergency location" : "Live Safe Walk"),
          ),
        );
      },
      () => setError("You are not authorized to view this session."),
    );
    const stopLive = onSnapshot(
      liveRef,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        const location = data.location as LivePoint | undefined;
        if (
          typeof location?.latitude === "number" &&
          typeof location.longitude === "number"
        ) {
          setPoint({ ...location, recordedAtMs: data.recordedAtMs });
        }
      },
      () => setError("Live location is unavailable."),
    );
    stopLiveRef.current = stopLive;
    return () => {
      clearInterval(timer);
      stopSession();
      stopLive();
      stopLiveRef.current = null;
    };
  }, [collection, params.sessionId]);

  const staleSeconds = point?.recordedAtMs
    ? Math.max(0, Math.round((now - point.recordedAtMs) / 1000))
    : null;
  const region = useMemo(
    () =>
      point
        ? {
            latitude: point.latitude,
            longitude: point.longitude,
            latitudeDelta: 0.008,
            longitudeDelta: 0.008,
          }
        : null,
    [point],
  );

  return (
    <View style={[styles.root, { backgroundColor: c.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Close live viewer">
          <MaterialIcons name="close" size={26} color={c.textPrimary} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text>
          <Text style={[styles.status, { color: c.textSecondary }]}>
            {status.replaceAll("_", " ")}
            {staleSeconds != null ? ` · updated ${staleSeconds}s ago` : ""}
          </Text>
        </View>
      </View>
      {error || !params.sessionId ? (
        <View style={styles.center}>
          <MaterialIcons name="location-off" size={48} color={c.danger} />
          <Text style={[styles.message, { color: c.textSecondary }]}>
            {error ?? "This notification does not contain a session."}
          </Text>
        </View>
      ) : region && point ? (
        <MapView style={styles.map} provider={PROVIDER_GOOGLE} region={region}>
          <Marker coordinate={point} title={title} />
          {destination ? (
            <Marker coordinate={destination} title="Destination" pinColor="#4F46E5" />
          ) : null}
        </MapView>
      ) : (
        <View style={styles.center}>
          <ActivityIndicator color={c.primary} size="large" />
          <Text style={[styles.message, { color: c.textSecondary }]}>
            Waiting for the first GPS update…
          </Text>
        </View>
      )}
      {staleSeconds != null && staleSeconds > 30 ? (
        <View style={[styles.stale, { backgroundColor: c.warningContainer }]}>
          <Text style={[styles.staleText, { color: c.textPrimary }]}>
            Location is stale. The walker may have lost data or background access.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    minHeight: 72,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  headerText: { flex: 1 },
  title: { fontFamily: typography.fontFamily.bold, fontSize: typography.size.title },
  status: { fontFamily: typography.fontFamily.regular, fontSize: typography.size.caption },
  map: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  message: { fontFamily: typography.fontFamily.medium, textAlign: "center", paddingHorizontal: spacing.xl },
  stale: { position: "absolute", left: spacing.md, right: spacing.md, bottom: spacing.lg, padding: spacing.md, borderRadius: 12 },
  staleText: { fontFamily: typography.fontFamily.medium, fontSize: typography.size.caption },
});
