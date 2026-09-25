import {
  ensureUserProfile,
  registerPushToken,
  routeFromNotification,
} from "@/services/notifications";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { auth } from "@/config/firebase";

export function useNotificationBootstrap(): void {
  const router = useRouter();

  useEffect(() => {
    let active = true;
    const open = (response: Notifications.NotificationResponse | null) => {
      const route = routeFromNotification(response);
      if (active && route) router.push(route as never);
    };

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) return;
      void ensureUserProfile().catch(console.warn);
      void registerPushToken().catch(console.warn);
    });
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener(open);
    void Notifications.getLastNotificationResponseAsync().then(open);

    return () => {
      active = false;
      authUnsubscribe();
      responseSubscription.remove();
    };
  }, [router]);
}
