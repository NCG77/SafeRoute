import { auth, functions } from "@/config/firebase";
import { PrimaryButton, SecondaryButton } from "@/components/design-system";
import { spacing, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { httpsCallable } from "firebase/functions";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const PENDING_GUARDIAN_INVITE_KEY =
  "@SafeRoute:pendingGuardianInvite";

export default function GuardianInviteScreen() {
  const { colors: c } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ inviteId?: string; token?: string }>();
  const [accepting, setAccepting] = useState(false);
  const invalid = !params.inviteId || !params.token;

  const accept = async () => {
    if (invalid) return;
    if (!auth.currentUser) {
      await AsyncStorage.setItem(
        PENDING_GUARDIAN_INVITE_KEY,
        JSON.stringify({ inviteId: params.inviteId, token: params.token }),
      );
      Alert.alert("Sign in required", "Sign in to accept this guardian invite.");
      router.push("/Login");
      return;
    }
    setAccepting(true);
    try {
      await httpsCallable(functions, "acceptGuardianInvite")({
        inviteId: params.inviteId,
        inviteToken: params.token,
      });
      Alert.alert("Connected", "You will now receive this person's safety alerts.");
      router.replace("/(tabs)/Home");
    } catch (error) {
      Alert.alert("Could not accept invite", (error as Error).message);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: c.background,
          paddingTop: Math.max(insets.top, spacing.xl),
          paddingBottom: Math.max(insets.bottom, spacing.lg),
        },
      ]}
    >
      <View style={styles.body}>
        <Text style={[styles.title, { color: c.textPrimary }]}>Trusted Guardian invite</Text>
        <Text style={[styles.copy, { color: c.textSecondary }]}>
          {invalid
            ? "This invite link is incomplete or expired."
            : "Accept to receive Safe Walk, arrival, failed check-in, live location, and SOS alerts in SafeRoute."}
        </Text>
      </View>
      <PrimaryButton
        label="Accept invite"
        onPress={accept}
        loading={accepting}
        disabled={invalid}
      />
      <SecondaryButton label="Not now" onPress={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: spacing.lg, gap: spacing.md },
  body: { flex: 1, justifyContent: "center", gap: spacing.md },
  title: { fontFamily: typography.fontFamily.bold, fontSize: typography.size.headline },
  copy: { fontFamily: typography.fontFamily.regular, fontSize: typography.size.bodyLarge, lineHeight: typography.lineHeight.bodyLarge },
});
