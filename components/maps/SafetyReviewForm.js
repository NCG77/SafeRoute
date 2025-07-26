// components/SafetyReviewForm.js
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { GlobalStyles } from "../../constants/GlobalStyles";

/**
 * SafetyReviewForm Component
 * A form for users to submit safety reviews for a specific location.
 *
 * Props:
 * - location: Object {latitude, longitude} of the location being reviewed.
 * - onSubmit: Function to call when the form is submitted.
 * - onCancel: Function to call when the form is cancelled.
 */
const SafetyReviewForm = ({ location, onSubmit, onCancel }) => {
  const [rating, setRating] = useState(3); // Default to neutral
  const [comment, setComment] = useState("");
  const [category, setCategory] = useState("general");

  const categories = [
    { value: "general", label: "General Safety" },
    { value: "lighting", label: "Poor Lighting" },
    { value: "harassment", label: "Harassment" },
    { value: "crime", label: "Crime Reports" },
    { value: "security", label: "Security Presence" },
    { value: "crowd", label: "Crowded Area" },
    { value: "infrastructure", label: "Bad Infrastructure" },
  ];

  const handleSubmit = () => {
    if (!location) {
      Alert.alert("Error", "Location for review is missing.");
      return;
    }
    if (comment.trim().length < 10) {
      Alert.alert(
        "Error",
        "Please provide a detailed comment (at least 10 characters)."
      );
      return;
    }

    onSubmit(
      location.latitude,
      location.longitude,
      rating,
      comment.trim(),
      category
    );
    // Reset form after submission
    setRating(3);
    setComment("");
    setCategory("general");
  };

  return (
    <ScrollView style={styles.reviewForm}>
      <Text style={styles.reviewFormLabel}>
        How safe do you feel in this area?
      </Text>

      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            style={[
              styles.starButton,
              rating >= star && styles.starButtonActive,
            ]}
            onPress={() => setRating(star)}
          >
            <Text
              style={[styles.starText, rating >= star && styles.starTextActive]}
            >
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.ratingLabel}>
        {rating === 1
          ? "Very Unsafe"
          : rating === 2
          ? "Unsafe"
          : rating === 3
          ? "Neutral"
          : rating === 4
          ? "Safe"
          : "Very Safe"}
      </Text>

      <Text style={styles.reviewFormLabel}>Category</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryScrollContent}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.value}
            style={[
              styles.categoryButton,
              category === cat.value && styles.categoryButtonActive,
            ]}
            onPress={() => setCategory(cat.value)}
          >
            <Text
              style={[
                styles.categoryButtonText,
                category === cat.value && styles.categoryButtonTextActive,
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.reviewFormLabel}>
        Details (Help others stay safe)
      </Text>
      <TextInput
        style={styles.commentInput}
        placeholder="Describe what makes this area safe or unsafe..."
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={4}
        maxLength={500}
      />

      <Text style={styles.charCount}>{comment.length}/500</Text>

      <View style={styles.reviewFormButtons}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit Review</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  reviewForm: {
    padding: 20,
  },
  reviewFormLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: GlobalStyles.colors.textPrimary,
    marginBottom: 12,
    marginTop: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
  },
  starButton: {
    padding: 8,
    marginHorizontal: 4,
    borderRadius: 20, // Make it circular
  },
  starButtonActive: {
    backgroundColor: GlobalStyles.colors.warning, // Gold color for active stars
  },
  starText: {
    fontSize: 24,
    color: GlobalStyles.colors.lightGray, // Grey for inactive stars
  },
  starTextActive: {
    color: "white",
  },
  ratingLabel: {
    textAlign: "center",
    fontSize: 14,
    color: GlobalStyles.colors.textSecondary,
    marginBottom: 20,
  },
  categoryScroll: {
    marginBottom: 20,
  },
  categoryScrollContent: {
    alignItems: "center", // Center items when few categories
  },
  categoryButton: {
    backgroundColor: GlobalStyles.colors.lightGray,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: GlobalStyles.colors.primary,
  },
  categoryButtonText: {
    fontSize: 12,
    color: GlobalStyles.colors.textSecondary,
  },
  categoryButtonTextActive: {
    color: "white",
  },
  commentInput: {
    borderWidth: 1,
    borderColor: GlobalStyles.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: "top", // For multiline input
    minHeight: 100,
    color: GlobalStyles.colors.textPrimary,
  },
  charCount: {
    textAlign: "right",
    fontSize: 12,
    color: GlobalStyles.colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },
  reviewFormButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.lightGray,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: GlobalStyles.colors.textSecondary,
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.success,
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "white",
    fontWeight: "600",
  },
});

export default SafetyReviewForm;
