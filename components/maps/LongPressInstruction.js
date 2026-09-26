// components/maps/LongPressInstruction.js
import { useEffect, useRef } from "react";
<<<<<<< HEAD
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { GlobalStyles } from "../../constants/GlobalStyles";
=======
import { Animated, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";

/** Matches SearchBar: top inset + 8, then ~52px field height */
const SEARCH_BAR_OFFSET = 8;
const SEARCH_BAR_HEIGHT = 52;
const GAP_BELOW_SEARCH = 12;
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3

/**
 * LongPressInstruction Component
 * Displays a temporary, dismissible instruction for long-pressing to add reviews.
<<<<<<< HEAD
=======
 * Sits below the map search bar so the two never overlap.
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
 *
 * Props:
 * - isVisible: Boolean to control visibility.
 * - onClose: Function to call when the instruction should be dismissed.
 */
const LongPressInstruction = ({ isVisible, onClose }) => {
<<<<<<< HEAD
  const fadeAnim = useRef(new Animated.Value(0)).current; // Initial value for opacity: 0
=======
  const { colors: c, elevation: elev } = useAppTheme();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3

  useEffect(() => {
    if (isVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
<<<<<<< HEAD
        duration: 500, // Fade in duration
=======
        duration: 500,
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
<<<<<<< HEAD
        duration: 500, // Fade out duration
=======
        duration: 500,
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, fadeAnim]);

  if (!isVisible) {
<<<<<<< HEAD
    return null; // Don't render anything if not visible
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.text}>
        💡 Long-press on the map to add a safety review!
      </Text>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
=======
    return null;
  }

  const top =
    Math.max(insets.top, 12) +
    SEARCH_BAR_OFFSET +
    SEARCH_BAR_HEIGHT +
    GAP_BELOW_SEARCH;

  return (
    <Animated.View
      style={[
        styles.container,
        { top, opacity: fadeAnim, backgroundColor: c.info, ...elev.card },
      ]}
    >
      <Text style={styles.text}>
        Long-press on the map to add a safety review
      </Text>
      <TouchableOpacity
        onPress={onClose}
        style={styles.closeButton}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Dismiss tip"
      >
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
<<<<<<< HEAD
    top: Platform.OS === "ios" ? 100 : 70, // Position below search bar
    left: 20,
    right: 20,
    backgroundColor: GlobalStyles.colors.info, // Blue background
=======
    left: 20,
    right: 20,
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
<<<<<<< HEAD
    ...GlobalStyles.shadow,
    zIndex: 20, // Above search results but below modals
=======
    zIndex: 20,
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  },
  text: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
<<<<<<< HEAD
    flexShrink: 1, // Allow text to wrap
=======
    flexShrink: 1,
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    marginRight: 10,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default LongPressInstruction;
