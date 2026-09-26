// components/maps/NearestPlaceConfirmationModal.js
<<<<<<< HEAD
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
=======
import { useAppTheme } from "@/hooks/useAppTheme";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
const NearestPlaceConfirmationModal = ({
  isVisible,
  placeDetails,
  onConfirmNavigation,
  onCancel,
}) => {
<<<<<<< HEAD
=======
  const { colors: c, elevation: elev } = useAppTheme();
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  if (!isVisible || !placeDetails) {
    return null;
  }

  const placeTypeDisplay =
    placeDetails.type === "police" ? "Police Station" : "Hospital";

  return (
    <Modal
      visible={isVisible}
<<<<<<< HEAD
      animationType="fade" // or "slide"
=======
      animationType="fade"
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
<<<<<<< HEAD
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
=======
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: c.surface, ...elev.card },
          ]}
        >
          <Text style={[styles.title, { color: c.textPrimary }]}>
            Nearest {placeTypeDisplay} Found!
          </Text>
          <Text style={[styles.placeName, { color: c.primary }]}>
            {placeDetails.title}
          </Text>
          <Text style={[styles.placeAddress, { color: c.textSecondary }]}>
            {placeDetails.subtitle}
          </Text>
          {Number.isFinite(placeDetails.distance) ? (
              <Text style={[styles.placeDistance, { color: c.textPrimary }]}>
                {placeDetails.distance < 1
                  ? `Approximately ${Math.round(placeDetails.distance * 1000)} m away`
                  : `Approximately ${placeDetails.distance.toFixed(1)} km away`}
              </Text>
            ) : null}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                { backgroundColor: c.surfaceVariant },
              ]}
              onPress={onCancel}
            >
              <Text
                style={[styles.cancelButtonText, { color: c.textSecondary }]}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navigateButton, { backgroundColor: c.success }]}
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
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
<<<<<<< HEAD
    backgroundColor: "white",
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    borderRadius: 15,
    padding: 25,
    width: "85%",
    alignItems: "center",
<<<<<<< HEAD
    ...GlobalStyles.shadow,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
<<<<<<< HEAD
    color: GlobalStyles.colors.textPrimary,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    marginBottom: 10,
    textAlign: "center",
  },
  placeName: {
    fontSize: 18,
    fontWeight: "600",
<<<<<<< HEAD
    color: GlobalStyles.colors.primary,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    marginBottom: 5,
    textAlign: "center",
  },
  placeAddress: {
    fontSize: 14,
<<<<<<< HEAD
    color: GlobalStyles.colors.textSecondary,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    marginBottom: 5,
    textAlign: "center",
  },
  placeDistance: {
    fontSize: 14,
    fontWeight: "bold",
<<<<<<< HEAD
    color: GlobalStyles.colors.textPrimary,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
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
<<<<<<< HEAD
    backgroundColor: GlobalStyles.colors.lightGray,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginRight: 10,
  },
  cancelButtonText: {
<<<<<<< HEAD
    color: GlobalStyles.colors.textSecondary,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    fontWeight: "bold",
    fontSize: 16,
  },
  navigateButton: {
    flex: 1,
<<<<<<< HEAD
    backgroundColor: GlobalStyles.colors.success,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
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
