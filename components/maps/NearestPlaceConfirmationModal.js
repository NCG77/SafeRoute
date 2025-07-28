// components/maps/NearestPlaceConfirmationModal.js
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GlobalStyles } from "../../constants/GlobalStyles";

/**
 * NearestPlaceConfirmationModal Component
 * Displays a modal to confirm navigation to the nearest police station or hospital.
 *
 * Props:
 * - isVisible: Boolean to control modal visibility.
 * - placeDetails: Object containing details of the nearest place ({title, subtitle, distance, type}).
 * - onConfirmNavigation: Function to call when user confirms navigation.
 * - onCancel: Function to call when user cancels.
 */
const NearestPlaceConfirmationModal = ({
  isVisible,
  placeDetails,
  onConfirmNavigation,
  onCancel,
}) => {
  if (!isVisible || !placeDetails) {
    return null;
  }

  const placeTypeDisplay =
    placeDetails.type === "police" ? "Police Station" : "Hospital";

  return (
    <Modal
      visible={isVisible}
      animationType="fade" // or "slide"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Nearest {placeTypeDisplay} Found!</Text>
          {/* Ensure all text is wrapped in <Text> components */}
          <Text style={styles.placeName}>{placeDetails.title}</Text>
          <Text style={styles.placeAddress}>{placeDetails.subtitle}</Text>
          {placeDetails.distance !== undefined &&
            placeDetails.distance !== null && ( // Check for null/undefined explicitly
              <Text style={styles.placeDistance}>
                Approximately {placeDetails.distance.toFixed(1)} km away
              </Text>
            )}

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navigateButton}
              onPress={onConfirmNavigation}
            >
              <Text style={styles.navigateButtonText}>Start Navigation</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 25,
    width: "85%",
    alignItems: "center",
    ...GlobalStyles.shadow,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: GlobalStyles.colors.textPrimary,
    marginBottom: 10,
    textAlign: "center",
  },
  placeName: {
    fontSize: 18,
    fontWeight: "600",
    color: GlobalStyles.colors.primary,
    marginBottom: 5,
    textAlign: "center",
  },
  placeAddress: {
    fontSize: 14,
    color: GlobalStyles.colors.textSecondary,
    marginBottom: 5,
    textAlign: "center",
  },
  placeDistance: {
    fontSize: 14,
    fontWeight: "bold",
    color: GlobalStyles.colors.textPrimary,
    marginTop: 10,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.lightGray,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginRight: 10,
  },
  cancelButtonText: {
    color: GlobalStyles.colors.textSecondary,
    fontWeight: "bold",
    fontSize: 16,
  },
  navigateButton: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.success,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginLeft: 10,
  },
  navigateButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default NearestPlaceConfirmationModal;
