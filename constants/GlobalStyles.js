<<<<<<< HEAD
// constants/GlobalStyles.js
import { StyleSheet } from "react-native";

export const GlobalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
=======
// constants/GlobalStyles.js — re-exports SafeRoute 2.0 tokens for map/legacy screens
import { StyleSheet } from "react-native";
import { colors as tokens, elevation } from "./theme";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.background,
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
<<<<<<< HEAD
    backgroundColor: "#333333", // Darker background for loading
=======
    backgroundColor: tokens.charcoal,
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  },
  loadingText: {
    fontSize: 20,
    fontWeight: "bold",
<<<<<<< HEAD
    color: "white",
=======
    color: tokens.textOnPrimary,
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    textAlign: "center",
  },
  loadingSubtext: {
    fontSize: 16,
<<<<<<< HEAD
    color: "#cccccc",
=======
    color: tokens.textTertiary,
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    marginTop: 5,
    textAlign: "center",
  },
  shadow: {
<<<<<<< HEAD
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 8,
  },
  shadowSmall: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
});

GlobalStyles.colors = {
  primary: "#4285F4", // Google Blue
  secondary: "#673AB7", // Deep Purple
  success: "#4CAF50", // Green
  warning: "#FFC107", // Amber/Gold
  danger: "#FF4444", // Red
  info: "#2196F3", // Light Blue
  textPrimary: "#333333",
  textSecondary: "#666666",
  textLight: "#dddddd",
  backgroundLight: "#f8f9fa",
  backgroundSelected: "#E3F2FD", // Light blue for selected items
  lightGray: "#f0f0f0",
  border: "#dddddd",
};
=======
    ...elevation.card,
  },
  shadowSmall: {
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
});

/** @type {typeof tokens} */
const colors = tokens;

export const GlobalStyles = Object.assign(styles, { colors });
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
