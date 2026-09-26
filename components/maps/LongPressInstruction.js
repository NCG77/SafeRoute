// components/maps/LongPressInstruction.js
import { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { GlobalStyles } from "../../constants/GlobalStyles";

/**
 * LongPressInstruction Component
 * Displays a temporary, dismissible instruction for long-pressing to add reviews.
 *
 * Props:
 * - isVisible: Boolean to control visibility.
 * - onClose: Function to call when the instruction should be dismissed.
 */
const LongPressInstruction = ({ isVisible, onClose }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current; // Initial value for opacity: 0

  useEffect(() => {
    if (isVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500, // Fade in duration
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500, // Fade out duration
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible, fadeAnim]);

  if (!isVisible) {
    return null; // Don't render anything if not visible
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.text}>
        💡 Long-press on the map to add a safety review!
      </Text>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === "ios" ? 100 : 70, // Position below search bar
    left: 20,
    right: 20,
    backgroundColor: GlobalStyles.colors.info, // Blue background
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...GlobalStyles.shadow,
    zIndex: 20, // Above search results but below modals
  },
  text: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1, // Allow text to wrap
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
