// components/maps/RouteOptionsDisplay.js
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GlobalStyles } from "../../constants/GlobalStyles";
import SafetyToggle from "./SafetyToggle"; // Import the new toggle component

/**
 * RouteOptionsDisplay Component
 * Shows available route options with safety information and allows selection.
 *
 * Props:
 * - isVisible: Boolean to control visibility.
 * - routeOptions: Array of route objects with safety analysis.
 * - selectedRouteIndex: Index of the currently selected route.
 * - onSelectRoute: Function to call when a route option is selected.
 * - onViewDirections: Function to call to view detailed directions.
 * - onStartNavigation: Function to start navigation with the selected route.
 * - onRecalculateRoute: Function to trigger re-calculation of the current route. (NEW)
 * - safeRouteOnly: Boolean indicating if safe route preference is active.
 * - onToggleSafeRouteOnly: Function to toggle the safe route preference.
 */
const RouteOptionsDisplay = ({
  isVisible,
  routeOptions,
  selectedRouteIndex,
  onSelectRoute,
  onViewDirections,
  onStartNavigation,
  onRecalculateRoute, // NEW PROP
  safeRouteOnly,
  onToggleSafeRouteOnly,
}) => {
  if (!isVisible || routeOptions.length === 0) return null;

  const currentRoute = routeOptions[selectedRouteIndex];

  return (
    <View style={styles.routeOptionsContainer}>
      {/* Safety Toggle */}
      <SafetyToggle
        safeRouteOnly={safeRouteOnly}
        onToggle={onToggleSafeRouteOnly}
      />

      {/* Horizontal Scroll for Route Options */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.routeOptionsScrollContent}
      >
        {routeOptions.map((route, index) => (
          <TouchableOpacity
            key={route.id}
            style={[
              styles.routeOption,
              index === selectedRouteIndex && styles.selectedRouteOption,
              { borderColor: route.color }, // Border color based on route safety
            ]}
            onPress={() => onSelectRoute(index)}
          >
            <View style={styles.routeOptionHeader}>
              <Text
                style={[
                  styles.routeOptionTime,
                  index === selectedRouteIndex && styles.selectedRouteText,
                ]}
              >
                {route.duration} min
              </Text>
              <View
                style={[styles.safetyBadge, { backgroundColor: route.color }]}
              >
                <Text style={styles.safetyBadgeText}>
                  {route.safety?.overall === "dangerous"
                    ? "D"
                    : route.safety?.overall === "safe"
                    ? "S"
                    : route.safety?.overall === "caution"
                    ? "C"
                    : "U"}
                </Text>
              </View>
            </View>
            <Text style={styles.routeOptionTitle}>{route.title}</Text>
            <Text style={styles.routeOptionDescription}>
              {route.distance.toFixed(1)} km
            </Text>
            <Text style={[styles.safetyInfo, { color: route.color }]}>
              {route.safety?.overall === "dangerous"
                ? "Unsafe Area"
                : route.safety?.overall === "caution"
                ? "Caution Advised"
                : route.safety?.overall === "safe"
                ? "Very Safe"
                : "Unreviewed"}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Action Buttons for Selected Route */}
      {currentRoute && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.directionsButton}
            onPress={onViewDirections}
          >
            <Text style={styles.directionsButtonText}>View Directions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.startNavigationButton,
              { backgroundColor: currentRoute.color },
            ]}
            onPress={onStartNavigation}
          >
            <Text style={styles.startNavigationText}>Start Navigation</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* NEW: Recalculate Route Button */}
      {onRecalculateRoute && (
        <TouchableOpacity
          style={styles.recalculateButton}
          onPress={onRecalculateRoute}
        >
          <Text style={styles.recalculateButtonText}>Recalculate Route</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  routeOptionsContainer: {
    position: "absolute",
    bottom: 70,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 30, // Extra padding for bottom safe area
    ...GlobalStyles.shadow,
    maxHeight: "40%", // Limit height
  },
  routeOptionsScrollContent: {
    paddingVertical: 10,
  },
  routeOption: {
    backgroundColor: GlobalStyles.colors.backgroundLight,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 150,
    borderWidth: 2,
    borderColor: "transparent",
    ...GlobalStyles.shadowSmall,
  },
  selectedRouteOption: {
    backgroundColor: GlobalStyles.colors.backgroundSelected,
    borderColor: GlobalStyles.colors.primary, // Default selected border
  },
  routeOptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  safetyBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  safetyBadgeText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  routeOptionTime: {
    fontSize: 18,
    fontWeight: "bold",
    color: GlobalStyles.colors.textPrimary,
  },
  selectedRouteText: {
    color: GlobalStyles.colors.primary,
  },
  routeOptionTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: GlobalStyles.colors.textPrimary,
    marginTop: 2,
  },
  routeOptionDescription: {
    fontSize: 12,
    color: GlobalStyles.colors.textSecondary,
    marginTop: 2,
  },
  safetyInfo: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 16,
    justifyContent: "space-between",
  },
  directionsButton: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.secondary,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
    marginRight: 8,
  },
  directionsButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  startNavigationButton: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.success, // Default green
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
    marginLeft: 8,
  },
  startNavigationText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  recalculateButton: {
    // NEW STYLE
    backgroundColor: GlobalStyles.colors.info, // Blue color
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
    width: "100%", // Full width
  },
  recalculateButtonText: {
    // NEW STYLE
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default RouteOptionsDisplay;
