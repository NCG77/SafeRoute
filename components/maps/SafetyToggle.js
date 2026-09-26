// components/SafetyToggle.js
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
        ]}
        onPress={onToggle}
      >
        <Text
          style={[
            styles.safetyToggleText,
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
    color: GlobalStyles.colors.textPrimary,
  },
  safetyToggle: {
    backgroundColor: GlobalStyles.colors.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  safetyToggleActive: {
    backgroundColor: GlobalStyles.colors.success,
  },
  safetyToggleText: {
    fontSize: 12,
    fontWeight: "bold",
    color: GlobalStyles.colors.textSecondary,
  },
  safetyToggleTextActive: {
    color: "white",
  },
});

export default SafetyToggle;
