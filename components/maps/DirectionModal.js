// components/DirectionsModal.js
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GlobalStyles } from "../../constants/GlobalStyles";

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
  if (!showDirectionsModal) return null;

  return (
    <Modal
      visible={showDirectionsModal}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
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
                  </Text>
                </View>
              </View>
            ))}
            {directions.length === 0 && (
              <Text style={styles.noDirectionsText}>
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
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    minHeight: "40%",
  },
  directionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: GlobalStyles.colors.lightGray,
  },
  directionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: GlobalStyles.colors.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: GlobalStyles.colors.lightGray,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 16,
    color: GlobalStyles.colors.textSecondary,
  },
  directionsScrollView: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  routeSummary: {
    padding: 16,
    backgroundColor: GlobalStyles.colors.backgroundLight,
    borderRadius: 8,
    marginHorizontal: 10,
    marginBottom: 10,
  },
  routeSummaryText: {
    fontSize: 16,
    fontWeight: "bold",
    color: GlobalStyles.colors.textPrimary,
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
    borderBottomColor: GlobalStyles.colors.border,
    alignItems: "flex-start",
  },
  stepIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: GlobalStyles.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    flexShrink: 0, // Prevent shrinking
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
    color: GlobalStyles.colors.textPrimary,
    fontWeight: "500",
  },
  stepDetails: {
    fontSize: 14,
    color: GlobalStyles.colors.textSecondary,
    marginTop: 4,
  },
  noDirectionsText: {
    textAlign: "center",
    padding: 20,
    color: GlobalStyles.colors.textSecondary,
    fontSize: 16,
  },
});

export default DirectionsModal;
