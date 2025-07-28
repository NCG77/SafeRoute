// SafeMaps.js (Main Application Component - formerly App.js)
import { useNavigation, useRoute } from "@react-navigation/native";
import Constants from "expo-constants";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Text,
} from "react-native";

import BottomSheet from "../../components/maps/BottomSheet";
import DirectionsModal from "../../components/maps/DirectionModal";
import LoadingOverlay from "../../components/maps/LoadingOverlay";
import LongPressInstruction from "../../components/maps/LongPressInstruction";
import MapDisplay from "../../components/maps/MapDisplay";
import NavigationHeader from "../../components/maps/NavigationHeader";
import NearestPlaceConfirmationModal from "../../components/maps/NearestPlaceConfirmationModal"; // NEW: Import confirmation modal
import RouteOptionsDisplay from "../../components/maps/RouteOptionDisplay";
import SafetyReviewModal from "../../components/maps/SafetyReviewModal";
import SearchBar from "../../components/maps/SearchBar";

import { GlobalStyles } from "../../constants/GlobalStyles";

const { width, height } = Dimensions.get("window");

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface SearchResult {
  id: string;
  title: string;
  coordinate: Coordinate;
  subtitle: string;
}

interface SafetyReview {
  id: number;
  latitude: number;
  longitude: number;
  rating: number;
  comment: string;
  category: string;
  timestamp: number;
  userId: string;
}

interface DangerousArea {
  latitude: number;
  longitude: number;
  radius: number;
  severity: number;
}

interface RouteInfo {
  distance: number;
  duration: number;
  safety: any;
}

const SafeMaps = () => {
  // Get route parameters
  const route = useRoute();
  const navigation = useNavigation();
  const { showPoliceStations, showHospitals } = route.params || {};

  // State for location and map
  const [location, setLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState(null); // To control map's visible region
  const mapRef = useRef(null);
  const [currentRegionName, setCurrentRegionName] = useState(null); // Stores current city/region name (kept for potential future use)

  // State for search functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<SearchResult | null>(
    null
  );

  const [routeCoordinates, setRouteCoordinates] = useState<Coordinate[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [routeOptions, setRouteOptions] = useState<any[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [isNavigationMode, setIsNavigationMode] = useState(false);
  const [directions, setDirections] = useState<any[]>([]);
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);

  const [safetyReviews, setSafetyReviews] = useState<SafetyReview[]>([]);
  const [dangerousAreas, setDangerousAreas] = useState<DangerousArea[]>([]);
  const [safeRouteOnly, setSafeRouteOnly] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewLocation, setReviewLocation] = useState(null);

  // State for long press instruction visibility
  const [showLongPressInstruction, setShowLongPressInstruction] =
    useState(false);

  // State for nearby police stations and hospitals
  const [nearbyPoliceStations, setNearbyPoliceStations] = useState([]);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);

  // NEW: State for the nearest place details and modal visibility
  const [nearestPlaceDetails, setNearestPlaceDetails] = useState(null);
  const [showNearestPlaceModal, setShowNearestPlaceModal] = useState(false);

  // Animation for bottom sheet
  const bottomSheetAnim = useRef(new Animated.Value(0)).current;
  const [showBottomSheet, setShowBottomSheet] = useState(false);

  const GOOGLE_PLACES_API_KEY =
    process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ||
    Constants.expoConfig?.extra?.googlePlacesApiKey ||
    Constants.expoConfig?.android?.config?.googleMaps?.apiKey ||
    Constants.expoConfig?.ios?.config?.googleMapsApiKey;

  useEffect(() => {
    getCurrentLocation();
    loadSafetyData();
  }, []);

  useEffect(() => {
    if (location) {
      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      const timer = setTimeout(() => {
        setShowLongPressInstruction(true);
      }, 2000);
      const hideTimer = setTimeout(() => {
        setShowLongPressInstruction(false);
      }, 8000);
      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    }
  }, [location]);

  // Effect to trigger nearby search based on route params
  useEffect(() => {
    if (location && (showPoliceStations || showHospitals)) {
      // Clear any existing route/search results when a nearby search is triggered
      setRouteCoordinates([]);
      setRouteInfo(null);
      setRouteOptions([]);
      setSelectedLocation(null);
      setSearchQuery("");
      setShowSearchResults(false);
      setShowBottomSheet(false);
      setIsNavigationMode(false); // Ensure not in navigation mode

      if (showPoliceStations) {
        getNearbyPlaces("police");
      }
      if (showHospitals) {
        getNearbyPlaces("hospital");
      }

      // IMPORTANT for tab navigation: Clear params after consumption
      // This prevents the effect from re-running if the user navigates away
      // and then back to the SafeMaps tab without pressing the button again.
      navigation.setParams({
        showPoliceStations: undefined,
        showHospitals: undefined,
      });
    }
  }, [location, showPoliceStations, showHospitals, navigation]);

  // --- Location and Safety Data Management ---

  /**
   * Fetches the current device location and requests permissions.
   * Also performs reverse geocoding to get current city/region name.
   */
  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Location permission is required to use this app."
        );
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currentLocation);

      const reverseGeocode = await Location.reverseGeocodeAsync(
        currentLocation.coords
      );
      if (reverseGeocode && reverseGeocode.length > 0) {
        const { city, region } = reverseGeocode[0];
        if (city) {
          setCurrentRegionName(city);
        } else if (region) {
          setCurrentRegionName(region);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to get current location. Please try again.");
    }
  };

  const loadSafetyData = () => {
    const mockReviews = [
      // Safe Areas in Bhopal (Rating 4-5)
      {
        id: 1,
        latitude: 23.2548, // Near Upper Lake (Bada Talab) - Boat Club area
        longitude: 77.3995,
        rating: 5,
        comment:
          "Well-lit and popular area for walks. Feels very safe due to crowds.",
        category: "general",
        timestamp: Date.now() - 86400000 * 5, // 5 days ago
        userId: "bhopal_user1",
      },
      {
        id: 2,
        latitude: 23.2595, // Near DB City Mall / Zone-I
        longitude: 77.4126,
        rating: 4,
        comment:
          "Busy commercial hub with good security. Safe during day and evening.",
        category: "security",
        timestamp: Date.now() - 86400000 * 3, // 3 days ago
        userId: "bhopal_user2",
      },
      {
        id: 3,
        latitude: 23.245, // Near New Market
        longitude: 77.404,
        rating: 4,
        comment:
          "Crowded market area, active police patrolling. Safe for shopping.",
        category: "general",
        timestamp: Date.now() - 86400000 * 7, // 7 days ago
        userId: "bhopal_user3",
      },
      {
        id: 4,
        latitude: 23.27, // Near Van Vihar National Park entrance
        longitude: 77.375,
        rating: 5,
        comment:
          "Protected national park area. Very safe during operational hours. Good for nature walks.",
        category: "security",
        timestamp: Date.now() - 86400000 * 2, // 2 days ago
        userId: "bhopal_user4",
      },
      {
        id: 5,
        latitude: 23.22, // Near Shahpura Lake
        longitude: 77.435,
        rating: 4,
        comment:
          "Nice lakeside area, well-maintained. Feels safe with families around.",
        category: "general",
        timestamp: Date.now() - 86400000 * 4, // 4 days ago
        userId: "bhopal_user5",
      },

      // Caution Areas in Bhopal (Rating 3)
      {
        id: 6,
        latitude: 23.235, // Near Habibganj Railway Station / ISBT area
        longitude: 77.43,
        rating: 3,
        comment:
          "Busy transport hub. Can be crowded and chaotic. Exercise caution at night.",
        category: "crowd",
        timestamp: Date.now() - 86400000 * 1, // 1 day ago
        userId: "bhopal_user6",
      },
      {
        id: 7,
        latitude: 23.2681, // Ibrahimganj - based on your previous testing
        longitude: 77.4049,
        rating: 3,
        comment:
          "Narrow streets, some areas lack proper lighting. Mixed reviews.",
        category: "lighting",
        timestamp: Date.now() - 86400000 * 6, // 6 days ago
        userId: "bhopal_user7",
      },

      // Dangerous Areas in Bhopal (Rating 1-2)
      {
        id: 8,
        latitude: 23.265, // Example of a less populated street/alley (hypothetical)
        longitude: 77.408,
        rating: 2,
        comment:
          "Very poor lighting and often deserted after 9 PM. Felt unsafe walking alone.",
        category: "lighting",
        timestamp: Date.now() - 86400000 * 0.5, // 12 hours ago
        userId: "bhopal_user8",
      },
      {
        id: 9,
        latitude: 23.24, // Another hypothetical isolated spot
        longitude: 77.39,
        rating: 1,
        comment:
          "Frequent reports of petty crime and harassment. Highly unsafe, avoid this route.",
        category: "crime",
        timestamp: Date.now() - 86400000 * 1.5, // 1.5 days ago
        userId: "bhopal_user9",
      },
      {
        id: 10,
        latitude: 23.275, // Near a less maintained area (hypothetical)
        longitude: 77.415,
        rating: 2,
        comment:
          "Broken pavements and overgrown bushes make it feel unsafe, especially at night.",
        category: "infrastructure",
        timestamp: Date.now() - 86400000 * 2.5, // 2.5 days ago
        userId: "bhopal_user10",
      },
    ];

    setSafetyReviews(mockReviews);

    const dangerous = mockReviews
      .filter((review) => review.rating <= 2)
      .map((review) => ({
        latitude: review.latitude,
        longitude: review.longitude,
        radius: 500,
        severity: review.rating,
      }));

    setDangerousAreas(dangerous);
  };

  const submitSafetyReview = useCallback(
    (
      latitude: number,
      longitude: number,
      rating: number,
      comment: string,
      category: string
    ) => {
      const newReview = {
        id: Date.now(),
        latitude,
        longitude,
        rating,
        comment,
        category,
        timestamp: Date.now(),
        userId: "current_user", // Replace with actual user ID
      };

      const updatedReviews = [...safetyReviews, newReview];
      setSafetyReviews(updatedReviews);

      // Update dangerous areas if the new review indicates danger
      if (rating <= 2) {
        const newDangerousArea = {
          latitude,
          longitude,
          radius: 500,
          severity: rating,
        };
        setDangerousAreas((prev) => [...prev, newDangerousArea]);
      }

      Alert.alert(
        "Review Submitted",
        "Thank you for helping keep our community safe!"
      );
      setShowReviewModal(false);
    },
    [safetyReviews]
  );

  // --- Search Functionality ---

  const searchPlaces = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    // Hide instruction when search starts
    setShowLongPressInstruction(false);

    if (!GOOGLE_PLACES_API_KEY) {
      Alert.alert(
        "API Key Missing",
        "Google Places API key is not configured."
      );
      console.error("Google Places API key is missing.");
      return;
    }

    try {
      // Use Google Places Text Search API
      const PLACE_SEARCH_URL =
        "https://maps.googleapis.com/maps/api/place/textsearch/json";

      // Bias results towards current location (optional, but highly recommended for relevance)
      // radius is in meters, 50000m = 50km
      const locationBias = location
        ? `&locationbias=circle:50000@${location.coords.latitude},${location.coords.longitude}`
        : "";
      // You can also use &strictbounds to only return results within the viewport/circle, but it's often too restrictive.

      const url = `${PLACE_SEARCH_URL}?query=${encodeURIComponent(
        query
      )}&key=${GOOGLE_PLACES_API_KEY}${locationBias}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK") {
        const formattedResults = data.results
          .slice(0, 5)
          .map((place: any, index: number) => ({
            id: place.place_id, // Use place_id for unique identification
            title: place.name,
            subtitle:
              place.formatted_address ||
              `${place.vicinity || ""}, ${
                place.plus_code?.compound_code || ""
              }`, // More detailed address
            coordinate: {
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
            },
          }));
        setSearchResults(formattedResults);
        setShowSearchResults(true);
      } else if (data.status === "ZERO_RESULTS") {
        setSearchResults([]);
        setShowSearchResults(true);
      } else {
        console.error(
          "Google Places API error:",
          data.status,
          data.error_message
        );
        Alert.alert(
          "Search Error",
          `Google Places API Error: ${data.error_message || data.status}`
        );
      }
    } catch (error) {
      console.error("Places API fetch error:", error);
      Alert.alert(
        "Search Error",
        "Network error or invalid API key. Check console for details."
      );
    }
  };

  const selectSearchResult = (result: SearchResult) => {
    setSearchQuery(result.title);
    setShowSearchResults(false);
    setSelectedLocation(result);
    animateBottomSheet(true);
    mapRef.current?.animateToRegion({
      latitude: result.coordinate.latitude,
      longitude: result.coordinate.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const animateBottomSheet = (show: boolean) => {
    Animated.timing(bottomSheetAnim, {
      toValue: show ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      if (!show) setShowBottomSheet(false);
    });
    if (show) setShowBottomSheet(true);
  };

  const decodePolyline = (encoded: string): Coordinate[] => {
    const coordinates = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      coordinates.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return coordinates;
  };

  /**
   * Calculates distance between two coordinates using Haversine formula.
   * @param {object} origin - {latitude, longitude}
   * @param {object} destination - {latitude, longitude}
   * @returns {number} Distance in kilometers.
   */
  const calculateDistance = (
    origin: Coordinate,
    destination: Coordinate
  ): number => {
    const R = 6371; // Earth's radius in km
    const deg2rad = (deg: number) => deg * (Math.PI / 180);

    const dLat = deg2rad(destination.latitude - origin.latitude);
    const dLon = deg2rad(destination.longitude - origin.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(origin.latitude)) *
        Math.cos(deg2rad(destination.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  /**
   * Gets the safety score for a given area based on nearby reviews.
   * @param {number} latitude
   * @param {number} longitude
   * @param {number} radius - Search radius in meters.
   * @returns {object} {score, status, reviews}
   */
  const getAreaSafetyScore = useCallback(
    (latitude: number, longitude: number, radius = 500) => {
      // Increased radius to 500m
      const nearbyReviews = safetyReviews.filter((review) => {
        const distance = calculateDistance(
          { latitude, longitude },
          { latitude: review.latitude, longitude: review.longitude }
        );
        return distance <= radius / 1000; // Convert radius to km
      });

      if (nearbyReviews.length === 0) {
        return { score: 3, status: "unreviewed", reviews: [] };
      }

      const avgRating =
        nearbyReviews.reduce((sum, review) => sum + review.rating, 0) /
        nearbyReviews.length;

      let status = "safe";
      if (avgRating <= 2) status = "dangerous";
      else if (avgRating <= 3.5) status = "caution";

      return { score: avgRating, status, reviews: nearbyReviews };
    },
    [safetyReviews]
  );

  /**
   * Analyzes the safety of an entire route by checking segments.
   * @param {Array<object>} coordinates - Array of route coordinates.
   * @returns {object} Overall safety status, danger percentage, and segment-wise safety.
   */
  const analyzeRouteSafety = useCallback(
    (coordinates: Coordinate[]) => {
      let totalDangerousSegments = 0;
      let totalSafeSegments = 0;
      let totalUnreviewedSegments = 0;

      const segmentSafety = [];

      // Analyze more frequently along the route for better accuracy
      for (let i = 0; i < coordinates.length; i += 5) {
        // Changed from i += 10 to i += 5
        const coord = coordinates[i];
        const safety = getAreaSafetyScore(coord.latitude, coord.longitude, 500); // Check within 500m radius

        segmentSafety.push({
          coordinate: coord,
          safety: safety.status,
          score: safety.score,
        });

        if (safety.status === "dangerous") totalDangerousSegments++;
        else if (safety.status === "safe") totalSafeSegments++;
        else totalUnreviewedSegments++;
      }

      const totalSegments = segmentSafety.length;
      const dangerPercentage =
        totalSegments > 0 ? (totalDangerousSegments / totalSegments) * 100 : 0;

      let overallSafety = "safe";
      // MODIFIED: Lowered threshold for 'dangerous' to be more sensitive
      if (totalDangerousSegments > 0 || dangerPercentage >= 1)
        overallSafety = "dangerous";
      // If even one dangerous segment, or 1% of segments are dangerous
      else if (dangerPercentage > 10) overallSafety = "caution";
      else if (
        totalSegments > 0 &&
        totalUnreviewedSegments / totalSegments > 0.7
      )
        overallSafety = "unreviewed"; // Mostly unreviewed route

      return {
        overall: overallSafety,
        dangerPercentage,
        segmentSafety,
        stats: {
          dangerous: totalDangerousSegments,
          safe: totalSafeSegments,
          unreviewed: totalUnreviewedSegments,
        },
      };
    },
    [getAreaSafetyScore]
  );

  /**
   * Returns a color based on the safety status.
   * @param {string} safetyStatus - 'dangerous', 'caution', 'safe', 'unreviewed'
   * @returns {string} Hex color code.
   */
  const getSafetyColor = (safetyStatus: string): string => {
    switch (safetyStatus) {
      case "dangerous":
        return "#FF4444";
      case "caution":
        return "#FFA500";
      case "safe":
        return "#4CAF50";
      default:
        return "#2196F3";
    }
  };

  /**
   * Fetches multiple route options from Google Directions API, including alternatives
   * and routes avoiding certain features, then analyzes their safety.
   * @param {object} origin - {latitude, longitude}
   * @param {object} destination - {latitude, longitude}
   * @returns {Array<object>} Sorted array of route objects with safety analysis.
   */
  const getMultipleGoogleRoutes = async (
    origin: Coordinate,
    destination: Coordinate
  ) => {
    const API_KEY =
      process.env.EXPO_PUBLIC_GOOGLE_DIRECTIONS_API_KEY ||
      Constants.expoConfig?.extra?.googleDirectionsApiKey ||
      Constants.expoConfig?.android?.config?.googleMaps?.apiKey ||
      Constants.expoConfig?.ios?.config?.googleMapsApiKey;

    if (!API_KEY) {
      Alert.alert(
        "API Key Missing",
        "Google Directions API key is not configured. Please add it to your app.json extra field."
      );
      throw new Error("Google API key not found");
    }

    const fetchRoute = async (pref = "") => {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${
        origin.latitude
      },${origin.longitude}&destination=${destination.latitude},${
        destination.longitude
      }&key=${API_KEY}&alternatives=true&units=metric${pref ? `&${pref}` : ""}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.status !== "OK") {
        console.warn(
          `Google Directions API error (${pref}):`,
          data.status,
          data.error_message
        );
        return [];
      }
      return data.routes || [];
    };

    let allGoogleRoutes = [];

    // Fetch standard routes and alternatives
    allGoogleRoutes.push(...(await fetchRoute()));
    // Fetch routes avoiding highways
    allGoogleRoutes.push(...(await fetchRoute("avoid=highways")));
    // Fetch routes avoiding tolls
    allGoogleRoutes.push(...(await fetchRoute("avoid=tolls")));

    // Process and remove duplicates
    const processedRoutes = allGoogleRoutes.map((route, index) => {
      const leg = route.legs[0];
      const coordinates = decodePolyline(route.overview_polyline.points);
      const directions = leg.steps.map((step: any) => ({
        instruction: step.html_instructions.replace(/<[^>]*>/g, ""),
        distance: step.distance.text,
        duration: step.duration.text,
      }));

      return {
        id: `route-${Date.now()}-${index}`,
        coordinates,
        distance: leg.distance.value / 1000, // in km
        duration: Math.round(leg.duration.value / 60), // in minutes
        description: `${leg.distance.text} • ${leg.duration.text}`,
        directions,
      };
    });

    // Remove duplicate routes based on proximity of distance and duration
    const uniqueRoutes: any[] = [];
    for (const route of processedRoutes) {
      const isDuplicate = uniqueRoutes.some((existing) => {
        const distanceDiff = Math.abs(existing.distance - route.distance);
        const durationDiff = Math.abs(existing.duration - route.duration);
        return distanceDiff < 0.5 && durationDiff < 2; // 0.5km and 2min tolerance
      });
      if (!isDuplicate) {
        uniqueRoutes.push(route);
      }
    }

    // Analyze safety for all unique routes
    const routesWithSafety = uniqueRoutes.map((route, index) => {
      const safetyAnalysis = analyzeRouteSafety(route.coordinates);
      return {
        ...route,
        safety: safetyAnalysis,
        color: getSafetyColor(safetyAnalysis.overall), // <--- This is the line that uses getSafetyColor
        title: index === 0 ? "Primary Route" : `Alternative Route ${index + 1}`,
      };
    });

    // Sort routes: safest first, then shortest duration
    routesWithSafety.sort((a, b) => {
      const safetyPriority = {
        safe: 4,
        unreviewed: 3,
        caution: 2,
        dangerous: 1,
      };
      const aSafety = (safetyPriority as any)[a.safety.overall];
      const bSafety = (safetyPriority as any)[b.safety.overall];

      if (aSafety !== bSafety) return bSafety - aSafety; // Prioritize higher safety score
      return a.duration - b.duration; // Then prioritize shorter duration
    });

    return routesWithSafety;
  };

  /**
   * Function to calculate routes and display options.
   * This does NOT set navigation mode to true immediately.
   * @param {object} destinationCoord - The coordinate of the destination to calculate route for.
   */
  const calculateAndShowRoutes = async (destinationCoord) => {
    // MODIFIED: Accepts destinationCoord
    if (!location || !destinationCoord) {
      // MODIFIED: Checks destinationCoord
      Alert.alert("Error", "Please select a destination first.");
      return;
    }

    setIsCalculatingRoute(true);
    setRouteOptions([]); // Clear previous options
    setRouteCoordinates([]);
    setRouteInfo(null);
    setDirections([]);
    setSelectedRouteIndex(0);
    setIsNavigationMode(false); // Ensure navigation mode is false when showing options

    // Set selectedLocation here, just before calculation uses it
    setSelectedLocation({
      title: nearestPlaceDetails?.title || "Destination", // Use nearestPlaceDetails title if available
      subtitle: nearestPlaceDetails?.subtitle || "",
      coordinate: destinationCoord,
    });

    try {
      const routes = await getMultipleGoogleRoutes(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        destinationCoord // MODIFIED: Use destinationCoord here
      );

      if (!routes || routes.length === 0) {
        Alert.alert(
          "No Routes Found",
          "Could not calculate any routes between the selected locations."
        );
        return;
      }

      setRouteOptions(routes);

      let selectedRoute = routes[0]; // Default to the first (safest/shortest) route

      // If "safeRouteOnly" is enabled and the best route is dangerous, try to find an alternative.
      if (safeRouteOnly && selectedRoute.safety.overall === "dangerous") {
        const saferAlternative = routes.find(
          (r) => r.safety.overall !== "dangerous"
        );
        if (saferAlternative) {
          selectedRoute = saferAlternative;
          Alert.alert(
            "Safer Route Found",
            "The primary route passes through unsafe areas. A safer alternative has been selected for you."
          );
        } else {
          Alert.alert(
            "Safety Warning",
            "All available routes pass through areas marked as unsafe. Consider traveling at a different time or choosing a different destination.",
            [
              { text: "Continue Anyway", onPress: () => {} }, // Allows user to proceed with dangerous route
              {
                text: "Cancel",
                onPress: () => {
                  setIsCalculatingRoute(false);
                  return;
                },
                style: "cancel",
              },
            ]
          );
        }
      }

      setRouteCoordinates(selectedRoute.coordinates);
      setRouteInfo(selectedRoute);
      setDirections(selectedRoute.directions || []);
      setSelectedRouteIndex(routes.indexOf(selectedRoute)); // Set index of the actually selected route

      // Fit map to route coordinates
      if (selectedRoute.coordinates.length > 0) {
        mapRef.current?.fitToCoordinates(selectedRoute.coordinates, {
          edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
          animated: true,
        });
      }
    } catch (error) {
      console.error("Route calculation error:", error);
      Alert.alert(
        "Route Error",
        "Could not calculate routes. Please check your internet connection or try again later."
      );
    } finally {
      setIsCalculatingRoute(false);
      animateBottomSheet(false); // Hide bottom sheet after calculation
    }
  };

  /**
   * Function to fetch nearby places (police or hospital)
   * @param {string} placeType - 'police' or 'hospital'
   */
  const getNearbyPlaces = async (placeType) => {
    if (!location) {
      Alert.alert(
        "Location Error",
        "Cannot find nearby places without your current location."
      );
      return;
    }
    if (!GOOGLE_PLACES_API_KEY) {
      Alert.alert(
        "API Key Missing",
        "Google Places API key is not configured."
      );
      console.error("Google Places API key is missing.");
      return;
    }

    setIsLoadingNearby(true);
    setNearbyPoliceStations([]); // Clear all nearby markers initially
    setNearbyHospitals([]); // Clear all nearby markers initially
    setNearestPlaceDetails(null); // Clear previous nearest place details

    try {
      const NEARBY_SEARCH_URL =
        "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
      const radius = 50000; // Search within 50 km radius (adjust as needed)
      const url = `${NEARBY_SEARCH_URL}?location=${location.coords.latitude},${location.coords.longitude}&radius=${radius}&type=${placeType}&key=${GOOGLE_PLACES_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK") {
        // MODIFIED: Directly take the first result from Google's API response
        const nearestPlaceFromAPI = data.results[0];

        if (nearestPlaceFromAPI) {
          const formattedNearest = {
            id: nearestPlaceFromAPI.place_id,
            title: nearestPlaceFromAPI.name,
            subtitle:
              nearestPlaceFromAPI.vicinity ||
              nearestPlaceFromAPI.formatted_address,
            coordinate: {
              latitude: nearestPlaceFromAPI.geometry.location.lat,
              longitude: nearestPlaceFromAPI.geometry.location.lng,
            },
            // Calculate distance for display in modal, using Haversine
            distance: calculateDistance(
              location.coords,
              nearestPlaceFromAPI.geometry.location
            ),
          };

          // Set only the nearest place to the respective state
          if (placeType === "police") {
            setNearbyPoliceStations([formattedNearest]); // Only the nearest police station
          } else if (placeType === "hospital") {
            setNearbyHospitals([formattedNearest]); // Only the nearest hospital
          }

          setNearestPlaceDetails({ ...formattedNearest, type: placeType }); // Store details for modal
          setShowNearestPlaceModal(true); // Show the confirmation modal

          // Fit map to this single nearest marker
          if (mapRef.current) {
            mapRef.current.fitToCoordinates(
              [formattedNearest.coordinate, location.coords],
              {
                // Include current location for context
                edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
                animated: true,
              }
            );
          }
        } else {
          // No results found even if status is OK but results array is empty
          Alert.alert(
            `No ${
              placeType === "police" ? "Police Stations" : "Hospitals"
            } Found`,
            `Could not find any ${
              placeType === "police" ? "police stations" : "hospitals"
            } within 50 km.`
          );
        }
      } else if (data.status === "ZERO_RESULTS") {
        Alert.alert(
          `No ${
            placeType === "police" ? "Police Stations" : "Hospitals"
          } Found`,
          `Could not find any ${
            placeType === "police" ? "police stations" : "hospitals"
          } within 50 km.`
        );
      } else {
        console.error(
          `Google Places Nearby Search error for ${placeType}:`,
          data.status,
          data.error_message
        );
        Alert.alert(
          "Nearby Search Error",
          `Could not fetch ${placeType} locations. Error: ${
            data.error_message || data.status
          }`
        );
      }
    } catch (error) {
      console.error(`Error fetching nearby ${placeType}:`, error);
      Alert.alert(
        "Network Error",
        `Failed to fetch nearby ${placeType}. Check your internet connection.`
      );
    } finally {
      setIsLoadingNearby(false);
    }
  };

  /**
   * Starts navigation to the nearest place found.
   */
  const startNavigationToNearestPlace = () => {
    if (nearestPlaceDetails && location) {
      // Pass the coordinate directly to calculateAndShowRoutes
      calculateAndShowRoutes(nearestPlaceDetails.coordinate);
      setShowNearestPlaceModal(false); // Close the modal
    } else {
      Alert.alert("Error", "No nearest place selected for navigation.");
    }
  };

  /**
   * Initiates actual navigation. This is called from RouteOptionsDisplay.
   */
  const startActualNavigation = () => {
    if (!routeInfo || !routeCoordinates.length) {
      Alert.alert("Error", "No route selected to start navigation.");
      return;
    }
    setIsNavigationMode(true);
    // You might want to fit the map to the current user location and route here
    mapRef.current?.fitToCoordinates(routeCoordinates, {
      edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
      animated: true,
    });
  };

  /**
   * Stops the current navigation.
   */
  const stopNavigation = () => {
    setIsNavigationMode(false);
    setRouteCoordinates([]);
    setRouteInfo(null);
    setDirections([]);
    setRouteOptions([]);
    setSelectedRouteIndex(0);
    setNearbyPoliceStations([]); // Clear nearby markers on stop navigation
    setNearbyHospitals([]); // Clear nearby markers on stop navigation
    setNearestPlaceDetails(null); // Clear nearest place details on stop navigation
    setShowNearestPlaceModal(false); // Ensure modal is closed
    // Optionally, reset map to current location
    if (location && selectedLocation) {
      mapRef.current?.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  };

  /**
   * Selects a different route option from the available list.
   * @param {number} routeIndex
   */
  const selectRouteOption = (routeIndex: number) => {
    const newSelectedRoute = routeOptions[routeIndex];
    if (!newSelectedRoute) return;

    setSelectedRouteIndex(routeIndex);
    setRouteCoordinates(newSelectedRoute.coordinates);
    setRouteInfo(newSelectedRoute);
    setDirections(newSelectedRoute.directions || []);

    if (newSelectedRoute.safety?.overall === "dangerous") {
      Alert.alert(
        "Safety Warning",
        "This route passes through areas reported as unsafe. Please consider an alternative route or travel during daylight hours.",
        [{ text: "Understood", style: "default" }]
      );
    }

    // Fit map to new selected route
    mapRef.current?.fitToCoordinates(newSelectedRoute.coordinates, {
      edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
      animated: true,
    });
  };

  // --- Render Logic ---
  if (!location) {
    return (
      <SafeAreaView style={GlobalStyles.loadingContainer}>
        <Text style={GlobalStyles.loadingText}>Loading SafeRoute...</Text>
        <Text style={GlobalStyles.loadingSubtext}>
          Finding the safest paths for you
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <SafeAreaView style={GlobalStyles.container}>
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          showSearchResults={showSearchResults}
          onSearch={searchPlaces}
          onSelectResult={selectSearchResult}
          onClearSearch={() => {
            setSearchQuery("");
            setShowSearchResults(false);
          }}
        />

        {/* Map Display */}
        <MapDisplay
          mapRef={mapRef}
          initialRegion={mapRegion}
          selectedLocation={selectedLocation}
          safetyReviews={safetyReviews}
          dangerousAreas={dangerousAreas}
          routeCoordinates={routeCoordinates}
          routeColor="#2196F3"
          onLongPress={(event: any) => {
            setReviewLocation(event.nativeEvent.coordinate);
            setShowReviewModal(true);
            setShowLongPressInstruction(false); // Hide instruction on long press
          }}
          onMyLocationPress={getCurrentLocation}
          nearbyPoliceStations={nearbyPoliceStations}
          nearbyHospitals={nearbyHospitals}
        />

        {/* Loading Overlay for route calculation */}
        <LoadingOverlay
          isVisible={isCalculatingRoute || isLoadingNearby}
          message={
            isCalculatingRoute
              ? "Finding safest route..."
              : "Finding nearby places..."
          }
          subMessage={
            isCalculatingRoute ? "Avoiding dangerous areas" : "Please wait..."
          }
        />

        {/* Navigation Header */}
        <NavigationHeader
          isVisible={isNavigationMode && routeInfo}
          routeInfo={routeInfo}
          onStopNavigation={stopNavigation}
        />

        {/* Route Options Display */}
        <RouteOptionsDisplay
          isVisible={routeOptions.length > 0 && !isNavigationMode}
          routeOptions={routeOptions}
          selectedRouteIndex={selectedRouteIndex}
          onSelectRoute={selectRouteOption}
          onViewDirections={() => setShowDirectionsModal(true)}
          onStartNavigation={startActualNavigation}
          onRecalculateRoute={calculateAndShowRoutes} // This will now need selectedLocation to be set externally
          safeRouteOnly={safeRouteOnly}
          onToggleSafeRouteOnly={() => setSafeRouteOnly((prev) => !prev)}
        />

        {/* Bottom Sheet for selected location details */}
        <BottomSheet
          showBottomSheet={showBottomSheet}
          bottomSheetAnim={bottomSheetAnim}
          selectedLocation={selectedLocation}
          onStartNavigation={() =>
            calculateAndShowRoutes(selectedLocation.coordinate)
          } // MODIFIED: Pass coordinate directly
          onClose={() => animateBottomSheet(false)}
        />

        {/* Safety Review Modal */}
        <SafetyReviewModal
          showReviewModal={showReviewModal}
          reviewLocation={reviewLocation}
          onSubmit={submitSafetyReview}
          onClose={() => setShowReviewModal(false)}
        />

        {/* Directions Modal */}
        <DirectionsModal
          showDirectionsModal={showDirectionsModal}
          directions={directions}
          routeInfo={routeInfo}
          onClose={() => setShowDirectionsModal(false)}
        />

        {/* Long Press Instruction */}
        <LongPressInstruction
          isVisible={showLongPressInstruction}
          onClose={() => setShowLongPressInstruction(false)}
        />

        {/* Nearest Place Confirmation Modal */}
        <NearestPlaceConfirmationModal
          isVisible={showNearestPlaceModal}
          placeDetails={nearestPlaceDetails}
          onConfirmNavigation={startNavigationToNearestPlace}
          onCancel={() => {
            setShowNearestPlaceModal(false);
            setNearestPlaceDetails(null); // Clear details if user cancels
            setNearbyPoliceStations([]); // Clear markers if user cancels
            setNearbyHospitals([]); // Clear markers if user cancels
          }}
        />

        {/* Emergency Button */}
        {/* Removed EmergencyButton component */}
      </SafeAreaView>
    </>
  );
};

export default SafeMaps;
