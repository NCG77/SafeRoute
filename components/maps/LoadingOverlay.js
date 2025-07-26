// components/LoadingOverlay.js
import { StyleSheet, Text, View } from "react-native";
import { GlobalStyles } from "../../constants/GlobalStyles";

/**
 * LoadingOverlay Component
 * Displays a full-screen overlay with a loading message.
 *
 * Props:
 * - isVisible: Boolean to control visibility.
 * - message: Main loading message.
 * - subMessage: Secondary loading message.
 */
const LoadingOverlay = ({ isVisible, message, subMessage }) => {
  if (!isVisible) return null;

  return (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingContent}>
        <Text style={styles.loadingText}>{message}</Text>
        {subMessage && <Text style={styles.loadingSubText}>{subMessage}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)", // Semi-transparent black
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100, // Ensure it's on top
  },
  loadingContent: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 10,
    alignItems: "center",
    ...GlobalStyles.shadow,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  loadingSubText: {
    fontSize: 14,
    color: GlobalStyles.colors.textLight,
    textAlign: "center",
    marginTop: 5,
  },
});

export default LoadingOverlay;
