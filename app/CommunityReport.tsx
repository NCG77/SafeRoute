import { PrimaryButton, SecondaryButton } from "@/components/design-system";
import { AreaPlaceSearch } from "@/components/maps/AreaPlaceSearch";
import { radius, spacing, touch, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { submitCommunityReport } from "@/services/communityIntelligence";

type Step = 1 | 2 | 3;

type ReportPlace = {
  coordinate: { latitude: number; longitude: number };
  title: string;
  subtitle: string;
};

const CATEGORIES = [
  {
    id: "lighting",
    label: "Lighting",
    hint: "Dark streets, broken lamps",
    icon: "lightbulb-outline" as const,
  },
  {
    id: "harassment",
    label: "Harassment",
    hint: "Verbal or physical",
    icon: "report" as const,
  },
  {
    id: "crime",
    label: "Crime",
    hint: "Theft, assault, threat",
    icon: "gavel" as const,
  },
  {
    id: "road",
    label: "Road issue",
    hint: "Hazard, blocked path",
    icon: "add-road" as const,
  },
  {
    id: "medical",
    label: "Medical",
    hint: "Injury risk, aid needed",
    icon: "medical-services" as const,
  },
];

const SEVERITY_LABELS = ["", "Low", "Mild", "Moderate", "High", "Critical"];

export default function CommunityReportScreen() {
  const { colors: c, elevation: elev } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [category, setCategory] = useState<string | null>(null);
  const [severity, setSeverity] = useState(3);
  const [description, setDescription] = useState("");
  const [anonymous, setAnonymous] = useState(true);
  const [photoAttached, setPhotoAttached] = useState(false);
  const [voiceAttached, setVoiceAttached] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [place, setPlace] = useState<ReportPlace | null>(null);
  const [placeLoading, setPlaceLoading] = useState(true);

  const categoryLabel =
    CATEGORIES.find((item) => item.id === category)?.label ?? "Report";

  const applyCurrentLocation = useCallback(async () => {
    setPlaceLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setPlace(null);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coord = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      let title = "Your current location";
      let subtitle = `${coord.latitude.toFixed(5)}, ${coord.longitude.toFixed(5)} · ~150 m radius`;
      try {
        const geo = await Location.reverseGeocodeAsync(coord);
        const p = geo?.[0];
        if (p) {
          title =
            p.name ||
            p.street ||
            p.district ||
            p.city ||
            "Your current location";
          const bits = [p.street, p.district, p.city || p.subregion].filter(
            Boolean,
          );
          subtitle = `${[...new Set(bits.map(String))].join(", ") || "Nearby area"} · ~150 m around you`;
        }
      } catch {
        // keep coords subtitle
      }
      setPlace({ coordinate: coord, title, subtitle });
    } catch {
      setPlace(null);
    } finally {
      setPlaceLoading(false);
    }
  }, []);

  useEffect(() => {
    void applyCurrentLocation();
  }, [applyCurrentLocation]);

  const submit = async () => {
    if (!place || !category) return;
    setSubmitting(true);
    try {
      const result = await submitCommunityReport({
        latitude: place.coordinate.latitude,
        longitude: place.coordinate.longitude,
        category,
        severity,
        note: description,
        anonymous,
        photoPath: photoAttached ? "local://pending-photo" : null,
        voicePath: voiceAttached ? "local://pending-voice" : null,
      });
      if (!result.ok) {
        if (result.needsAuth) {
          Alert.alert(
            "Sign in required",
            result.error,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Sign in",
                onPress: () => router.push("/Login"),
              },
            ],
          );
        } else {
          Alert.alert("Could not submit", result.error);
        }
        return;
      }
      setStep(3);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: Math.max(insets.top, spacing.md),
          paddingBottom: Math.max(insets.bottom, spacing.lg),
          backgroundColor: c.background,
        },
      ]}
    >
      <View style={styles.topBar}>
        <Pressable
          onPress={() => {
            if (step === 1) router.back();
            else if (step === 3) router.back();
            else setStep((s) => (s === 2 ? 1 : s));
          }}
          accessibilityRole="button"
          accessibilityLabel={step === 1 || step === 3 ? "Close" : "Back"}
          hitSlop={8}
        >
          <MaterialIcons
            name={step === 1 || step === 3 ? "close" : "arrow-back"}
            size={24}
            color={c.textPrimary}
          />
        </Pressable>
        <Text style={[styles.topLabel, { color: c.textTertiary }]}>
          {step === 3 ? "Community Report" : `Step ${step} of 3`}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.dots}>
        {([1, 2, 3] as Step[]).map((n) => (
          <View
            key={n}
            style={[
              styles.dot,
              { backgroundColor: c.border },
              n <= step && { backgroundColor: c.primaryContainer },
              n === step && { backgroundColor: c.primary, width: 22 },
            ]}
          />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 ? (
          <>
            <Text style={[styles.title, { color: c.textPrimary }]}>
              What’s happening?
            </Text>
            <Text style={[styles.subtitle, { color: c.textSecondary }]}>
              Confirm the area first, then choose a category.
            </Text>

            <View
              style={[
                styles.areaCard,
                {
                  backgroundColor: c.primaryContainer,
                  borderColor: c.border,
                  ...elev.card,
                },
              ]}
              accessibilityRole="summary"
              accessibilityLabel={`Reporting ${place?.title || "location"}`}
            >
              <View style={[styles.areaIcon, { backgroundColor: c.primary }]}>
                {placeLoading ? (
                  <ActivityIndicator color={c.textOnPrimary} />
                ) : (
                  <MaterialIcons
                    name="place"
                    size={22}
                    color={c.textOnPrimary}
                  />
                )}
              </View>
              <View style={styles.areaCopy}>
                <Text style={[styles.areaKicker, { color: c.primary }]}>
                  Reporting this area
                </Text>
                <Text
                  style={[styles.areaTitle, { color: c.textPrimary }]}
                  numberOfLines={2}
                >
                  {placeLoading
                    ? "Finding your location…"
                    : place?.title || "Choose an area below"}
                </Text>
                <Text
                  style={[styles.areaSub, { color: c.textSecondary }]}
                  numberOfLines={2}
                >
                  {place?.subtitle ||
                    "Search for a place, or use your current location."}
                </Text>
              </View>
            </View>

            <Text style={[styles.fieldLabel, { color: c.textPrimary }]}>
              Change area
            </Text>
            <AreaPlaceSearch
              biasCoordinate={place?.coordinate}
              onSelectPlace={(selected) => {
                setPlace({
                  coordinate: selected.coordinate,
                  title: selected.title,
                  subtitle: `${selected.subtitle} · ~150 m around pin`,
                });
              }}
              onUseCurrentLocation={() => {
                void applyCurrentLocation();
              }}
            />

            <Text
              style={[
                styles.fieldLabel,
                { color: c.textPrimary, marginTop: spacing.sm },
              ]}
            >
              Category
            </Text>
            <View style={styles.categoryList}>
              {CATEGORIES.map((item) => {
                const selected = category === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setCategory(item.id)}
                    style={[
                      styles.categoryTile,
                      {
                        borderColor: c.border,
                        backgroundColor: c.surface,
                      },
                      selected && {
                        borderColor: c.primary,
                        backgroundColor: c.primaryContainer,
                      },
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <MaterialIcons
                      name={item.icon}
                      size={22}
                      color={selected ? c.primary : c.textSecondary}
                    />
                    <View style={styles.categoryText}>
                      <Text
                        style={[styles.categoryLabel, { color: c.textPrimary }]}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={[
                          styles.categoryHint,
                          { color: c.textSecondary },
                        ]}
                      >
                        {item.hint}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <PrimaryButton
              label="Continue"
              disabled={!category || !place}
              onPress={() => setStep(2)}
            />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <Text style={[styles.title, { color: c.textPrimary }]}>
              Add details
            </Text>
            <Text style={[styles.subtitle, { color: c.textSecondary }]}>
              {categoryLabel} · {place?.title || "selected area"}
            </Text>

            <View
              style={[
                styles.areaCardCompact,
                {
                  backgroundColor: c.surfaceVariant,
                  borderColor: c.border,
                },
              ]}
            >
              <MaterialIcons name="place" size={18} color={c.primary} />
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.areaTitleSm, { color: c.textPrimary }]}
                  numberOfLines={1}
                >
                  {place?.title}
                </Text>
                <Text
                  style={[styles.areaSub, { color: c.textSecondary }]}
                  numberOfLines={1}
                >
                  {place?.subtitle}
                </Text>
              </View>
            </View>

            <Text style={[styles.fieldLabel, { color: c.textPrimary }]}>
              Severity · {severity} · {SEVERITY_LABELS[severity]}
            </Text>
            <View style={styles.severityRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setSeverity(n)}
                  style={[
                    styles.severityChip,
                    {
                      borderColor: c.border,
                      backgroundColor: c.surface,
                    },
                    severity === n && {
                      backgroundColor: c.primary,
                      borderColor: c.primary,
                    },
                    n >= 4 && severity === n && { backgroundColor: c.danger },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Severity ${n} ${SEVERITY_LABELS[n]}`}
                >
                  <Text
                    style={[
                      styles.severityChipText,
                      { color: c.textPrimary },
                      severity === n && { color: c.textOnPrimary },
                    ]}
                  >
                    {n}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: c.textPrimary }]}>
              Description
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: c.border,
                  backgroundColor: c.surface,
                  color: c.textPrimary,
                },
              ]}
              placeholder="Optional · helps verification"
              placeholderTextColor={c.textTertiary}
              multiline
              maxLength={280}
              value={description}
              onChangeText={setDescription}
            />

            <Pressable
              style={[
                styles.mediaSlot,
                { borderColor: c.border, backgroundColor: c.surfaceVariant },
              ]}
              onPress={() => setPhotoAttached((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel="Attach photo"
            >
              <MaterialIcons
                name={photoAttached ? "check-circle" : "photo-camera"}
                size={22}
                color={photoAttached ? c.success : c.textSecondary}
              />
              <Text style={[styles.mediaText, { color: c.textSecondary }]}>
                {photoAttached ? "Photo attached" : "Photo (optional)"}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.mediaSlot,
                { borderColor: c.border, backgroundColor: c.surfaceVariant },
              ]}
              onPress={() => setVoiceAttached((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel="Attach voice note"
            >
              <MaterialIcons
                name={voiceAttached ? "check-circle" : "mic-none"}
                size={22}
                color={voiceAttached ? c.success : c.textSecondary}
              />
              <Text style={[styles.mediaText, { color: c.textSecondary }]}>
                {voiceAttached ? "Voice note ready" : "Voice note (optional)"}
              </Text>
            </Pressable>

            <View style={styles.anonRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: c.textPrimary }]}>
                  Report anonymously
                </Text>
                <Text style={[styles.categoryHint, { color: c.textSecondary }]}>
                  Hides your name from the public feed
                </Text>
              </View>
              <Switch
                value={anonymous}
                onValueChange={setAnonymous}
                trackColor={{ false: c.border, true: c.primaryContainer }}
                thumbColor={anonymous ? c.primary : c.surface}
              />
            </View>

            <PrimaryButton
              label="Submit report"
              loading={submitting}
              disabled={!place}
              onPress={submit}
            />
          </>
        ) : null}

        {step === 3 ? (
          <>
            <View
              style={[
                styles.successIcon,
                { borderColor: c.success, backgroundColor: c.successContainer },
              ]}
            >
              <MaterialIcons name="check" size={40} color={c.success} />
            </View>
            <Text
              style={[
                styles.title,
                { textAlign: "center", color: c.textPrimary },
              ]}
            >
              Thank you
            </Text>
            <Text
              style={[
                styles.subtitle,
                { textAlign: "center", color: c.textSecondary },
              ]}
            >
              Your report for {place?.title || "this area"} helps keep the next
              walker safer. Moderators may verify it shortly.
            </Text>
            <View
              style={[
                styles.trustEarn,
                {
                  backgroundColor: c.surfaceVariant,
                  borderColor: c.border,
                },
              ]}
            >
              <Text style={[styles.trustEarnLabel, { color: c.textSecondary }]}>
                Trust points earned
              </Text>
              <Text style={[styles.trustEarnValue, { color: c.textPrimary }]}>
                +4
              </Text>
              <Text style={[styles.categoryHint, { color: c.textSecondary }]}>
                Participation · pending verification bonus (+8 / +12 later)
              </Text>
            </View>
            <PrimaryButton label="Done" onPress={() => router.back()} />
            <SecondaryButton
              label="Report another issue"
              onPress={() => {
                setCategory(null);
                setSeverity(3);
                setDescription("");
                setPhotoAttached(false);
                setVoiceAttached(false);
                setStep(1);
                void applyCurrentLocation();
              }}
              style={{ marginTop: spacing.sm }}
            />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  topLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.size.caption,
    letterSpacing: 0.5,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginBottom: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {},
  dotCurrent: {
    width: 22,
  },
  scroll: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.size.headline,
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.body,
    marginBottom: spacing.sm,
  },
  areaCard: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  areaCardCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  areaIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  areaCopy: {
    flex: 1,
    gap: 2,
  },
  areaKicker: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  areaTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.size.bodyLarge,
  },
  areaTitleSm: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.size.body,
  },
  areaSub: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.caption,
    lineHeight: 17,
  },
  categoryList: {
    gap: spacing.sm,
  },
  categoryTile: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    minHeight: touch.minTarget + 16,
  },
  categorySelected: {},
  categoryText: {
    flex: 1,
    gap: 2,
  },
  categoryLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.size.bodyLarge,
  },
  categoryHint: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.caption,
  },
  fieldLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.size.body,
  },
  severityRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  severityChip: {
    flex: 1,
    minHeight: touch.minTarget,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  severityChipActive: {},
  severityChipText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.size.bodyLarge,
  },
  severityChipTextActive: {},
  input: {
    minHeight: 96,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    textAlignVertical: "top",
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.body,
  },
  mediaSlot: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: "dashed",
    minHeight: touch.minTarget,
  },
  mediaText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.size.body,
  },
  anonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginVertical: spacing.sm,
  },
  successIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  trustEarn: {
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    gap: 4,
    marginVertical: spacing.md,
  },
  trustEarnLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.size.caption,
  },
  trustEarnValue: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.size.display,
  },
});
