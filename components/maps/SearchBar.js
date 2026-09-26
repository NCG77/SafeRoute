// components/SearchBar.js
<<<<<<< HEAD
import React from "react";
import {
  Platform,
=======

import { useAppTheme } from "@/hooks/useAppTheme";
import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React from "react";
import {
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
<<<<<<< HEAD
import { GlobalStyles } from "../../constants/GlobalStyles";
=======
import { useSafeAreaInsets } from "react-native-safe-area-context";
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3

/**
 * SearchBar Component
 * Provides a search input field and displays search results in a dropdown.
<<<<<<< HEAD
 *
 * Props:
 * - searchQuery: Current value of the search input.
 * - setSearchQuery: Function to update the search query.
 * - searchResults: Array of search result objects.
 * - showSearchResults: Boolean to control visibility of results dropdown.
 * - onSearch: Function to call when the search query changes (debounced usually).
 * - onSelectResult: Function to call when a search result is selected.
 * - onClearSearch: Function to clear the search input and results.
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
 */
const SearchBar = ({
  searchQuery,
  setSearchQuery,
  searchResults,
  showSearchResults,
  onSearch,
  onSelectResult,
  onClearSearch,
<<<<<<< HEAD
}) => {
  // Debounce search input to avoid excessive API calls
  const debounceTimeout = React.useRef(null);
=======
  onBookmarkPress,
}) => {
  const insets = useSafeAreaInsets();
  const { colors: c, elevation: elev, isDark } = useAppTheme();
  const debounceTimeout = React.useRef(null);

>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      onSearch(text);
<<<<<<< HEAD
    }, 500); // 500ms debounce
  };

  return (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search for places"
          value={searchQuery}
          onChangeText={handleSearchChange}
          returnKeyType="search"
          onSubmitEditing={() => onSearch(searchQuery)} // Trigger search on keyboard submit
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={onClearSearch}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {showSearchResults && searchResults.length > 0 && (
        <View style={styles.searchResultsContainer}>
=======
    }, 500);
  };

  const glassBg = isDark ? "rgba(21,26,45,0.78)" : "rgba(255,255,255,0.72)";
  const glassBorder = isDark
    ? "rgba(255,255,255,0.12)"
    : "rgba(255,255,255,0.85)";

  return (
    <View
      style={[styles.searchContainer, { top: Math.max(insets.top, 12) + 8 }]}
    >
      <BlurView
        intensity={48}
        tint={isDark ? "dark" : "light"}
        style={[
          styles.searchInputContainer,
          { backgroundColor: glassBg, borderColor: glassBorder, ...elev.card },
        ]}
      >
        <MaterialIcons
          name="search"
          size={22}
          color={c.primary}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: c.textPrimary }]}
          placeholder="Search for a safe destination"
          placeholderTextColor={c.textSecondary}
          value={searchQuery}
          onChangeText={handleSearchChange}
          returnKeyType="search"
          onSubmitEditing={() => onSearch(searchQuery)}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={onClearSearch}>
            <Text style={[styles.clearButtonText, { color: c.textSecondary }]}>
              ✕
            </Text>
          </TouchableOpacity>
        )}
        {onBookmarkPress ? (
          <TouchableOpacity
            style={styles.bookmarkButton}
            onPress={onBookmarkPress}
            accessibilityLabel="Saved places"
          >
            <MaterialIcons name="bookmark" size={22} color={c.primary} />
          </TouchableOpacity>
        ) : null}
      </BlurView>

      {showSearchResults && searchResults.length > 0 && (
        <View
          style={[
            styles.searchResultsContainer,
            { backgroundColor: c.surface, ...elev.card },
          ]}
        >
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
          <ScrollView style={styles.searchResults}>
            {searchResults.map((result) => (
              <TouchableOpacity
                key={result.id}
<<<<<<< HEAD
                style={styles.searchResultItem}
                onPress={() => onSelectResult(result)}
              >
                <View style={styles.searchResultIcon}>
                  <Text style={styles.searchResultIconText}>📍</Text>
                </View>
                <View style={styles.searchResultText}>
                  <Text style={styles.searchResultTitle}>{result.title}</Text>
                  <Text style={styles.searchResultSubtitle}>
=======
                style={[
                  styles.searchResultItem,
                  { borderBottomColor: c.border },
                ]}
                onPress={() => onSelectResult(result)}
              >
                <View
                  style={[
                    styles.searchResultIcon,
                    { backgroundColor: c.surfaceVariant },
                  ]}
                >
                  <Text style={styles.searchResultIconText}>📍</Text>
                </View>
                <View style={styles.searchResultText}>
                  <Text
                    style={[styles.searchResultTitle, { color: c.textPrimary }]}
                  >
                    {result.title}
                  </Text>
                  <Text
                    style={[
                      styles.searchResultSubtitle,
                      { color: c.textSecondary },
                    ]}
                  >
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
                    {result.subtitle}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    position: "absolute",
<<<<<<< HEAD
    top: Platform.OS === "ios" ? 50 : 20,
    left: 15,
    right: 15,
    zIndex: 10,
=======
    left: 16,
    right: 16,
    zIndex: 30,
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
<<<<<<< HEAD
    backgroundColor: "white",
    borderRadius: 8,
    ...GlobalStyles.shadow,
  },
  searchInput: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 16,
    color: GlobalStyles.colors.textPrimary,
=======
    overflow: "hidden",
    borderRadius: 28,
    borderWidth: 1,
  },
  searchIcon: {
    marginLeft: 16,
  },
  searchInput: {
    flex: 1,
    height: 52,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  bookmarkButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  },
  clearButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  clearButtonText: {
    fontSize: 16,
<<<<<<< HEAD
    color: GlobalStyles.colors.textSecondary,
  },
  searchResultsContainer: {
    position: "absolute",
    top: 55, // Below the search input
    left: 0,
    right: 0,
    zIndex: 9,
    backgroundColor: "white",
    borderRadius: 8,
    ...GlobalStyles.shadow,
    maxHeight: 300,
    overflow: "hidden", // Ensure content doesn't spill
=======
  },
  searchResultsContainer: {
    position: "absolute",
    top: 55,
    left: 0,
    right: 0,
    zIndex: 9,
    borderRadius: 8,
    maxHeight: 300,
    overflow: "hidden",
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  },
  searchResults: {
    maxHeight: 300,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
<<<<<<< HEAD
    borderBottomColor: GlobalStyles.colors.lightGray,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  },
  searchResultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
<<<<<<< HEAD
    backgroundColor: GlobalStyles.colors.lightGray,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  searchResultIconText: {
    fontSize: 16,
  },
  searchResultText: {
    flex: 1,
  },
  searchResultTitle: {
    fontSize: 16,
    fontWeight: "500",
<<<<<<< HEAD
    color: GlobalStyles.colors.textPrimary,
  },
  searchResultSubtitle: {
    fontSize: 14,
    color: GlobalStyles.colors.textSecondary,
=======
  },
  searchResultSubtitle: {
    fontSize: 14,
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    marginTop: 2,
  },
});

export default SearchBar;
