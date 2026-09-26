<<<<<<< HEAD
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts as useExpoFonts } from 'expo-font';
import React, { useEffect, useState } from 'react';
import {
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    useColorScheme,
    View
} from 'react-native';

function useFonts(fontMap: { [key: string]: any }): [boolean] {
    const [loaded] = useExpoFonts(fontMap);
    return [loaded];
}

export default function Account() {
  const systemTheme = useColorScheme() ?? 'light';
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [activeTheme, setActiveTheme] = useState(systemTheme);
  const [overlayContent, setOverlayContent] = useState<string | null>(null);
  const [fontsLoaded] = useFonts({
        'Lufga': require('../../assets/fonts/LufgaRegular.ttf'), 
        'Magesta': require('../../assets/fonts/Magesta.ttf'),
    });

  useEffect(() => {
    if (selectedTheme === 'system') {
      setActiveTheme(systemTheme);
    } else {
      setActiveTheme(selectedTheme);
    }
  }, [selectedTheme, systemTheme]);

  const showOverlay = (content: string) => setOverlayContent(content);
  const hideOverlay = () => setOverlayContent(null);

  const currentColors = activeTheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={[{ paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 }]}>
        <ScrollView>
          <Header theme={currentColors} />
          <ThemedView style={styles.content}>
            <About theme={currentColors} />
            <SectionButton
              icon="information-circle-outline"
              text="About Us"
              onPress={() => showOverlay('About Us')}
              theme={currentColors}
            />
            <SectionButton
              icon="document-text-outline"
              text="License"
              onPress={() => showOverlay('License')}
              theme={currentColors}
            />
            <SectionButton
              icon="shield-checkmark-outline"
              text="Terms of Service"
              onPress={() => showOverlay('Terms of Service')}
              theme={currentColors}
            />
          </ThemedView>
        </ScrollView>

        <Modal
          animationType="fade"
          transparent={true}
          visible={overlayContent !== null}
          onRequestClose={hideOverlay}
        >
          <View style={styles.overlayContainer}>
            <View
              style={[
                styles.overlayContent,
                { backgroundColor: currentColors.background, borderColor: currentColors.text },
              ]}
            >
              <Ionicons
                name="close-circle-outline"
                size={36}
                color={currentColors.text}
                onPress={hideOverlay}
                style={styles.closeIcon}
              />
              <ThemedText style={[styles.overlayTitle, { color: currentColors.text }]}>
                {overlayContent}
              </ThemedText>
              <ScrollView style={{ marginVertical: 10 }}>
                {overlayContent === 'About Us' && (
                  <ThemedText style={[styles.overlayText, { color: currentColors.text }]}>
                    Welcome to SafeRoute, Navigate confidently with Vote based optimized paths, emergency contacts, and 
                        secure route planning designed for women's safety.
                    {'\n\n'}
                    <ThemedText style={{ fontWeight: 'bold', fontSize: 18 }}>Team:</ThemedText>
                    {'\n'}
                    Swastik, Avanesh, Yash.
                  </ThemedText>
                )}
                {overlayContent === 'License' && (
                  <ThemedText style={[styles.overlayText, { color: currentColors.text }]}>
                    Licensed under GNU GPL.
                    GNU GPL
                    for details.
                  </ThemedText>
                )}
                {overlayContent === 'Terms of Service' && (
                  <ThemedText style={[styles.overlayText, { color: currentColors.text }]}>
                    I dont know what to write here. Please dont sue me.😊
                  </ThemedText>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

function Header({ theme }: { theme: any }) {
  return (
    <ThemedView style={[styles.header, { backgroundColor: theme.primary }]}>
      <Text style={[styles.headerTitle, { color: theme.text }]}>SafeRoute</Text>
    </ThemedView>
  );
}

function ThemeSelector({ selectedTheme, setSelectedTheme, theme }: any) {
  return (
    <View style={styles.themeSection}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Theme Settings</Text>
      <View style={styles.themeButtonContainer}>
        <ThemeButton title="Dark" selected={selectedTheme === 'dark'} onPress={() => setSelectedTheme('dark')} theme={theme} />
        <ThemeButton title="Light" selected={selectedTheme === 'light'} onPress={() => setSelectedTheme('light')} theme={theme} />
        <ThemeButton title="System" selected={selectedTheme === 'system'} onPress={() => setSelectedTheme('system')} theme={theme} />
=======
import { PrimaryButton, UserAvatar } from "@/components/design-system";
import { auth } from "@/config/firebase";
import {
  PRIVACY_ANON_KEY,
  PRIVACY_SHARE_KEY,
  SILENT_SOS_KEY,
} from "@/constants/preferences";
import {
  radius,
  spacing,
  tabContentBottomInset,
  typography,
} from "@/constants/theme";
import {
  reportWeightForLevel,
  type TrustLevel,
} from "@/core/trust";
import { useAppearance, type AppearanceMode } from "@/hooks/useAppearance";
import { useAppTheme } from "@/hooks/useAppTheme";
import { useAuth } from "@/hooks/useAuth";
import { useProductTour } from "@/hooks/useProductTour";
import { unregisterCurrentPushToken } from "@/services/notifications";
import {
  loadProfileStats,
  type ProfileAchievement,
  type ProfileStats,
} from "@/services/profileStats";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { useFocusEffect, useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LEVEL_LABEL: Record<TrustLevel, string> = {
  untrusted: "Untrusted",
  low: "Low",
  standard: "Standard",
  trusted: "Trusted",
  guardian: "Guardian",
};

const LEVEL_NEXT: Record<TrustLevel, { label: string; at: number } | null> = {
  untrusted: { label: "Low", at: 21 },
  low: { label: "Standard", at: 41 },
  standard: { label: "Trusted", at: 61 },
  trusted: { label: "Guardian", at: 81 },
  guardian: null,
};

function TrustRing({ score }: { score: number }) {
  const { colors: c } = useAppTheme();
  const clamped = Math.min(100, Math.max(0, score));
  return (
    <View style={styles.ringWrap} accessibilityLabel={`Trust score ${score}`}>
      <View
        style={[
          styles.ringOuter,
          { borderColor: c.primary, backgroundColor: c.surface },
        ]}
      >
        <View style={styles.ringInner}>
          <Text style={[styles.ringScore, { color: c.textPrimary }]}>
            {clamped}
          </Text>
          <Text style={[styles.ringCaption, { color: c.textSecondary }]}>
            Trust
          </Text>
        </View>
      </View>
      <View style={[styles.ringBarTrack, { backgroundColor: c.surface }]}>
        <View
          style={[
            styles.ringBarFill,
            { width: `${clamped}%`, backgroundColor: c.primary },
          ]}
        />
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
      </View>
    </View>
  );
}

<<<<<<< HEAD
function ThemeButton({ title, selected, onPress, theme }: any) {
  return (
    <Pressable
      style={[
        styles.themeButton,
        {
          backgroundColor: selected ? theme.primary : theme.background,
          borderColor: theme.text,
        },
      ]}
      onPress={onPress}
    >
      <Text style={{ color: selected ? theme.background : theme.text }}>{title}</Text>
    </Pressable>
  );
}

function SectionButton({ icon, text, onPress, theme }: any) {
  return (
    <Pressable
      style={[styles.sectionButton, { backgroundColor: theme.primary, borderColor: theme.text }]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={24} color={theme.text} />
      <Text style={[styles.sectionButtonText, { color: theme.text }]}>{text}</Text>
    </Pressable>
  );
}

function About({ theme }: { theme: any }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>App Info</Text>
=======
function SettingRow({
  title,
  subtitle,
  onPress,
  trailing,
  last = false,
}: {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  last?: boolean;
}) {
  const { colors: c } = useAppTheme();
  const content = (
    <View
      style={[
        styles.settingRow,
        { borderBottomColor: c.divider },
        last && styles.settingRowLast,
      ]}
    >
      <View style={styles.settingText}>
        <Text style={[styles.settingTitle, { color: c.textPrimary }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.settingSub, { color: c.textSecondary }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ?? (
        <MaterialIcons name="chevron-right" size={22} color={c.textTertiary} />
      )}
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => pressed && styles.settingPressed}
    >
      {content}
    </Pressable>
  );
}

const APPEARANCE_OPTIONS: { id: AppearanceMode; label: string }[] = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { mode, setMode, scheme } = useAppearance();
  const { colors: c, elevation: elev } = useAppTheme();
  const { requestReplay } = useProductTour();
  const { user, ready } = useAuth();
  const [silentSos, setSilentSos] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [anonLocation, setAnonLocation] = useState(true);
  const [shareGuardians, setShareGuardians] = useState(true);
  const [stats, setStats] = useState<ProfileStats | null>(() => {
    const u = auth.currentUser;
    if (!u) return null;
    return {
      displayName: u.displayName || u.email?.split("@")[0] || "SafeRoute user",
      phone: u.phoneNumber || u.email || "Add phone in account",
      email: u.email ?? "",
      trust: {
        score: 50,
        level: "standard",
        reportWeight: reportWeightForLevel("standard"),
      },
      safeTripsCompleted: 0,
      reportsContributed: 0,
      verifiedReports: 0,
      accurateReports: 0,
      participationWeeks: 0,
      achievements: [],
    };
  });
  const [statsLoading, setStatsLoading] = useState(false);

  const refreshStats = useCallback(async () => {
    if (!auth.currentUser) {
      setStats(null);
      setStatsLoading(false);
      return;
    }
    // Keep current/default trust visible; only mark loading for subtle refresh.
    setStatsLoading(true);
    try {
      const next = await loadProfileStats();
      if (next) setStats(next);
    } catch (error) {
      console.warn("Profile stats failed:", error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshStats();
    }, [refreshStats]),
  );

  useEffect(() => {
    void (async () => {
      const [silent, anon, share] = await AsyncStorage.multiGet([
        SILENT_SOS_KEY,
        PRIVACY_ANON_KEY,
        PRIVACY_SHARE_KEY,
      ]);
      setSilentSos(silent[1] === "true");
      setAnonLocation(anon[1] !== "false");
      setShareGuardians(share[1] !== "false");
    })();
  }, []);

  const displayName =
    stats?.displayName ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "SafeRoute user";
  const phone =
    stats?.phone || user?.phoneNumber || user?.email || "Add phone in account";

  const trustScore = stats?.trust.score ?? 50;
  const level: TrustLevel = stats?.trust.level ?? "standard";
  const levelLabel = LEVEL_LABEL[level];
  const next = LEVEL_NEXT[level];
  const ptsToNext = next ? Math.max(0, next.at - trustScore) : 0;
  const weight = reportWeightForLevel(level);
  const achievements: ProfileAchievement[] = stats?.achievements ?? [];
  const safeTrips = stats?.safeTripsCompleted ?? 0;
  const reportsCount = stats?.reportsContributed ?? 0;

  const onSilentChange = (value: boolean) => {
    setSilentSos(value);
    void AsyncStorage.setItem(SILENT_SOS_KEY, value ? "true" : "false");
  };

  const onAnonChange = (value: boolean) => {
    setAnonLocation(value);
    void AsyncStorage.setItem(PRIVACY_ANON_KEY, value ? "true" : "false");
  };

  const onShareChange = (value: boolean) => {
    setShareGuardians(value);
    void AsyncStorage.setItem(PRIVACY_SHARE_KEY, value ? "true" : "false");
  };

  const replayTour = () => {
    // Land on Home first so anchors exist, then start from the root overlay
    router.navigate("/(tabs)/Home" as never);
    requestReplay();
  };

  const openAbout = () => {
    const version =
      Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? "2.0.0";
    Alert.alert(
      "SafeRoute",
      `Version ${version}\nNavigate with confidence.\n\nTheme: ${mode} (${scheme})`,
      [
        {
          text: "Privacy",
          onPress: () => void Linking.openURL("https://saferoute.app/privacy"),
        },
        {
          text: "Terms",
          onPress: () => void Linking.openURL("https://saferoute.app/terms"),
        },
        { text: "OK", style: "cancel" },
      ],
    );
  };

  const onSignOut = () => {
    Alert.alert("Sign out", "You’ll need to log in again to use SafeRoute.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          try {
            await unregisterCurrentPushToken();
            await signOut(auth);
          } catch {
            // continue to login
          }
          router.replace("/Login");
        },
      },
    ]);
  };

  if (ready && !user) {
    return (
      <View
        style={[
          styles.root,
          {
            paddingTop: Math.max(insets.top, spacing.md),
            backgroundColor: c.background,
            justifyContent: "center",
            paddingHorizontal: spacing.lg,
          },
        ]}
      >
        <Text style={[styles.name, { color: c.textPrimary, marginBottom: spacing.md }]}>
          Sign in to view your profile
        </Text>
        <PrimaryButton label="Log in" onPress={() => router.replace("/Login")} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: Math.max(insets.top, spacing.md),
          backgroundColor: c.background,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: tabContentBottomInset(insets.bottom) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.headerCard,
            { backgroundColor: c.primaryContainer, ...elev.card },
          ]}
        >
          <UserAvatar name={displayName} size={72} />
          <View style={styles.headerMeta}>
            <Text style={[styles.screenKicker, { color: c.primary }]}>
              Profile
            </Text>
            <Text
              style={[styles.name, { color: c.textPrimary }]}
              accessibilityRole="header"
            >
              {displayName}
            </Text>
            <Text style={[styles.phone, { color: c.textSecondary }]}>
              {phone}
            </Text>
            <View
              style={[
                styles.levelPill,
                { backgroundColor: c.successContainer },
              ]}
            >
              <Text style={[styles.levelPillText, { color: c.successText }]}>
                {levelLabel}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.trustCard,
            {
              backgroundColor: c.surfaceVariant,
              borderColor: c.border,
            },
          ]}
        >
          <TrustRing score={trustScore} />
          <View style={styles.trustMeta}>
            <View style={styles.trustMetaRow}>
              <Text style={[styles.trustMetaTitle, { color: c.textPrimary }]}>
                Guardian level
              </Text>
              <Text style={[styles.trustMetaHint, { color: c.textSecondary }]}>
                {statsLoading
                  ? "Updating…"
                  : next
                    ? `${ptsToNext} pts to ${next.label}`
                    : "Top level"}
              </Text>
            </View>
            <View
              style={[styles.progressTrack, { backgroundColor: c.surface }]}
            >
              <View
                style={[
                  styles.progressFill,
                  { width: `${trustScore}%`, backgroundColor: c.primary },
                ]}
              />
            </View>
            <Text style={[styles.weightCaption, { color: c.textTertiary }]}>
              Report weight {weight.toFixed(weight % 1 ? 2 : 1)}× · accurate
              reports raise score faster
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: c.surface, borderColor: c.border },
            ]}
          >
            <Text style={[styles.statValue, { color: c.textPrimary }]}>
              {safeTrips}
            </Text>
            <Text style={[styles.statLabel, { color: c.textSecondary }]}>
              Safe trips completed
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: c.surface, borderColor: c.border },
            ]}
          >
            <Text style={[styles.statValue, { color: c.textPrimary }]}>
              {reportsCount}
            </Text>
            <Text style={[styles.statLabel, { color: c.textSecondary }]}>
              Reports contributed
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>
            Achievements
          </Text>
          <Text style={[styles.sectionHint, { color: c.textTertiary }]}>
            {achievements.filter((a) => a.state === "earned").length} earned
          </Text>
        </View>
        <View style={styles.achievementGrid}>
          {achievements.map((a) => (
            <View
              key={a.id}
              style={[
                styles.achievementTile,
                {
                  backgroundColor: c.surface,
                  borderColor: c.border,
                },
                a.state === "earned" && {
                  borderColor: c.primary,
                  backgroundColor: c.primaryContainer,
                },
                a.state === "locked" && styles.achievementLocked,
              ]}
            >
              <View style={styles.achievementTop}>
                <Text
                  style={[styles.achievementTitle, { color: c.textPrimary }]}
                >
                  {a.title}
                </Text>
                <Text
                  style={[
                    styles.achievementState,
                    { color: c.textTertiary },
                    a.state === "earned" && { color: c.success },
                    a.state === "progress" && { color: c.primary },
                  ]}
                >
                  {a.state === "earned"
                    ? "Earned"
                    : a.state === "progress"
                      ? "In progress"
                      : "Locked"}
                </Text>
              </View>
              <Text
                style={[styles.achievementHint, { color: c.textSecondary }]}
              >
                {a.hint}
              </Text>
            </View>
          ))}
        </View>

        <Text style={[styles.groupLabel, { color: c.textTertiary }]}>
          Appearance
        </Text>
        <View
          style={[
            styles.groupCard,
            {
              backgroundColor: c.surface,
              borderColor: c.border,
              ...elev.card,
            },
          ]}
        >
          <Text style={[styles.groupTitle, { color: c.textPrimary }]}>
            Theme
          </Text>
          <Text style={[styles.groupSub, { color: c.textSecondary }]}>
            Light, dark, or match the device · active {scheme}
          </Text>
          <View style={styles.appearanceRow}>
            {APPEARANCE_OPTIONS.map((option) => {
              const selected = mode === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setMode(option.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[
                    styles.appearanceChip,
                    { backgroundColor: c.surfaceVariant },
                    selected && { backgroundColor: c.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.appearanceLabel,
                      { color: c.textSecondary },
                      selected && {
                        fontFamily: typography.fontFamily.semibold,
                        color: c.textOnPrimary,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={[styles.groupLabel, { color: c.textTertiary }]}>
          Safety
        </Text>
        <View
          style={[
            styles.groupCard,
            {
              backgroundColor: c.surface,
              borderColor: c.border,
              ...elev.card,
            },
          ]}
        >
          <SettingRow
            title="Silent SOS"
            subtitle="Alert guardians without a siren by default"
            trailing={
              <Switch
                value={silentSos}
                onValueChange={onSilentChange}
                trackColor={{ false: c.border, true: c.dangerContainer }}
                thumbColor={silentSos ? c.danger : c.surfaceElevated}
                accessibilityLabel="Silent SOS preference"
              />
            }
          />
          <SettingRow
            title="Guardians"
            subtitle="People who follow your walks"
            onPress={() => router.push("/contacts")}
          />
          <SettingRow
            title="Notifications"
            onPress={() => router.push("/(tabs)/alerts" as never)}
          />
          <SettingRow
            title="Open SOS"
            subtitle="Hold to activate emergency"
            last
            onPress={() => router.push("/(tabs)/SOS" as never)}
          />
        </View>

        <Text style={[styles.groupLabel, { color: c.textTertiary }]}>Help</Text>
        <View
          style={[
            styles.groupCard,
            {
              backgroundColor: c.surface,
              borderColor: c.border,
              ...elev.card,
            },
          ]}
        >
          <SettingRow
            title="Replay product tour"
            subtitle="Spotlight tips for Search, Safe Walk, Map, SOS"
            onPress={replayTour}
          />
          <SettingRow
            title="Privacy"
            subtitle="Location sharing and guardian visibility"
            onPress={() => setPrivacyOpen(true)}
          />
          <SettingRow
            title="About, license, and terms"
            last
            onPress={openAbout}
          />
        </View>

        <Text style={[styles.groupLabel, { color: c.textTertiary }]}>
          Account
        </Text>
        <View
          style={[
            styles.groupCard,
            {
              backgroundColor: c.surface,
              borderColor: c.border,
              ...elev.card,
            },
          ]}
        >
          <SettingRow
            title="Sign out"
            subtitle={user?.email ?? "End this session"}
            last
            onPress={onSignOut}
          />
        </View>

        <PrimaryButton
          label="Report an area"
          onPress={() => router.push("/CommunityReport" as never)}
          style={{ marginTop: spacing.lg }}
        />
      </ScrollView>

      <Modal
        visible={privacyOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPrivacyOpen(false)}
      >
        <Pressable
          style={[styles.modalScrim, { backgroundColor: c.scrim }]}
          onPress={() => setPrivacyOpen(false)}
        >
          <Pressable
            style={[
              styles.modalSheet,
              {
                backgroundColor: c.surfaceElevated,
                ...elev.sheet,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: c.textPrimary }]}>
              Privacy
            </Text>
            <Text style={[styles.modalBody, { color: c.textSecondary }]}>
              Control how SafeRoute uses your location during walks and SOS.
            </Text>
            <SettingRow
              title="Anonymous by default"
              subtitle="Strip precise identifiers from community reports"
              trailing={
                <Switch
                  value={anonLocation}
                  onValueChange={onAnonChange}
                  trackColor={{
                    false: c.border,
                    true: c.primaryContainer,
                  }}
                  thumbColor={anonLocation ? c.primary : c.surfaceElevated}
                />
              }
            />
            <SettingRow
              title="Share live trips with guardians"
              subtitle="They only see you while Safe Walk is active"
              last
              trailing={
                <Switch
                  value={shareGuardians}
                  onValueChange={onShareChange}
                  trackColor={{
                    false: c.border,
                    true: c.primaryContainer,
                  }}
                  thumbColor={shareGuardians ? c.primary : c.surfaceElevated}
                />
              }
            />
            <PrimaryButton
              label="Done"
              onPress={() => setPrivacyOpen(false)}
              style={{ marginTop: spacing.md }}
            />
          </Pressable>
        </Pressable>
      </Modal>
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    </View>
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
    container: { flex: 1 },
    header: { padding: 20, alignItems: 'center' },
    headerTitle: { fontFamily: 'Lufga', fontSize: 24, fontWeight: 'bold', margin: 30, marginTop: 70 },
    content: { padding: 20 },
    themeSection: { marginBottom: 20 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    themeButtonContainer: { flexDirection: 'row', justifyContent: 'space-between' },
    themeButton: { padding: 10, borderWidth: 1, borderRadius: 5, flex: 1, margin: 5 },
    sectionButton: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderRadius: 10, marginBottom: 10 },
    sectionButtonText: { marginLeft: 10, fontSize: 16 },
    overlayContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(244, 97, 234, 0.5)' },
    overlayContent: { width: '90%', padding: 20, borderRadius: 10, alignItems: 'center', elevation: 5 },
    overlayTitle: { fontSize: 20, fontWeight: 'bold' },
    overlayText: { fontSize: 16, lineHeight: 22, textAlign: 'center' },
    closeIcon: { position: 'absolute', top: 10, right: 10 },
    logo: {
        width: 200,
        height: 150,
        marginBottom: 16,
    },
});

=======
  root: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  screenKicker: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.size.caption,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  headerMeta: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.size.title,
  },
  phone: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.body,
  },
  levelPill: {
    alignSelf: "flex-start",
    marginTop: 4,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  levelPillText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.size.caption,
  },
  trustCard: {
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    gap: spacing.md,
  },
  ringWrap: {
    alignSelf: "center",
    alignItems: "center",
    gap: spacing.sm,
    width: "100%",
  },
  ringOuter: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  ringInner: {
    alignItems: "center",
  },
  ringBarTrack: {
    width: "100%",
    height: 6,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  ringBarFill: {
    height: "100%",
  },
  ringScore: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.size.display,
  },
  ringCaption: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.size.caption,
  },
  trustMeta: {
    gap: spacing.sm,
  },
  trustMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  trustMetaTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.size.bodyLarge,
  },
  trustMetaHint: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.caption,
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.pill,
  },
  weightCaption: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.caption,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    gap: 4,
  },
  statValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.size.headline,
  },
  statLabel: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.caption,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.size.title,
  },
  sectionHint: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.caption,
  },
  achievementGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  achievementTile: {
    width: "48%",
    flexGrow: 1,
    minWidth: "46%",
    borderRadius: radius.md,
    padding: spacing.sm + 4,
    borderWidth: 1,
    gap: 6,
    minHeight: 88,
  },
  achievementEarned: {},
  achievementLocked: {
    opacity: 0.55,
  },
  achievementTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 4,
  },
  achievementTitle: {
    flex: 1,
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.size.caption,
  },
  achievementState: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 10,
  },
  achievementHint: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.caption,
  },
  groupLabel: {
    marginTop: spacing.md,
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.size.caption,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  groupCard: {
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  groupTitle: {
    marginTop: spacing.md,
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.size.body,
  },
  groupSub: {
    marginTop: 2,
    marginBottom: spacing.sm,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.caption,
  },
  appearanceRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  appearanceChip: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  appearanceChipOn: {},
  appearanceLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.size.body,
  },
  appearanceLabelOn: {
    fontFamily: typography.fontFamily.semibold,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  settingRowLast: {
    borderBottomWidth: 0,
  },
  settingPressed: {
    opacity: 0.7,
  },
  settingText: {
    flex: 1,
    gap: 2,
  },
  settingTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.size.bodyLarge,
  },
  settingSub: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.caption,
  },
  modalScrim: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  modalTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.size.title,
  },
  modalBody: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.body,
    lineHeight: typography.lineHeight.body,
  },
});
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
