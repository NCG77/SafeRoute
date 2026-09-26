import AsyncStorage from "@react-native-async-storage/async-storage";

export const RECENT_SEARCHES_KEY = "@SafeRoute:recentSearches";
export const HOME_PLACE_KEY = "@SafeRoute:homePlace";
export const WORK_PLACE_KEY = "@SafeRoute:workPlace";
export const SAVED_PLACES_KEY = "savedLocations";

export type DestinationCoordinate = {
  latitude: number;
  longitude: number;
};

export type DestinationPlace = {
  id: string;
  title: string;
  subtitle: string;
  coordinate: DestinationCoordinate;
  /** Optional Places types or local tags */
  kinds?: string[];
  safetyHint?: number;
};

export type PinnedPlace = DestinationPlace & {
  label: "home" | "work";
};

const MAX_RECENTS = 8;

export async function loadRecentSearches(): Promise<DestinationPlace[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function pushRecentSearch(
  place: DestinationPlace,
): Promise<DestinationPlace[]> {
  const existing = await loadRecentSearches();
  const next = [
    place,
    ...existing.filter((p) => p.id !== place.id),
  ].slice(0, MAX_RECENTS);
  await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  return next;
}

export async function loadPinnedPlace(
  kind: "home" | "work",
): Promise<DestinationPlace | null> {
  try {
    const key = kind === "home" ? HOME_PLACE_KEY : WORK_PLACE_KEY;
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as DestinationPlace) : null;
  } catch {
    return null;
  }
}

export async function savePinnedPlace(
  kind: "home" | "work",
  place: DestinationPlace,
): Promise<void> {
  const key = kind === "home" ? HOME_PLACE_KEY : WORK_PLACE_KEY;
  await AsyncStorage.setItem(key, JSON.stringify(place));
}

export async function loadSavedPlaces(): Promise<DestinationPlace[]> {
  try {
    const raw = await AsyncStorage.getItem(SAVED_PLACES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((p: DestinationPlace) => ({
      id: p.id,
      title: p.title,
      subtitle: p.subtitle,
      coordinate: p.coordinate,
      kinds: ["saved"],
    }));
  } catch {
    return [];
  }
}
