import { auth, db } from "@/config/firebase";
import { SIGNUP_PHONE_KEY } from "@/constants/preferences";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PUSH_TOKEN_KEY = "@SafeRoute:expoPushToken";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function projectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId
  );
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`${label} timed out after ${ms}ms`)),
          ms,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function ensureUserProfile(): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  const ref = doc(db, "users", user.uid);
  const phoneDigits = await AsyncStorage.getItem(SIGNUP_PHONE_KEY);

  await withTimeout(
    (async () => {
      const existing = await getDoc(ref);
      const base: Record<string, unknown> = {
        displayName: user.displayName ?? "",
        email: user.email ?? "",
        updatedAt: new Date(),
      };
      if (phoneDigits) {
        base.phone = phoneDigits.startsWith("+")
          ? phoneDigits
          : `+91${phoneDigits}`;
      }
      // Seed trust / createdAt only on first write — never clobber live scores.
      if (!existing.exists()) {
        base.trustScore = 50;
        base.trustLevel = "standard";
        base.createdAt = new Date();
      } else {
        const data = existing.data();
        if (typeof data.trustScore !== "number") base.trustScore = 50;
        if (typeof data.trustLevel !== "string") base.trustLevel = "standard";
        if (!data.createdAt) base.createdAt = new Date();
      }
      await setDoc(ref, base, { merge: true });
    })(),
    8_000,
    "ensureUserProfile",
  );
}

export async function registerPushToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user || Platform.OS === "web") return null;

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("safety-alerts", {
        name: "Safety alerts",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 180, 250],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    }

    const current = await Notifications.getPermissionsAsync();
    const permission =
      current.status === "granted"
        ? current
        : await Notifications.requestPermissionsAsync();
    if (permission.status !== "granted") return null;

    const easProjectId = projectId();
    if (!easProjectId) {
      console.warn("EXPO_PUBLIC_EAS_PROJECT_ID is required for push tokens.");
      return null;
    }

    // Without google-services / FCM credentials this call can hang on Android.
    const token = (
      await withTimeout(
        Notifications.getExpoPushTokenAsync({ projectId: easProjectId }),
        8_000,
        "getExpoPushTokenAsync",
      )
    ).data;
    await setDoc(
      doc(db, "users", user.uid),
      {
        expoPushTokens: arrayUnion(token),
        updatedAt: new Date(),
      },
      { merge: true },
    );
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
    return token;
  } catch (error) {
    console.warn("Push token registration skipped:", error);
    return null;
  }
}

export async function unregisterPushToken(token: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  await updateDoc(doc(db, "users", user.uid), {
    expoPushTokens: arrayRemove(token),
    updatedAt: new Date(),
  });
  await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
}

export async function unregisterCurrentPushToken(): Promise<void> {
  const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  if (token) await unregisterPushToken(token);
}

export function routeFromNotification(
  response: Notifications.NotificationResponse | null,
): string | null {
  const route = response?.notification.request.content.data?.route;
  return typeof route === "string" && route.startsWith("/") ? route : null;
}
