// components/SafetyToggle.js
<<<<<<< HEAD
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GlobalStyles } from "../../constants/GlobalStyles";

/**
 * SafetyToggle Component
 * A toggle switch to enable/disable the "Safe Route Only" preference.
 *
 * Props:
 * - safeRouteOnly: Boolean indicating the current state of the toggle.
 * - onToggle: Function to call when the toggle is pressed.
 */
const SafetyToggle = ({ safeRouteOnly, onToggle }) => {
  return (
    <View style={styles.safetyToggleContainer}>
      <Text style={styles.safetyToggleLabel}>Prioritize Safe Routes</Text>
      <TouchableOpacity
        style={[
          styles.safetyToggle,
          safeRouteOnly && styles.safetyToggleActive,
=======
import { useAppTheme } from "@/hooks/useAppTheme";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const SafetyToggle = ({ safeRouteOnly, onToggle }) => {
  const { colors: c } = useAppTheme();
  return (
    <View style={styles.safetyToggleContainer}>
      <Text style={[styles.safetyToggleLabel, { color: c.textPrimary }]}>
        Prioritize Safe Routes
      </Text>
      <TouchableOpacity
        style={[
          styles.safetyToggle,
          { backgroundColor: c.surfaceVariant },
          safeRouteOnly && { backgroundColor: c.success },
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
        ]}
        onPress={onToggle}
      >
        <Text
          style={[
            styles.safetyToggleText,
<<<<<<< HEAD
=======
            { color: c.textSecondary },
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
            safeRouteOnly && styles.safetyToggleTextActive,
          ]}
        >
          {safeRouteOnly ? "ON" : "OFF"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  safetyToggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  safetyToggleLabel: {
    fontSize: 16,
    fontWeight: "600",
<<<<<<< HEAD
    color: GlobalStyles.colors.textPrimary,
  },
  safetyToggle: {
    backgroundColor: GlobalStyles.colors.lightGray,
=======
  },
  safetyToggle: {
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
<<<<<<< HEAD
  safetyToggleActive: {
    backgroundColor: GlobalStyles.colors.success,
  },
  safetyToggleText: {
    fontSize: 12,
    fontWeight: "bold",
    color: GlobalStyles.colors.textSecondary,
=======
  safetyToggleText: {
    fontSize: 12,
    fontWeight: "bold",
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  },
  safetyToggleTextActive: {
    color: "white",
  },
});

export default SafetyToggle;
