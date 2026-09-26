/**
 * Notification permission helpers that stay safe in Expo Go (SDK 53+),
 * where importing expo-notifications throws at module load.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import type { PermissionStatus } from "@/components/design-system";

const STORAGE_NOTIF = "@SafeRoute:notificationsConsent";

const isExpoGo =
  Constants.appOwnership === "expo" ||
  // Expo Go / store client — push APIs unavailable
  (Constants as { executionEnvironment?: string }).executionEnvironment ===
    "storeClient";

export function notificationsNeedDevBuild(): boolean {
  return isExpoGo;
}

export async function getNotificationPermissionStatus(): Promise<{
  status: PermissionStatus;
  canAskAgain: boolean;
}> {
  if (isExpoGo) {
    const consent = await AsyncStorage.getItem(STORAGE_NOTIF);
    return {
      status: consent === "true" ? "granted" : "not_determined",
      canAskAgain: true,
    };
  }

  const Notifications = await import("expo-notifications");
  const current = await Notifications.getPermissionsAsync();
  if (current.status === "granted") {
    return { status: "granted", canAskAgain: current.canAskAgain };
  }
  if (current.status === "denied" && !current.canAskAgain) {
    return { status: "blocked", canAskAgain: false };
  }
  if (current.status === "denied") {
    return { status: "denied", canAskAgain: current.canAskAgain };
  }
  return { status: "not_determined", canAskAgain: true };
}

export async function requestNotificationPermission(): Promise<PermissionStatus> {
  if (isExpoGo) {
    await AsyncStorage.setItem(STORAGE_NOTIF, "true");
    return "granted";
  }

  const Notifications = await import("expo-notifications");
  const result = await Notifications.requestPermissionsAsync();
  if (result.status === "granted") return "granted";
  if (result.status === "denied" && !result.canAskAgain) return "blocked";
  if (result.status === "denied") return "denied";
  return "not_determined";
}
