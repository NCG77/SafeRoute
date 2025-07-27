// components/SearchBar.js
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { GlobalStyles } from "../../constants/GlobalStyles";

/**
 * SearchBar Component
 * Provides a search input field and displays search results in a dropdown.
 *
 * Props:
 * - searchQuery: Current value of the search input.
 * - setSearchQuery: Function to update the search query.
 * - searchResults: Array of search result objects.
 * - showSearchResults: Boolean to control visibility of results dropdown.
 * - onSearch: Function to call when the search query changes (debounced usually).
 * - onSelectResult: Function to call when a search result is selected.
 * - onClearSearch: Function to clear the search input and results.
 */
const SearchBar = ({
  searchQuery,
  setSearchQuery,
  searchResults,
  showSearchResults,
  onSearch,
  onSelectResult,
  onClearSearch,
}) => {
  // Debounce search input to avoid excessive API calls
  const debounceTimeout = React.useRef(null);
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      onSearch(text);
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
          <ScrollView style={styles.searchResults}>
            {searchResults.map((result) => (
              <TouchableOpacity
                key={result.id}
                style={styles.searchResultItem}
                onPress={() => onSelectResult(result)}
              >
                <View style={styles.searchResultIcon}>
                  <Text style={styles.searchResultIconText}>📍</Text>
                </View>
                <View style={styles.searchResultText}>
                  <Text style={styles.searchResultTitle}>{result.title}</Text>
                  <Text style={styles.searchResultSubtitle}>
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
    top: Platform.OS === "ios" ? 50 : 20,
    left: 15,
    right: 15,
    zIndex: 10,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
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
  },
  clearButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  clearButtonText: {
    fontSize: 16,
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
  },
  searchResults: {
    maxHeight: 300,
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: GlobalStyles.colors.lightGray,
  },
  searchResultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GlobalStyles.colors.lightGray,
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
    color: GlobalStyles.colors.textPrimary,
  },
  searchResultSubtitle: {
    fontSize: 14,
    color: GlobalStyles.colors.textSecondary,
    marginTop: 2,
  },
});

export default SearchBar;
