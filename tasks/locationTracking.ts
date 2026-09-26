import { db } from "@/config/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

export const SAFETY_LOCATION_TASK = "saferoute-safety-location";
export const TRACKING_PAYLOAD_KEY = "@SafeRoute:safetyTrackingPayload";

export type TrackingPayload = {
  collection: "routes" | "emergencies";
  sessionId: string;
  userId: string;
};

export async function writeTrackedLocation(
  payload: TrackingPayload,
  location: Location.LocationObject,
  source: "foreground" | "background",
): Promise<void> {
  await setDoc(
    doc(db, payload.collection, payload.sessionId, "live", "current"),
    {
      ownerId: payload.userId,
      location: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        heading: location.coords.heading,
        speed: location.coords.speed,
      },
      recordedAtMs: location.timestamp,
      source,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

TaskManager.defineTask(SAFETY_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error("Safety location task failed", error);
    return;
  }
  try {
    const raw = await AsyncStorage.getItem(TRACKING_PAYLOAD_KEY);
    if (!raw) return;
    const payload = JSON.parse(raw) as TrackingPayload;
    const locations = (
      data as { locations?: Location.LocationObject[] } | undefined
    )?.locations;
    const latest = locations?.[locations.length - 1];
    if (latest) await writeTrackedLocation(payload, latest, "background");
  } catch (taskError) {
    console.error("Could not publish background safety location", taskError);
  }
});
