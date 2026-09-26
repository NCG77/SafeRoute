// components/maps/BottomSheet.js
import React from "react";
import {
  Animated,
  Dimensions,
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

const { height } = Dimensions.get("window");

/**
 * BottomSheet Component
 * Displays details about a selected location and provides actions.
 *
 * Props:
 * - showBottomSheet: Boolean to control visibility.
 * - bottomSheetAnim: Animated value for controlling slide-up animation.
 * - selectedLocation: Object containing location details (title, subtitle, coordinate).
 * - onStartNavigation: Function to initiate navigation to the selected location.
 * - onSaveLocation: Function to save the selected location. (NEW)
 * - onShareLocation: Function to share the user's current location. (NEW)
 * - onClose: Function to close the bottom sheet.
 */
const BottomSheet = ({
  showBottomSheet,
  bottomSheetAnim,
  selectedLocation,
  onStartNavigation,
  onSaveLocation, // NEW PROP
  onShareLocation, // NEW PROP
  onClose,
}) => {
<<<<<<< HEAD
=======
  const { colors: c, elevation: elev } = useAppTheme();
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  if (showBottomSheet !== true || !selectedLocation) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.bottomSheet,
<<<<<<< HEAD
=======
        { backgroundColor: c.surface, ...elev.sheet },
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
        {
          transform: [
            {
              translateY: bottomSheetAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [height * 0.35, 0], // Slide from below screen to its position
              }),
            },
          ],
        },
      ]}
    >
<<<<<<< HEAD
      <TouchableOpacity style={styles.bottomSheetHandle} onPress={onClose} />
      <View style={styles.bottomSheetContent}>
        <Text style={styles.bottomSheetTitle}>{selectedLocation?.title}</Text>
        <Text style={styles.bottomSheetSubtitle}>
=======
      <TouchableOpacity
        style={[styles.bottomSheetHandle, { backgroundColor: c.border }]}
        onPress={onClose}
      />
      <View style={styles.bottomSheetContent}>
        <Text style={[styles.bottomSheetTitle, { color: c.textPrimary }]}>
          {selectedLocation?.title}
        </Text>
        <Text style={[styles.bottomSheetSubtitle, { color: c.textSecondary }]}>
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
          {selectedLocation?.subtitle}
        </Text>

        <View style={styles.bottomSheetActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onStartNavigation}
          >
            <Text style={styles.actionButtonText}>🛡️</Text>
<<<<<<< HEAD
            <Text style={styles.actionButtonLabel}>Safe Route</Text>
=======
            <Text
              style={[styles.actionButtonLabel, { color: c.textSecondary }]}
            >
              Safe Route
            </Text>
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
          </TouchableOpacity>

          {/* NEW: Save Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onSaveLocation(selectedLocation)}
          >
            <Text style={styles.actionButtonText}>💾</Text>
<<<<<<< HEAD
            <Text style={styles.actionButtonLabel}>Save</Text>
=======
            <Text
              style={[styles.actionButtonLabel, { color: c.textSecondary }]}
            >
              Save
            </Text>
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
          </TouchableOpacity>

          {/* NEW: Share Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onShareLocation}
          >
            <Text style={styles.actionButtonText}>📤</Text>
<<<<<<< HEAD
            <Text style={styles.actionButtonLabel}>Share</Text>
=======
            <Text
              style={[styles.actionButtonLabel, { color: c.textSecondary }]}
            >
              Share
            </Text>
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
          </TouchableOpacity>

          {/* Removed Call button as per your previous instruction */}
          {/* <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>📞</Text>
            <Text style={styles.actionButtonLabel}>Call</Text>
          </TouchableOpacity> */}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bottomSheet: {
    position: "absolute",
    bottom: 70,
    left: 0,
    right: 0,
<<<<<<< HEAD
    backgroundColor: "white",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    ...GlobalStyles.shadow,
    paddingBottom: 20, // Add padding for safe area on iOS
=======
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
<<<<<<< HEAD
    backgroundColor: GlobalStyles.colors.lightGray,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  bottomSheetContent: {
    paddingHorizontal: 20,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: "bold",
<<<<<<< HEAD
    color: GlobalStyles.colors.textPrimary,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    marginTop: 8,
  },
  bottomSheetSubtitle: {
    fontSize: 14,
<<<<<<< HEAD
    color: GlobalStyles.colors.textSecondary,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    marginTop: 4,
  },
  bottomSheetActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 24,
  },
  actionButton: {
    alignItems: "center",
    padding: 8,
  },
  actionButtonText: {
    fontSize: 24,
    marginBottom: 4,
  },
  actionButtonLabel: {
    fontSize: 12,
<<<<<<< HEAD
    color: GlobalStyles.colors.textSecondary,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  },
});

export default BottomSheet;
