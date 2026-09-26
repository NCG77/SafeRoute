import {
  PermissionCard,
  PrimaryButton,
  SafeRouteMark,
  type PermissionStatus,
} from "@/components/design-system";
import {
  PERMISSIONS_WIZARD_KEY,
  PRODUCT_TOUR_PENDING_KEY,
} from "@/constants/preferences";
import { spacing, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/hooks/useAuth";
import {
  getNotificationPermissionStatus,
  notificationsNeedDevBuild,
  requestNotificationPermission,
} from "@/services/notificationPermissions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STORAGE_SMS = "@SafeRoute:emergencySmsConsent";

function mapLocationStatus(
  status: Location.PermissionStatus,
  canAskAgain: boolean,
): PermissionStatus {
  if (status === Location.PermissionStatus.GRANTED) return "granted";
  if (status === Location.PermissionStatus.DENIED && !canAskAgain) {
    return "blocked";
  }
  if (status === Location.PermissionStatus.DENIED) return "denied";
  return "not_determined";
}

export default function PermissionsScreen() {
  const { colors: c, elevation: elev } = useAppTheme();
  const router = useRouter();
  const { refreshBootstrap } = useAuth();
  const insets = useSafeAreaInsets();

  const [location, setLocation] = useState<PermissionStatus>("not_determined");
  const [notifications, setNotifications] =
    useState<PermissionStatus>("not_determined");
  const [sms, setSms] = useState<PermissionStatus>("not_determined");

  const [loadingKey, setLoadingKey] = useState<
    "location" | "notifications" | "sms" | null
  >(null);

  const refresh = useCallback(async () => {
    const loc = await Location.getForegroundPermissionsAsync();
    setLocation(mapLocationStatus(loc.status, loc.canAskAgain));

    const notif = await getNotificationPermissionStatus();
    setNotifications(notif.status);

    const smsConsent = await AsyncStorage.getItem(STORAGE_SMS);
    setSms(smsConsent === "true" ? "granted" : "not_determined");
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const openSettings = async () => {
    await Linking.openSettings();
  };

  const allowLocation = async () => {
    setLoadingKey("location");
    try {
      if (location === "blocked") {
        await openSettings();
        return;
      }
      const result = await Location.requestForegroundPermissionsAsync();
      setLocation(mapLocationStatus(result.status, result.canAskAgain));
      if (result.status !== Location.PermissionStatus.GRANTED) {
        Alert.alert(
          "Location helps keep you safer",
          "You can turn this on later in Settings. Safe routes and SOS work best with location.",
        );
      }
    } finally {
      setLoadingKey(null);
    }
  };

  const allowNotifications = async () => {
    setLoadingKey("notifications");
    try {
      if (notifications === "blocked") {
        await openSettings();
        return;
      }
      if (notificationsNeedDevBuild()) {
        Alert.alert(
          "Notifications in Expo Go",
          "Push alerts need a development build. We’ll remember you want them enabled for now.",
          [
            { text: "Not now", style: "cancel" },
            {
              text: "Enable for now",
              onPress: async () => {
                const status = await requestNotificationPermission();
                setNotifications(status);
              },
            },
          ],
        );
        return;
      }
      const status = await requestNotificationPermission();
      setNotifications(status);
    } finally {
      setLoadingKey(null);
    }
  };

  const allowSms = async () => {
    setLoadingKey("sms");
    try {
      Alert.alert(
        "Emergency SMS consent",
        Platform.OS === "ios"
          ? "If you trigger SOS and data is unavailable, SafeRoute can open Messages with your location so you can send it to trusted contacts. We never send texts without your SOS action."
          : "If you trigger SOS and data is unavailable, SafeRoute can open your SMS app with a pre-written alert including your location. Messages are only prepared when you start SOS—never in the background.",
        [
          { text: "Not now", style: "cancel" },
          {
            text: "I understand — Allow",
            onPress: async () => {
              await AsyncStorage.setItem(STORAGE_SMS, "true");
              setSms("granted");
            },
          },
        ],
      );
    } finally {
      setLoadingKey(null);
    }
  };

  const requiredReady = location === "granted" && sms === "granted";

  const onContinue = async () => {
    if (!requiredReady) {
      Alert.alert(
        "Two permissions keep core safety working",
        "Location and Emergency SMS are required for routing and offline SOS. Notifications are optional but help guardians reach you faster.",
      );
      return;
    }
    await AsyncStorage.setItem(PERMISSIONS_WIZARD_KEY, "true");
    await AsyncStorage.setItem(PRODUCT_TOUR_PENDING_KEY, "true");
    await refreshBootstrap();
    router.replace("/(tabs)/Home");
  };

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: Math.max(insets.top, spacing.sm),
          backgroundColor: c.background,
        },
      ]}
      accessibilityLabel="Permission setup"
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom, spacing.md) + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brand}>
          <SafeRouteMark size={44} />
          <Text style={[styles.wordmark, { color: c.textPrimary }]}>
            SafeRoute
          </Text>
        </View>

        <Text
          style={[styles.title, { color: c.textPrimary }]}
          accessibilityRole="header"
        >
          A few permissions, only for your safety
        </Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>
          We ask before we access anything. You stay in control—and we explain
          why each one matters.
        </Text>

        <View style={styles.cards}>
          <PermissionCard
            icon="my-location"
            title="Location"
            importance="required"
            why="So we can show where you are, pick safer nearby roads, and share a precise pin if you call for help."
            privacy="Your location is used for navigation and safety features on this device. We don’t sell it, and live sharing only happens when you choose a guardian trip."
            status={location}
            loading={loadingKey === "location"}
            onAllow={allowLocation}
          />

          <PermissionCard
            icon="notifications-none"
            title="Notifications"
            importance="recommended"
            why="So a guardian’s check-in, Safe Walk reminder, or SOS update can reach you even when the app is in the background."
            privacy="We only send alerts about trips and emergencies you started. No promo spam—ever."
            status={notifications}
            loading={loadingKey === "notifications"}
            onAllow={allowNotifications}
          />

          <PermissionCard
            icon="sms"
            title="Emergency SMS"
            importance="required"
            why="If mobile data fails during SOS, a text with your location can still reach the people you’ve trusted."
            privacy="SMS is prepared only when you trigger SOS. We never message contacts in the background or for marketing."
            status={sms}
            loading={loadingKey === "sms"}
            onAllow={allowSms}
          />
        </View>

        <Text style={[styles.footnote, { color: c.textTertiary }]}>
          You can change any of these later in your device Settings. Required
          items unlock core protection; Recommended just makes it smoother.
        </Text>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, spacing.md),
            backgroundColor: c.background,
            borderTopColor: c.border,
          },
        ]}
      >
        {!requiredReady ? (
          <Text style={[styles.footerHint, { color: c.textSecondary }]}>
            Allow Location and Emergency SMS to continue
          </Text>
        ) : notifications !== "granted" ? (
          <Text style={[styles.footerHintOptional, { color: c.textSecondary }]}>
            You can continue—notifications can wait
          </Text>
        ) : (
          <Text style={[styles.footerHintReady, { color: c.success }]}>
            You’re set. Let’s go.
          </Text>
        )}
        <PrimaryButton
          label="Continue"
          onPress={onContinue}
          disabled={!requiredReady}
          accessibilityHint={
            requiredReady
              ? "Enter SafeRoute"
              : "Allow required permissions first"
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  wordmark: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.size.title,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.size.headline,
    lineHeight: typography.lineHeight.headline,
    letterSpacing: -0.3,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.bodyLarge,
    lineHeight: typography.lineHeight.bodyLarge,
    marginBottom: spacing.lg,
  },
  cards: {
    gap: spacing.md,
  },
  footnote: {
    marginTop: spacing.lg,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.caption,
    lineHeight: typography.lineHeight.caption + 2,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  footerHint: {
    textAlign: "center",
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.size.caption,
  },
  footerHintOptional: {
    textAlign: "center",
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.size.caption,
  },
  footerHintReady: {
    textAlign: "center",
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.size.caption,
  },
});
