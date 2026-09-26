// components/LoadingOverlay.js
<<<<<<< HEAD
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
=======
import { useAppTheme } from "@/hooks/useAppTheme";
import { StyleSheet, Text, View } from "react-native";

const LoadingOverlay = ({ isVisible, message, subMessage }) => {
  const { colors: c, elevation: elev } = useAppTheme();
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  if (!isVisible) return null;

  return (
    <View style={styles.loadingOverlay}>
<<<<<<< HEAD
      <View style={styles.loadingContent}>
        <Text style={styles.loadingText}>{message}</Text>
        {subMessage && <Text style={styles.loadingSubText}>{subMessage}</Text>}
=======
      <View style={[styles.loadingContent, elev.card]}>
        <Text style={styles.loadingText}>{message}</Text>
        {subMessage && (
          <Text style={[styles.loadingSubText, { color: c.textLight }]}>
            {subMessage}
          </Text>
        )}
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
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
<<<<<<< HEAD
    backgroundColor: "rgba(0, 0, 0, 0.6)", // Semi-transparent black
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100, // Ensure it's on top
=======
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  },
  loadingContent: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 30,
    paddingVertical: 20,
    borderRadius: 10,
    alignItems: "center",
<<<<<<< HEAD
    ...GlobalStyles.shadow,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  loadingSubText: {
    fontSize: 14,
<<<<<<< HEAD
    color: GlobalStyles.colors.textLight,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    textAlign: "center",
    marginTop: 5,
  },
});

export default LoadingOverlay;
