// constants/GlobalStyles.js
import { StyleSheet } from "react-native";

export const GlobalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#333333", // Darker background for loading
  },
  loadingText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  loadingSubtext: {
    fontSize: 16,
    color: "#cccccc",
    marginTop: 5,
    textAlign: "center",
  },
  shadow: {
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
