import {
  fetchPlaceAutocomplete,
  fetchPlaceDetails,
  type AutocompleteSuggestion,
} from "@/services/placesAutocomplete";
import { useAppTheme } from "@/hooks/useAppTheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export type AreaCoordinate = {
  latitude: number;
  longitude: number;
};

export type AreaPlaceSearchProps = {
  /** Bias autocomplete near the user / current pin */
  biasCoordinate?: AreaCoordinate | null;
  placeholder?: string;
  onSelectPlace: (place: {
    coordinate: AreaCoordinate;
    title: string;
    subtitle: string;
  }) => void;
  onUseCurrentLocation?: () => void;
  showUseCurrentLocation?: boolean;
};

/**
 * Compact place search for report/review flows.
 * Results sit in document flow (not a floating overlay) to avoid UI clashes.
 */
export function AreaPlaceSearch({
  biasCoordinate,
  placeholder = "Search area, street, or landmark",
  onSelectPlace,
  onUseCurrentLocation,
  showUseCurrentLocation = true,
}: AreaPlaceSearchProps) {
  const { colors: c } = useAppTheme();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AutocompleteSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      void (async () => {
        try {
          const list = await fetchPlaceAutocomplete(q, biasCoordinate ?? null);
          setResults(list);
        } catch {
          setResults([]);
        } finally {
          setLoading(false);
        }
      })();
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, biasCoordinate?.latitude, biasCoordinate?.longitude]);

  const pick = async (item: AutocompleteSuggestion) => {
    setResolvingId(item.placeId);
    try {
      const details = await fetchPlaceDetails(item.placeId);
      if (details?.coordinate) {
        onSelectPlace({
          coordinate: details.coordinate,
          title: details.title || item.title,
          subtitle: details.subtitle || item.subtitle,
        });
        setQuery("");
        setResults([]);
      }
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.field,
          {
            backgroundColor: c.surfaceVariant,
            borderColor: c.border,
          },
        ]}
      >
        <MaterialIcons name="search" size={20} color={c.textSecondary} />
        <TextInput
          style={[styles.input, { color: c.textPrimary }]}
          placeholder={placeholder}
          placeholderTextColor={c.textTertiary}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="words"
        />
        {loading ? (
          <ActivityIndicator size="small" color={c.primary} />
        ) : query.length > 0 ? (
          <Pressable
            onPress={() => {
              setQuery("");
              setResults([]);
            }}
            hitSlop={8}
            accessibilityLabel="Clear search"
          >
            <MaterialIcons name="close" size={18} color={c.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {showUseCurrentLocation && onUseCurrentLocation ? (
        <Pressable
          onPress={onUseCurrentLocation}
          style={styles.currentRow}
          accessibilityRole="button"
          accessibilityLabel="Use my current location"
        >
          <MaterialIcons name="my-location" size={16} color={c.primary} />
          <Text style={[styles.currentText, { color: c.primary }]}>
            Use my current location
          </Text>
        </Pressable>
      ) : null}

      {results.length > 0 ? (
        <View
          style={[
            styles.results,
            { backgroundColor: c.surface, borderColor: c.border },
          ]}
        >
          {results.map((item) => (
            <Pressable
              key={item.placeId}
              onPress={() => void pick(item)}
              disabled={resolvingId === item.placeId}
              style={[styles.resultRow, { borderBottomColor: c.divider }]}
              accessibilityRole="button"
              accessibilityLabel={item.title}
            >
              <MaterialIcons
                name="place"
                size={18}
                color={c.textSecondary}
                style={styles.resultIcon}
              />
              <View style={styles.resultCopy}>
                <Text
                  style={[styles.resultTitle, { color: c.textPrimary }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                {item.subtitle ? (
                  <Text
                    style={[styles.resultSub, { color: c.textSecondary }]}
                    numberOfLines={1}
                  >
                    {item.subtitle}
                  </Text>
                ) : null}
              </View>
              {resolvingId === item.placeId ? (
                <ActivityIndicator size="small" color={c.primary} />
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 12,
    zIndex: 2,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 10,
  },
  currentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 10,
    paddingBottom: 2,
  },
  currentText: {
    fontSize: 13,
    fontWeight: "600",
  },
  results: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  resultIcon: {
    marginTop: 1,
  },
  resultCopy: {
    flex: 1,
    gap: 2,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  resultSub: {
    fontSize: 12,
  },
});
