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
import { GlobalStyles } from "../../constants/GlobalStyles";

const { height } = Dimensions.get("window");

/**
 * BottomSheet Component
 * Displays details about a selected location and provides actions.
 *
 * Props:
 * - showBottomSheet: Boolean to control visibility.
 * - bottomSheetAnim: Animated value for controlling slide-up animation.
 * - selectedLocation: Object containing location details (title, subtitle).
 * - onStartNavigation: Function to initiate navigation to the selected location.
 * - onClose: Function to close the bottom sheet.
 */
const BottomSheet = ({
  showBottomSheet,
  bottomSheetAnim,
  selectedLocation,
  onStartNavigation,
  onClose,
}) => {
  return (
    <Animated.View
      style={[
        styles.bottomSheet,
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
      <TouchableOpacity style={styles.bottomSheetHandle} onPress={onClose} />
      <View style={styles.bottomSheetContent}>
        {/* Use optional chaining for selectedLocation properties to prevent errors if it's temporarily null */}
        <Text style={styles.bottomSheetTitle}>{selectedLocation?.title}</Text>
        <Text style={styles.bottomSheetSubtitle}>
          {selectedLocation?.subtitle}
        </Text>

        <View style={styles.bottomSheetActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onStartNavigation}
          >
            <Text style={styles.actionButtonText}>🛡️</Text>
            <Text style={styles.actionButtonLabel}>Safe Route</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>📞</Text>
            <Text style={styles.actionButtonLabel}>Call</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>💾</Text>
            <Text style={styles.actionButtonLabel}>Save</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>📤</Text>
            <Text style={styles.actionButtonLabel}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bottomSheet: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    ...GlobalStyles.shadow,
    paddingBottom: 20, // Add padding for safe area on iOS
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: GlobalStyles.colors.lightGray,
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
    color: GlobalStyles.colors.textPrimary,
    marginTop: 8,
  },
  bottomSheetSubtitle: {
    fontSize: 14,
    color: GlobalStyles.colors.textSecondary,
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
    color: GlobalStyles.colors.textSecondary,
  },
});

export default BottomSheet;
