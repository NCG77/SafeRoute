// components/DirectionsModal.js
import {
  Modal,
  ScrollView,
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

/**
 * DirectionsModal Component
 * Displays turn-by-turn directions for a selected route in a modal.
 *
 * Props:
 * - showDirectionsModal: Boolean to control modal visibility.
 * - directions: Array of direction step objects ({instruction, distance, duration}).
 * - routeInfo: Object containing overall route information (e.g., title, total distance/duration).
 * - onClose: Function to close the modal.
 */
const DirectionsModal = ({
  showDirectionsModal,
  directions,
  routeInfo,
  onClose,
}) => {
<<<<<<< HEAD
=======
  const { colors: c } = useAppTheme();
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  if (!showDirectionsModal) return null;

  return (
    <Modal
      visible={showDirectionsModal}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
<<<<<<< HEAD
        <View style={styles.directionsModal}>
          <View style={styles.directionsHeader}>
            <Text style={styles.directionsTitle}>Turn-by-turn directions</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.directionsScrollView}>
            {routeInfo && (
              <View style={styles.routeSummary}>
                <Text style={styles.routeSummaryText}>
=======
        <View style={[styles.directionsModal, { backgroundColor: c.surface }]}>
          <View
            style={[styles.directionsHeader, { borderBottomColor: c.border }]}
          >
            <Text style={[styles.directionsTitle, { color: c.textPrimary }]}>
              Turn-by-turn directions
            </Text>
            <TouchableOpacity
              style={[
                styles.closeButton,
                { backgroundColor: c.surfaceVariant },
              ]}
              onPress={onClose}
            >
              <Text
                style={[styles.closeButtonText, { color: c.textSecondary }]}
              >
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.directionsScrollView}
            contentContainerStyle={{ paddingBottom: 24 }}
            nestedScrollEnabled
          >
            {routeInfo && (
              <View
                style={[
                  styles.routeSummary,
                  { backgroundColor: c.backgroundLight },
                ]}
              >
                <Text
                  style={[styles.routeSummaryText, { color: c.textPrimary }]}
                >
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
                  Total: {routeInfo.description}
                </Text>
                <Text
                  style={[
                    styles.routeSummarySafety,
                    { color: routeInfo.color },
                  ]}
                >
                  Safety: {routeInfo.safety?.overall || "Unknown"}
                </Text>
              </View>
            )}
            {directions.map((direction, index) => (
<<<<<<< HEAD
              <View key={index} style={styles.directionStep}>
                <View style={styles.stepIndicator}>
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepInstruction}>
                    {direction.instruction}
                  </Text>
                  <Text style={styles.stepDetails}>
                    {direction.distance}{" "}
                    {direction.duration && `• ${direction.duration}`}
=======
              <View
                key={index}
                style={[styles.directionStep, { borderBottomColor: c.border }]}
              >
                <View
                  style={[styles.stepIndicator, { backgroundColor: c.primary }]}
                >
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text
                    style={[styles.stepInstruction, { color: c.textPrimary }]}
                  >
                    {direction.instruction}
                  </Text>
                  <Text
                    style={[styles.stepDetails, { color: c.textSecondary }]}
                  >
                    {direction.distanceMeters != null
                      ? `${Math.round(direction.distanceMeters)} m`
                      : direction.distance || ""}
                    {direction.durationSeconds != null
                      ? ` • ${Math.max(1, Math.round(direction.durationSeconds / 60))} min`
                      : direction.duration
                        ? ` • ${direction.duration}`
                        : ""}
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
                  </Text>
                </View>
              </View>
            ))}
            {directions.length === 0 && (
<<<<<<< HEAD
              <Text style={styles.noDirectionsText}>
=======
              <Text
                style={[styles.noDirectionsText, { color: c.textSecondary }]}
              >
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
                No detailed directions available for this route.
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  directionsModal: {
<<<<<<< HEAD
    backgroundColor: "white",
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    minHeight: "40%",
<<<<<<< HEAD
=======
    flexGrow: 1,
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  },
  directionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
<<<<<<< HEAD
    borderBottomColor: GlobalStyles.colors.lightGray,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  },
  directionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
<<<<<<< HEAD
    color: GlobalStyles.colors.textPrimary,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
<<<<<<< HEAD
    backgroundColor: GlobalStyles.colors.lightGray,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 16,
<<<<<<< HEAD
    color: GlobalStyles.colors.textSecondary,
  },
  directionsScrollView: {
=======
  },
  directionsScrollView: {
    flex: 1,
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  routeSummary: {
    padding: 16,
<<<<<<< HEAD
    backgroundColor: GlobalStyles.colors.backgroundLight,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    borderRadius: 8,
    marginHorizontal: 10,
    marginBottom: 10,
  },
  routeSummaryText: {
    fontSize: 16,
    fontWeight: "bold",
<<<<<<< HEAD
    color: GlobalStyles.colors.textPrimary,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  },
  routeSummarySafety: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  directionStep: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
<<<<<<< HEAD
    borderBottomColor: GlobalStyles.colors.border,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    alignItems: "flex-start",
  },
  stepIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
<<<<<<< HEAD
    backgroundColor: GlobalStyles.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    flexShrink: 0, // Prevent shrinking
=======
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    flexShrink: 0,
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  },
  stepNumber: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  stepContent: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: 16,
<<<<<<< HEAD
    color: GlobalStyles.colors.textPrimary,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    fontWeight: "500",
  },
  stepDetails: {
    fontSize: 14,
<<<<<<< HEAD
    color: GlobalStyles.colors.textSecondary,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    marginTop: 4,
  },
  noDirectionsText: {
    textAlign: "center",
    padding: 20,
<<<<<<< HEAD
    color: GlobalStyles.colors.textSecondary,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    fontSize: 16,
  },
});

export default DirectionsModal;
