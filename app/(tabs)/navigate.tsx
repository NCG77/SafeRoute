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

// Import custom components - Adjusted paths based on your provided structure
import BottomSheet from "../../components/maps/BottomSheet";
import DirectionsModal from "../../components/maps/DirectionModal";
// import EmergencyButton from "../../components/maps/EmergencyButton"; // Removed: EmergencyButton import
import LoadingOverlay from "../../components/maps/LoadingOverlay";
import LongPressInstruction from "../../components/maps/LongPressInstruction";
import MapDisplay from "../../components/maps/MapDisplay";
import NavigationHeader from "../../components/maps/NavigationHeader";
import NearestPlaceConfirmationModal from "../../components/maps/NearestPlaceConfirmationModal"; // NEW: Import confirmation modal
import RouteOptionsDisplay from "../../components/maps/RouteOptionDisplay";
import SafetyReviewModal from "../../components/maps/SafetyReviewModal";
import SearchBar from "../../components/maps/SearchBar";

// Global styles for consistency
import { GlobalStyles } from "../../constants/GlobalStyles";

const { width, height } = Dimensions.get("window");

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
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null); // Selected search result/destination

  // State for routes and navigation
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null); // Currently displayed route's info
  const [routeOptions, setRouteOptions] = useState([]); // Multiple route options
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [isNavigationMode, setIsNavigationMode] = useState(false); // True when actual navigation starts
  const [directions, setDirections] = useState([]);
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);

  // State for safety features
  const [safetyReviews, setSafetyReviews] = useState([]);
  const [dangerousAreas, setDangerousAreas] = useState([]);
  const [safeRouteOnly, setSafeRouteOnly] = useState(true); // User preference for safe routes
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewLocation, setReviewLocation] = useState(null); // Location for new review

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
  const [showBottomSheet, setShowBottomSheet] = useState(false); // State to control bottom sheet visibility

  // Define Google Places API Key
  const GOOGLE_PLACES_API_KEY =
    Constants.expoConfig?.extra?.googlePlacesApiKey ||
    Constants.expoConfig?.android?.config?.googleMaps?.apiKey || // Fallback for Android
    Constants.expoConfig?.ios?.config?.googleMapsApiKey; // Fallback for iOS

  // --- Effects ---
  useEffect(() => {
    getCurrentLocation();
    loadSafetyData();
  }, []);

  // Effect to update map region when location changes and show instruction
  useEffect(() => {
    if (location) {
      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
      // Show instruction after map is ready, hide after a delay
      const timer = setTimeout(() => {
        setShowLongPressInstruction(true);
      }, 2000); // Show after 2 seconds
      const hideTimer = setTimeout(() => {
        setShowLongPressInstruction(false);
      }, 8000); // Hide after 8 seconds
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

      // Reverse geocode to get current city/region name (still useful for display or future features)
      const reverseGeocode = await Location.reverseGeocodeAsync(
        currentLocation.coords
      );
      if (reverseGeocode && reverseGeocode.length > 0) {
        const { city, administrativeArea } = reverseGeocode[0];
        if (city) {
          setCurrentRegionName(city);
        } else if (administrativeArea) {
          setCurrentRegionName(administrativeArea); // Fallback to state/province
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to get current location. Please try again.");
    }
  };

  /**
   * Loads mock safety review data. In a real app, this would fetch from a database.
   */
  const loadSafetyData = () => {
    // Mock data for demonstration purposes
    const mockReviews = [
      {
        id: 1,
        latitude: 28.6139,
        longitude: 77.209,
        rating: 2,
        comment: "Poor lighting at night, avoid after dark",
        category: "lighting",
        timestamp: Date.now() - 86400000,
        userId: "user1",
      },
      {
        id: 2,
        latitude: 28.6129,
        longitude: 77.208,
        rating: 1,
        comment: "Frequent harassment reports, very unsafe area",
        category: "harassment",
        timestamp: Date.now() - 172800000,
        userId: "user2",
      },
      {
        id: 3,
        latitude: 28.6149,
        longitude: 77.21,
        rating: 5,
        comment: "Well-lit, lots of people, feels very safe",
        category: "general",
        timestamp: Date.now() - 259200000,
        userId: "user3",
      },
      {
        id: 4,
        latitude: 28.6159,
        longitude: 77.211,
        rating: 4,
        comment: "Good area with security cameras",
        category: "security",
        timestamp: Date.now() - 345600000,
        userId: "user4",
      },
      {
        id: 5,
        latitude: 28.6165,
        longitude: 77.2075,
        rating: 1,
        comment: "Narrow street, often deserted, feels risky.",
        category: "general",
        timestamp: Date.now() - 518400000,
        userId: "user5",
      },
      {
        id: 6,
        latitude: 28.6105,
        longitude: 77.212,
        rating: 5,
        comment: "Police patrol frequently, very safe.",
        category: "security",
        timestamp: Date.now() - 604800000,
        userId: "user6",
      },
      // Adding a new mock dangerous review near the Ibrahimganj area (Bhopal)
      // Adjust these coordinates based on where your test route actually passes through
      {
        id: 7,
        latitude: 23.2681, // Close to the coordinate in your screenshot
        longitude: 77.4049, // Close to the coordinate in your screenshot
        rating: 1, // Very unsafe
        comment: "Test: Extremely dangerous area, avoid at all costs!",
        category: "crime",
        timestamp: Date.now(),
        userId: "test_user_dangerous",
      },
      {
        id: 8,
        latitude: 23.275, // Another point near Bhopal, slightly different
        longitude: 77.415,
        rating: 2, // Unsafe
        comment: "Test: Caution advised, poor visibility at night.",
        category: "lighting",
        timestamp: Date.now(),
        userId: "test_user_caution",
      },
    ];

    setSafetyReviews(mockReviews);

    // Identify dangerous areas (rating <= 2) based on mock reviews
    const dangerous = mockReviews
      .filter((review) => review.rating <= 2)
      .map((review) => ({
        latitude: review.latitude,
        longitude: review.longitude,
        radius: 500, // 500 meters radius for dangerous areas
        severity: review.rating,
      }));

    setDangerousAreas(dangerous);
  };

  /**
   * Submits a new safety review. In a real app, this would send data to a backend.
   * @param {number} latitude
   * @param {number} longitude
   * @param {number} rating
   * @param {string} comment
   * @param {string} category
   */
  const submitSafetyReview = useCallback(
    (latitude, longitude, rating, comment, category) => {
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

  /**
   * Searches for places using Google Places API (Text Search).
   * Prioritizes results near the current location.
   * @param {string} query
   */
  const searchPlaces = async (query) => {
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
          .map((place, index) => ({
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
        setShowSearchResults(true); // Show empty results
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

  /**
   * Handles selection of a search result.
   * @param {object} result
   */
  const selectSearchResult = (result) => {
    setSearchQuery(result.title);
    setShowSearchResults(false);
    setSelectedLocation(result);
    animateBottomSheet(true); // Show bottom sheet
    mapRef.current?.animateToRegion({
      latitude: result.coordinate.latitude,
      longitude: result.coordinate.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  // --- Bottom Sheet Animation ---

  /**
   * Animates the bottom sheet in or out.
   * @param {boolean} show
   */
  const animateBottomSheet = (show) => {
    Animated.timing(bottomSheetAnim, {
      toValue: show ? 1 : 0,
      duration: 300,
      useNativeDriver: false, // Set to true if not animating layout properties
    }).start(() => {
      if (!show) setShowBottomSheet(false); // Hide after animation completes
    });
    if (show) setShowBottomSheet(true); // Show immediately
  };

  // --- Route Calculation and Safety Analysis ---

  /**
   * Decodes an encoded polyline string into an array of coordinates.
   * @param {string} encoded
   * @returns {Array<object>} Array of {latitude, longitude} objects.
   */
  const decodePolyline = (encoded) => {
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
  const calculateDistance = (origin, destination) => {
    const R = 6371; // Earth's radius in km
    const deg2rad = (deg) => deg * (Math.PI / 180);

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
    (latitude, longitude, radius = 500) => {
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
    (coordinates) => {
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
  const getSafetyColor = (safetyStatus) => {
    switch (safetyStatus) {
      case "dangerous":
        return GlobalStyles.colors.danger; // Red
      case "caution":
        return GlobalStyles.colors.warning; // Orange
      case "safe":
        return GlobalStyles.colors.success; // Green
      case "unreviewed":
        return GlobalStyles.colors.info; // Blue
      default:
        return GlobalStyles.colors.info;
    }
  };

  /**
   * Fetches multiple route options from Google Directions API, including alternatives
   * and routes avoiding certain features, then analyzes their safety.
   * @param {object} origin - {latitude, longitude}
   * @param {object} destination - {latitude, longitude}
   * @returns {Array<object>} Sorted array of route objects with safety analysis.
   */
  const getMultipleGoogleRoutes = async (origin, destination) => {
    const API_KEY =
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
      const directions = leg.steps.map((step) => ({
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
    const uniqueRoutes = [];
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
      const aSafety = safetyPriority[a.safety.overall];
      const bSafety = safetyPriority[b.safety.overall];

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
    mapRef.current?.animateToRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    });
  };

  /**
   * Selects a different route option from the available list.
   * @param {number} routeIndex
   */
  const selectRouteOption = (routeIndex) => {
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
        {/* Search Bar */}
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
          routeColor={routeInfo?.color || GlobalStyles.colors.primary}
          onLongPress={(event) => {
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
