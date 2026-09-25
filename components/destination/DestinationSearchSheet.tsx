import {
  DesignSearchBar,
  ModalBottomSheet,
  SafetyScoreChip,
  SecondaryButton,
} from "@/components/design-system";
import { radius, spacing, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import {
  loadPinnedPlace,
  loadRecentSearches,
  loadSavedPlaces,
  pushRecentSearch,
  savePinnedPlace,
  type DestinationCoordinate,
  type DestinationPlace,
} from "@/core/destinationSearch";
import {
  fetchPlaceAutocomplete,
  fetchPlaceDetails,
  fetchSuggestedSafeDestinations,
  type AutocompleteSuggestion,
} from "@/services/placesAutocomplete";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { requireOptionalNativeModule } from "expo";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

/** True only in a dev client / build that linked the native speech module. */
function hasSpeechRecognitionNative(): boolean {
  try {
    return requireOptionalNativeModule("ExpoSpeechRecognition") != null;
  } catch {
    return false;
  }
}

type DestinationSearchSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (place: DestinationPlace) => void;
  initialQuery?: string;
  /** CTA on the preview card (default: Go) */
  confirmLabel?: string;
};

function PlaceRow({
  icon,
  title,
  subtitle,
  trailing,
  onPress,
  onLongPress,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  const { colors: c } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: c.surfaceVariant },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: c.primaryContainer }]}>
        <MaterialIcons name={icon} size={20} color={c.primary} />
      </View>
      <View style={styles.rowText}>
        <Text
          style={[styles.rowTitle, { color: c.textPrimary }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[styles.rowSubtitle, { color: c.textSecondary }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
      <MaterialIcons name="chevron-right" size={20} color={c.textTertiary} />
    </Pressable>
  );
}

export function DestinationSearchSheet({
  visible,
  onClose,
  onSelect,
  initialQuery = "",
  confirmLabel = "Go",
}: DestinationSearchSheetProps) {
  const { colors: c, elevation: elev } = useAppTheme();
  const [query, setQuery] = useState(initialQuery);
  const [listening, setListening] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [loadingAuto, setLoadingAuto] = useState(false);
  const [origin, setOrigin] = useState<DestinationCoordinate | null>(null);
  const [preview, setPreview] = useState<DestinationPlace | null>(null);
  const [recents, setRecents] = useState<DestinationPlace[]>([]);
  const [saved, setSaved] = useState<DestinationPlace[]>([]);
  const [home, setHome] = useState<DestinationPlace | null>(null);
  const [work, setWork] = useState<DestinationPlace | null>(null);
  const [suggestions, setSuggestions] = useState<DestinationPlace[]>([]);
  const [autocomplete, setAutocomplete] = useState<AutocompleteSuggestion[]>(
    [],
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hydrate = useCallback(async () => {
    const [r, s, h, w] = await Promise.all([
      loadRecentSearches(),
      loadSavedPlaces(),
      loadPinnedPlace("home"),
      loadPinnedPlace("work"),
    ]);
    setRecents(r);
    setSaved(s);
    setHome(h);
    setWork(w);

    try {
      const perm = await Location.getForegroundPermissionsAsync();
      if (perm.status === Location.PermissionStatus.GRANTED) {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const coord = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setOrigin(coord);
        setLoadingSuggest(true);
        const safe = await fetchSuggestedSafeDestinations(coord);
        setSuggestions(safe);
        setLoadingSuggest(false);
      }
    } catch {
      setLoadingSuggest(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    setQuery(initialQuery);
    setPreview(null);
    setAutocomplete([]);
    void hydrate();
  }, [visible, initialQuery, hydrate]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setAutocomplete([]);
      setLoadingAuto(false);
      return;
    }
    setLoadingAuto(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const results = await fetchPlaceAutocomplete(query, origin);
        setAutocomplete(results);
      } catch (e) {
        console.warn("Autocomplete error", e);
        setAutocomplete([]);
      } finally {
        setLoadingAuto(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, origin]);

  const choose = async (place: DestinationPlace) => {
    setPreview(place);
    await pushRecentSearch(place);
    const next = await loadRecentSearches();
    setRecents(next);
  };

  const confirm = () => {
    if (!preview) return;
    onSelect(preview);
    onClose();
  };

  const pickAutocomplete = async (item: AutocompleteSuggestion) => {
    setLoadingAuto(true);
    try {
      const details = await fetchPlaceDetails(item.placeId);
      if (!details) {
        Alert.alert("Place unavailable", "Could not load place details.");
        return;
      }
      await choose(details);
      setQuery(details.title);
      setAutocomplete([]);
    } finally {
      setLoadingAuto(false);
    }
  };

  const pinAs = async (kind: "home" | "work") => {
    if (!preview) {
      Alert.alert(
        `Set ${kind === "home" ? "Home" : "Work"}`,
        "Search and select a place first, then long-press Home or Work to save it—or use Set below.",
      );
      return;
    }
    await savePinnedPlace(kind, preview);
    if (kind === "home") setHome(preview);
    else setWork(preview);
    Alert.alert("Saved", `${preview.title} is now your ${kind}.`);
  };

  const startVoice = async () => {
    if (!hasSpeechRecognitionNative()) {
      Alert.alert(
        "Voice search",
        "Voice search needs a development rebuild with the speech recognition module. You can still type your destination.",
      );
      return;
    }

    try {
      // Import only after confirming the native module exists — otherwise
      // expo-speech-recognition throws "Cannot find native module".
      const { ExpoSpeechRecognitionModule } =
        await import("expo-speech-recognition");

      const permission =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Microphone needed",
          "Allow speech recognition to search by voice.",
        );
        return;
      }

      setListening(true);

      const resultSub = ExpoSpeechRecognitionModule.addListener(
        "result",
        (event) => {
          const transcript = event.results?.[0]?.transcript;
          if (transcript) setQuery(transcript);
        },
      );
      const endSub = ExpoSpeechRecognitionModule.addListener("end", () => {
        setListening(false);
        resultSub.remove();
        endSub.remove();
        errorSub.remove();
      });
      const errorSub = ExpoSpeechRecognitionModule.addListener("error", () => {
        setListening(false);
        resultSub.remove();
        endSub.remove();
        errorSub.remove();
      });

      ExpoSpeechRecognitionModule.start({
        lang: "en-IN",
        interimResults: true,
        continuous: false,
      });
    } catch {
      setListening(false);
      Alert.alert(
        "Voice search",
        "Voice search needs a development rebuild with the speech recognition module. You can still type your destination.",
      );
    }
  };

  const showBrowse = query.trim().length === 0;

  return (
    <ModalBottomSheet
      visible={visible}
      onClose={onClose}
      title="Where to?"
      heightRatio={0.92}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.searchRow}>
          <View style={styles.searchFlex}>
            <DesignSearchBar
              value={query}
              onChangeText={setQuery}
              onClear={() => {
                setQuery("");
                setAutocomplete([]);
              }}
              placeholder="Search destination"
              autoFocus
            />
          </View>
          <Pressable
            onPress={startVoice}
            accessibilityRole="button"
            accessibilityLabel={listening ? "Listening" : "Voice search"}
            style={[
              styles.micBtn,
              {
                backgroundColor: c.primaryContainer,
                borderColor: c.border,
              },
              listening && {
                backgroundColor: c.danger,
                borderColor: c.danger,
              },
            ]}
          >
            <MaterialIcons
              name={listening ? "mic" : "mic-none"}
              size={22}
              color={listening ? c.textOnPrimary : c.primary}
            />
          </Pressable>
        </View>

        {preview ? (
          <View
            style={[
              styles.previewCard,
              {
                borderColor: c.border,
                backgroundColor: c.surface,
                ...elev.card,
              },
            ]}
          >
            <MapView
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              pointerEvents="none"
              region={{
                latitude: preview.coordinate.latitude,
                longitude: preview.coordinate.longitude,
                latitudeDelta: 0.012,
                longitudeDelta: 0.012,
              }}
            >
              <Marker coordinate={preview.coordinate} title={preview.title} />
            </MapView>
            <View style={styles.previewMeta}>
              <View style={styles.previewText}>
                <Text
                  style={[styles.previewTitle, { color: c.textPrimary }]}
                  numberOfLines={1}
                >
                  {preview.title}
                </Text>
                <Text
                  style={[styles.previewSubtitle, { color: c.textSecondary }]}
                  numberOfLines={2}
                >
                  {preview.subtitle}
                </Text>
              </View>
              {preview.safetyHint != null ? (
                <SafetyScoreChip score={preview.safetyHint} compact />
              ) : null}
            </View>
            <View style={styles.previewActions}>
              <SecondaryButton
                label="Set as Home"
                fullWidth={false}
                onPress={() => void pinAs("home")}
                style={styles.pinBtn}
              />
              <SecondaryButton
                label="Set as Work"
                fullWidth={false}
                onPress={() => void pinAs("work")}
                style={styles.pinBtn}
              />
              <Pressable
                onPress={confirm}
                style={[
                  styles.goBtn,
                  { backgroundColor: c.primary, ...elev.card },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Go to destination"
              >
                <Text style={[styles.goLabel, { color: c.textOnPrimary }]}>
                  {confirmLabel}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <ScrollView
          style={styles.flex}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listPad}
        >
          {loadingAuto ? (
            <ActivityIndicator
              color={c.primary}
              style={{ marginVertical: 8 }}
            />
          ) : null}

          {autocomplete.length > 0 ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>
                Suggestions
              </Text>
              {autocomplete.map((item) => (
                <PlaceRow
                  key={item.placeId}
                  icon="search"
                  title={item.title}
                  subtitle={item.subtitle}
                  onPress={() => void pickAutocomplete(item)}
                />
              ))}
            </View>
          ) : null}

          {showBrowse ? (
            <>
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>
                  Shortcuts
                </Text>
                <PlaceRow
                  icon="home"
                  title="Home"
                  subtitle={
                    home?.title || "Long-press a result to set · or Set as Home"
                  }
                  onPress={() => {
                    if (home) void choose(home);
                    else
                      Alert.alert(
                        "Home not set",
                        "Select a place, then tap Set as Home.",
                      );
                  }}
                  onLongPress={() => void pinAs("home")}
                />
                <PlaceRow
                  icon="work-outline"
                  title="Work"
                  subtitle={
                    work?.title || "Save your workplace for one-tap routing"
                  }
                  onPress={() => {
                    if (work) void choose(work);
                    else
                      Alert.alert(
                        "Work not set",
                        "Select a place, then tap Set as Work.",
                      );
                  }}
                  onLongPress={() => void pinAs("work")}
                />
              </View>

              {recents.length > 0 ? (
                <View style={styles.section}>
                  <Text
                    style={[styles.sectionTitle, { color: c.textSecondary }]}
                  >
                    Recent searches
                  </Text>
                  {recents.map((place) => (
                    <PlaceRow
                      key={place.id}
                      icon="history"
                      title={place.title}
                      subtitle={place.subtitle}
                      onPress={() => void choose(place)}
                    />
                  ))}
                </View>
              ) : null}

              {saved.length > 0 ? (
                <View style={styles.section}>
                  <Text
                    style={[styles.sectionTitle, { color: c.textSecondary }]}
                  >
                    Saved places
                  </Text>
                  {saved.map((place) => (
                    <PlaceRow
                      key={place.id}
                      icon="bookmark-border"
                      title={place.title}
                      subtitle={place.subtitle}
                      onPress={() => void choose(place)}
                    />
                  ))}
                </View>
              ) : null}

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: c.textSecondary }]}>
                  Suggested safe destinations
                </Text>
                {loadingSuggest ? (
                  <ActivityIndicator color={c.primary} />
                ) : suggestions.length === 0 ? (
                  <Text style={[styles.emptyHint, { color: c.textTertiary }]}>
                    Enable location to see nearby safer public places.
                  </Text>
                ) : (
                  suggestions.map((place) => (
                    <PlaceRow
                      key={place.id}
                      icon="shield"
                      title={place.title}
                      subtitle={place.subtitle}
                      trailing={
                        place.safetyHint != null ? (
                          <SafetyScoreChip
                            score={place.safetyHint}
                            compact
                            style={{ marginRight: 4 }}
                          />
                        ) : null
                      }
                      onPress={() => void choose(place)}
                    />
                  ))
                )}
              </View>
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </ModalBottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchFlex: { flex: 1 },
  micBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  previewCard: {
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  map: {
    height: 120,
    width: "100%",
  },
  previewMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  previewText: { flex: 1 },
  previewTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.size.bodyLarge,
  },
  previewSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.caption,
    marginTop: 2,
  },
  previewActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    flexWrap: "wrap",
  },
  pinBtn: {
    flexGrow: 1,
    minWidth: 110,
  },
  goBtn: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  goLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.size.bodyLarge,
  },
  listPad: {
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.size.body,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 4,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1 },
  rowTitle: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.size.bodyLarge,
  },
  rowSubtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.caption,
    marginTop: 2,
  },
  emptyHint: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.body,
    paddingHorizontal: spacing.sm,
  },
});
