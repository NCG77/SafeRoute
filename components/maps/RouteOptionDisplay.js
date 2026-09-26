// components/maps/RouteOptionsDisplay.js
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
<<<<<<< HEAD
import { GlobalStyles } from "../../constants/GlobalStyles";
=======
import { useAppTheme } from "@/hooks/useAppTheme";
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
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
<<<<<<< HEAD
=======
  const { colors: c, elevation: elev } = useAppTheme();
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  if (!isVisible || routeOptions.length === 0) return null;

  const currentRoute = routeOptions[selectedRouteIndex];

  return (
<<<<<<< HEAD
    <View style={styles.routeOptionsContainer}>
=======
    <View
      style={[
        styles.routeOptionsContainer,
        { backgroundColor: c.surface, ...elev.sheet },
      ]}
    >
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
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
<<<<<<< HEAD
              index === selectedRouteIndex && styles.selectedRouteOption,
              { borderColor: route.color }, // Border color based on route safety
=======
              {
                backgroundColor: c.backgroundLight,
                borderColor: route.color,
              },
              index === selectedRouteIndex && {
                backgroundColor: c.backgroundSelected,
                borderColor: c.primary,
              },
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
            ]}
            onPress={() => onSelectRoute(index)}
          >
            <View style={styles.routeOptionHeader}>
              <Text
                style={[
                  styles.routeOptionTime,
<<<<<<< HEAD
                  index === selectedRouteIndex && styles.selectedRouteText,
=======
                  { color: c.textPrimary },
                  index === selectedRouteIndex && { color: c.primary },
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
                ]}
              >
                {route.duration} min
              </Text>
              <View
                style={[styles.safetyBadge, { backgroundColor: route.color }]}
              >
                <Text style={styles.safetyBadgeText}>
<<<<<<< HEAD
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
=======
                  {Number.isFinite(route.safety?.score)
                    ? Math.round(route.safety.score)
                    : "–"}
                </Text>
              </View>
            </View>
            <Text style={[styles.routeOptionTitle, { color: c.textPrimary }]}>
              {route.title}
            </Text>
            <Text
              style={[
                styles.routeOptionDescription,
                { color: c.textSecondary },
              ]}
            >
              {route.distance.toFixed(1)} km
            </Text>
            <Text style={[styles.safetyInfo, { color: route.color }]}>
              {Number.isFinite(route.safety?.score)
                ? `Safety ${Math.round(route.safety.score)}`
                : "Unreviewed"}
            </Text>
            <Text
              style={[
                styles.routeOptionDescription,
                { color: c.textSecondary },
              ]}
            >
              {route.safety?.crowd == null
                ? "Crowd —"
                : `Crowd ${Math.round(route.safety.crowd * 100)}`}
              {" · "}
              {route.safety?.lighting == null
                ? "Light —"
                : `Light ${Math.round(route.safety.lighting * 100)}`}
            </Text>
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Action Buttons for Selected Route */}
      {currentRoute && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
<<<<<<< HEAD
            style={styles.directionsButton}
=======
            style={[styles.directionsButton, { backgroundColor: c.secondary }]}
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
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
<<<<<<< HEAD
          style={styles.recalculateButton}
=======
          style={[styles.recalculateButton, { backgroundColor: c.info }]}
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
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
<<<<<<< HEAD
    backgroundColor: "white",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 30, // Extra padding for bottom safe area
    ...GlobalStyles.shadow,
    maxHeight: "40%", // Limit height
=======
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 30,
    maxHeight: "40%",
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  },
  routeOptionsScrollContent: {
    paddingVertical: 10,
  },
  routeOption: {
<<<<<<< HEAD
    backgroundColor: GlobalStyles.colors.backgroundLight,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 150,
    borderWidth: 2,
<<<<<<< HEAD
    borderColor: "transparent",
    ...GlobalStyles.shadowSmall,
  },
  selectedRouteOption: {
    backgroundColor: GlobalStyles.colors.backgroundSelected,
    borderColor: GlobalStyles.colors.primary, // Default selected border
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
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
<<<<<<< HEAD
    color: GlobalStyles.colors.textPrimary,
  },
  selectedRouteText: {
    color: GlobalStyles.colors.primary,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  },
  routeOptionTitle: {
    fontSize: 14,
    fontWeight: "500",
<<<<<<< HEAD
    color: GlobalStyles.colors.textPrimary,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    marginTop: 2,
  },
  routeOptionDescription: {
    fontSize: 12,
<<<<<<< HEAD
    color: GlobalStyles.colors.textSecondary,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
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
<<<<<<< HEAD
    backgroundColor: GlobalStyles.colors.secondary,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
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
<<<<<<< HEAD
    backgroundColor: GlobalStyles.colors.success, // Default green
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
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
<<<<<<< HEAD
    // NEW STYLE
    backgroundColor: GlobalStyles.colors.info, // Blue color
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
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
