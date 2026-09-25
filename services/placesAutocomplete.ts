import Constants from "expo-constants";
import type { DestinationCoordinate, DestinationPlace } from "@/core/destinationSearch";

function placesKey(): string | undefined {
  return (
    Constants.expoConfig?.extra?.googlePlacesApiKey ||
    process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ||
    Constants.expoConfig?.android?.config?.googleMaps?.apiKey ||
    Constants.expoConfig?.ios?.config?.googleMapsApiKey
  );
}

export type AutocompleteSuggestion = {
  placeId: string;
  title: string;
  subtitle: string;
};

export async function fetchPlaceAutocomplete(
  input: string,
  bias?: DestinationCoordinate | null,
): Promise<AutocompleteSuggestion[]> {
  const key = placesKey();
  if (!key || !input.trim()) return [];

  const location = bias
    ? `&location=${bias.latitude}%2C${bias.longitude}&radius=35000`
    : "";
  const url =
    `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
    `?input=${encodeURIComponent(input.trim())}&key=${key}${location}`;

  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(data.error_message || data.status || "Autocomplete failed");
  }
  return (data.predictions ?? []).slice(0, 6).map((p: any) => ({
    placeId: p.place_id,
    title: p.structured_formatting?.main_text || p.description,
    subtitle:
      p.structured_formatting?.secondary_text || p.description || "",
  }));
}

export async function fetchPlaceDetails(
  placeId: string,
): Promise<DestinationPlace | null> {
  const key = placesKey();
  if (!key) return null;

  const url =
    `https://maps.googleapis.com/maps/api/place/details/json` +
    `?place_id=${encodeURIComponent(placeId)}` +
    `&fields=place_id,name,formatted_address,geometry,types` +
    `&key=${key}`;

  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== "OK" || !data.result) return null;
  const r = data.result;
  return {
    id: r.place_id,
    title: r.name,
    subtitle: r.formatted_address || "",
    coordinate: {
      latitude: r.geometry.location.lat,
      longitude: r.geometry.location.lng,
    },
    kinds: r.types,
  };
}

/** Nearby public places often associated with safer evening destinations. */
const SAFE_TYPES = [
  { type: "police", label: "Police", boost: 92 },
  { type: "hospital", label: "Hospital", boost: 88 },
  { type: "shopping_mall", label: "Mall", boost: 78 },
  { type: "subway_station", label: "Metro", boost: 80 },
  { type: "cafe", label: "Cafe", boost: 74 },
] as const;

export async function fetchSuggestedSafeDestinations(
  origin: DestinationCoordinate,
): Promise<DestinationPlace[]> {
  const key = placesKey();
  if (!key) return [];

  const results: DestinationPlace[] = [];

  await Promise.all(
    SAFE_TYPES.map(async ({ type, boost }) => {
      const url =
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
        `?location=${origin.latitude}%2C${origin.longitude}` +
        `&radius=2500&type=${type}&key=${key}`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.status !== "OK" || !data.results?.length) return;
        const place = data.results[0];
        results.push({
          id: place.place_id,
          title: place.name,
          subtitle: place.vicinity || type,
          coordinate: {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
          },
          kinds: place.types,
          safetyHint: boost,
        });
      } catch {
        // ignore individual type failures
      }
    }),
  );

  return results.sort((a, b) => (b.safetyHint ?? 0) - (a.safetyHint ?? 0));
}
