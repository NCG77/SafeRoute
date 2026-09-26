// components/SafetyReviewModal.js
<<<<<<< HEAD
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GlobalStyles } from "../../constants/GlobalStyles";
import SafetyReviewForm from "./SafetyReviewForm"; // Assuming this is in the same components folder

/**
 * SafetyReviewModal Component
 * Manages the modal for submitting a safety review.
 *
 * Props:
 * - showReviewModal: Boolean to control modal visibility.
 * - reviewLocation: Object {latitude, longitude} for the location being reviewed.
 * - onSubmit: Function to call when the review form is submitted.
 * - onClose: Function to close the modal.
 */
const SafetyReviewModal = ({
  showReviewModal,
  reviewLocation,
  onSubmit,
  onClose,
}) => {
=======
import { useAppTheme } from "@/hooks/useAppTheme";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import SafetyReviewForm from "./SafetyReviewForm";

const SafetyReviewModal = ({
  showReviewModal,
  reviewLocation,
  reviewPlaceLabel,
  reviewPlaceSubtitle,
  onLocationChange,
  onUseCurrentLocation,
  onSubmit,
  onClose,
}) => {
  const { colors: c } = useAppTheme();
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  return (
    <Modal
      visible={showReviewModal}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
<<<<<<< HEAD
        <View style={styles.reviewModal}>
          <View style={styles.reviewModalHeader}>
            <Text style={styles.reviewModalTitle}>
              Report Safety Information
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <SafetyReviewForm
            location={reviewLocation}
            onSubmit={onSubmit}
            onCancel={onClose}
          />
=======
        <View style={[styles.reviewModal, { backgroundColor: c.surface }]}>
          <View
            style={[styles.reviewModalHeader, { borderBottomColor: c.border }]}
          >
            <Text style={[styles.reviewModalTitle, { color: c.textPrimary }]}>
              Report this area
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

          <View style={styles.reviewFormSlot}>
            <SafetyReviewForm
              location={reviewLocation}
              locationLabel={reviewPlaceLabel}
              locationSubtitle={reviewPlaceSubtitle}
              onLocationChange={onLocationChange}
              onUseCurrentLocation={onUseCurrentLocation}
              onSubmit={onSubmit}
              onCancel={onClose}
              showMapTip
            />
          </View>
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
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
  reviewModal: {
<<<<<<< HEAD
    backgroundColor: "white",
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    minHeight: "60%",
<<<<<<< HEAD
=======
    flexGrow: 1,
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  },
  reviewModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
<<<<<<< HEAD
    borderBottomColor: GlobalStyles.colors.lightGray,
=======
  },
  reviewFormSlot: {
    flex: 1,
    minHeight: 0,
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  },
  reviewModalTitle: {
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
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  },
});

export default SafetyReviewModal;
