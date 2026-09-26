/**
 * Fetch a walking route from Google Directions (Safe Walk / short trips).
 */

import Constants from "expo-constants";
import type { LatLng } from "@/core/liveNavigation";
import {
  mapGoogleStepToNavStep,
  type NavStep,
} from "@/core/liveNavigation";

export type WalkingRoute = {
  coordinates: LatLng[];
  distanceKm: number;
  durationMin: number;
  steps: NavStep[];
};

function directionsApiKey(): string {
  return (
    process.env.EXPO_PUBLIC_GOOGLE_DIRECTIONS_API_KEY ||
    Constants.expoConfig?.extra?.googleDirectionsApiKey ||
    process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ||
    Constants.expoConfig?.extra?.googlePlacesApiKey ||
    ""
  );
}

/** Decode Google encoded polyline → LatLng[]. */
export function decodePolyline(encoded: string): LatLng[] {
  const coords: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b: number;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coords.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return coords;
}

/**
 * Walking Directions for Safe Walk. Falls back to a straight line if the
 * API key is missing or the request fails.
 */
export async function fetchWalkingRoute(
  origin: LatLng,
  destination: LatLng,
): Promise<WalkingRoute> {
  const key = directionsApiKey();
  if (key) {
    try {
      const url =
        `https://maps.googleapis.com/maps/api/directions/json` +
        `?origin=${origin.latitude},${origin.longitude}` +
        `&destination=${destination.latitude},${destination.longitude}` +
        `&mode=walking&units=metric&key=${key}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === "OK" && data.routes?.[0]) {
        const route = data.routes[0];
        const leg = route.legs[0];
        const coordinates = decodePolyline(route.overview_polyline.points);
        const steps: NavStep[] = (leg.steps || []).map((step: unknown) =>
          mapGoogleStepToNavStep(step as never, decodePolyline),
        );
        return {
          coordinates:
            coordinates.length > 0
              ? coordinates
              : [origin, destination],
          distanceKm: (leg.distance?.value ?? 0) / 1000,
          durationMin: Math.max(
            1,
            Math.round((leg.duration?.value ?? 60) / 60),
          ),
          steps,
        };
      }
      console.warn("Walking Directions failed:", data.status, data.error_message);
    } catch (e) {
      console.warn("Walking Directions error:", e);
    }
  }

  // Straight-line fallback
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(destination.latitude - origin.latitude);
  const dLon = toRad(destination.longitude - origin.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(origin.latitude)) *
      Math.cos(toRad(destination.latitude)) *
      Math.sin(dLon / 2) ** 2;
  const distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return {
    coordinates: [origin, destination],
    distanceKm,
    durationMin: Math.max(1, Math.round((distanceKm / 5) * 60)),
    steps: [],
  };
}
