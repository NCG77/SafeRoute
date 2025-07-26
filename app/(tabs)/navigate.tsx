// SafeMaps.js (Main Application Component - formerly App.js)
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
import LoadingOverlay from "../../components/maps/LoadingOverlay";
import MapDisplay from "../../components/maps/MapDisplay";
import NavigationHeader from "../../components/maps/NavigationHeader";
import RouteOptionsDisplay from "../../components/maps/RouteOptionDisplay"; // Corrected typo: RouteOptionDisplay -> RouteOptionsDisplay
import SafetyReviewModal from "../../components/maps/SafetyReviewModal";
import SearchBar from "../../components/maps/SearchBar";

// Global styles for consistency
import { GlobalStyles } from "../../constants/GlobalStyles";

const { width, height } = Dimensions.get("window");

const SafeMaps = () => {
  // State for location and map
  const [location, setLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState(null); // To control map's visible region
  const mapRef = useRef(null);

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
  const [isNavigationMode, setIsNavigationMode] = useState(false);
  const [directions, setDirections] = useState([]);
  const [showDirectionsModal, setShowDirectionsModal] = useState(false);

  // State for safety features
  const [safetyReviews, setSafetyReviews] = useState([]);
  const [dangerousAreas, setDangerousAreas] = useState([]);
  const [safeRouteOnly, setSafeRouteOnly] = useState(true); // User preference for safe routes
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewLocation, setReviewLocation] = useState(null); // Location for new review

  // Animation for bottom sheet
  const bottomSheetAnim = useRef(new Animated.Value(0)).current;
  const [showBottomSheet, setShowBottomSheet] = useState(false); // State to control bottom sheet visibility

  // --- Effects ---
  useEffect(() => {
    getCurrentLocation();
    loadSafetyData();
  }, []);

  // Effect to update map region when location changes
  useEffect(() => {
    if (location) {
      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    }
  }, [location]);

  // --- Location and Safety Data Management ---

  /**
   * Fetches the current device location and requests permissions.
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
    } catch (error) {
      console.error("Error getting current location:", error);
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
   * Searches for places using Expo's Location.geocodeAsync.
   * @param {string} query
   */
  const searchPlaces = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const results = await Location.geocodeAsync(query);
      const formattedResults = results.slice(0, 5).map((result, index) => ({
        id: `${result.latitude}-${result.longitude}-${index}`, // Unique ID for key prop
        title: result.city || result.name || query, // Use city/name if available
        subtitle: `${result.street || ""} ${result.postalCode || ""}`, // More descriptive subtitle
        coordinate: {
          latitude: result.latitude,
          longitude: result.longitude,
        },
      }));

      setSearchResults(formattedResults);
      setShowSearchResults(true);
    } catch (error) {
      console.error("Search error:", error);
      Alert.alert("Search Error", "Could not find places. Please try again.");
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
    (latitude, longitude, radius = 200) => {
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

      // Analyze every 10th coordinate for performance
      for (let i = 0; i < coordinates.length; i += 10) {
        const coord = coordinates[i];
        const safety = getAreaSafetyScore(coord.latitude, coord.longitude, 100); // 100m radius for segment check

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
      if (dangerPercentage > 30) overallSafety = "dangerous";
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
        color: getSafetyColor(safetyAnalysis.overall),
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
   * Main function to calculate the safest route.
   * @param {object} origin - {latitude, longitude}
   * @param {object} destination - {latitude, longitude}
   */
  const calculateRealRoute = async (origin, destination) => {
    setIsCalculatingRoute(true);
    setRouteOptions([]); // Clear previous options
    setRouteCoordinates([]);
    setRouteInfo(null);
    setDirections([]);
    setSelectedRouteIndex(0);

    try {
      console.log("Calculating safe routes...");
      const routes = await getMultipleGoogleRoutes(origin, destination);

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

      console.log("Selected route with safety analysis:", selectedRoute.safety);

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
    }
  };

  // --- Navigation Controls ---

  /**
   * Initiates navigation based on the selected location.
   */
  const startNavigation = () => {
    if (!location || !selectedLocation) {
      Alert.alert("Error", "Please select a destination first.");
      return;
    }

    calculateRealRoute(
      {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      },
      selectedLocation.coordinate
    );

    setIsNavigationMode(true);
    animateBottomSheet(false); // Hide bottom sheet
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
          }}
          onMyLocationPress={getCurrentLocation}
        />

        {/* Loading Overlay for route calculation */}
        <LoadingOverlay
          isVisible={isCalculatingRoute}
          message="Finding safest route..."
          subMessage="Avoiding dangerous areas"
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
          onStartNavigation={startNavigation} // This button is already in BottomSheet, but kept for consistency if needed here
          safeRouteOnly={safeRouteOnly}
          onToggleSafeRouteOnly={() => setSafeRouteOnly((prev) => !prev)}
        />

        {/* Bottom Sheet for selected location details */}
        <BottomSheet
          showBottomSheet={showBottomSheet}
          bottomSheetAnim={bottomSheetAnim}
          selectedLocation={selectedLocation}
          onStartNavigation={startNavigation}
          onClose={() => animateBottomSheet(false)} // Close bottom sheet
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
      </SafeAreaView>
    </>
  );
};

export default SafeMaps;
