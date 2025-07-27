// components/SafetyReviewModal.js
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
  return (
    <Modal
      visible={showReviewModal}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
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
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    minHeight: "60%",
  },
  reviewModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: GlobalStyles.colors.lightGray,
  },
  reviewModalTitle: {
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
});

export default SafetyReviewModal;
