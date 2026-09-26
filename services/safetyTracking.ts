import { auth } from "@/config/firebase";
import {
  SAFETY_LOCATION_TASK,
  TRACKING_PAYLOAD_KEY,
  type TrackingPayload,
  writeTrackedLocation,
} from "@/tasks/locationTracking";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

export async function publishSafetyLocation(
  payload: TrackingPayload,
  location: Location.LocationObject,
): Promise<void> {
  if (auth.currentUser?.uid !== payload.userId) return;
  await writeTrackedLocation(payload, location, "foreground");
}

export async function startSafetyTracking(
  collection: TrackingPayload["collection"],
  sessionId: string,
): Promise<{ payload: TrackingPayload; background: boolean }> {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in is required to share a live location.");

  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== Location.PermissionStatus.GRANTED) {
    throw new Error("Location permission is required.");
  }

  const payload: TrackingPayload = {
    collection,
    sessionId,
    userId: user.uid,
  };
  await AsyncStorage.setItem(TRACKING_PAYLOAD_KEY, JSON.stringify(payload));

  const first = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  await publishSafetyLocation(payload, first);

  let background = false;
  try {
    const permission = await Location.requestBackgroundPermissionsAsync();
    if (permission.status === Location.PermissionStatus.GRANTED) {
      const running = await TaskManager.isTaskRegisteredAsync(
        SAFETY_LOCATION_TASK,
      );
      if (running) {
        await Location.stopLocationUpdatesAsync(SAFETY_LOCATION_TASK);
      }
      await Location.startLocationUpdatesAsync(SAFETY_LOCATION_TASK, {
        accuracy: Location.Accuracy.High,
        timeInterval: 10_000,
        distanceInterval: 5,
        deferredUpdatesInterval: 10_000,
        pausesUpdatesAutomatically: false,
        foregroundService: {
          notificationTitle: "SafeRoute live safety tracking",
          notificationBody: "Your guardian can see your latest location.",
          notificationColor: "#4F46E5",
        },
      });
      background = true;
    }
  } catch (error) {
    console.warn("Background tracking unavailable; foreground tracking remains active.", error);
  }
  return { payload, background };
}

export async function stopSafetyTracking(): Promise<void> {
  try {
    const running = await TaskManager.isTaskRegisteredAsync(
      SAFETY_LOCATION_TASK,
    );
    if (running) await Location.stopLocationUpdatesAsync(SAFETY_LOCATION_TASK);
  } finally {
    await AsyncStorage.removeItem(TRACKING_PAYLOAD_KEY);
  }
}
