// components/SavedPlacesScreen.js (or screens/SavedPlacesScreen.js)
<<<<<<< HEAD
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native"; // Import useFocusEffect
=======

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "expo-router/react-navigation"; // Import useFocusEffect
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
<<<<<<< HEAD
  SafeAreaView,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
<<<<<<< HEAD
import { GlobalStyles } from "../constants/GlobalStyles";
=======
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "@/hooks/useAppTheme";

>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
interface SavedLocation {
  id: string;
  title: string;
  subtitle: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
}

const SavedPlacesScreen = () => {
<<<<<<< HEAD
  const [savedPlaces, setSavedPlaces] = useState<SavedLocation[]>([]);
  const navigation = useNavigation();

  // Function to load saved places from AsyncStorage
=======
  const { colors: c, elevation: elev } = useAppTheme();
  const [savedPlaces, setSavedPlaces] = useState<SavedLocation[]>([]);
  const navigation = useNavigation() as {
    navigate: (name: string, params?: object) => void;
  };

>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  const loadSavedPlaces = useCallback(async () => {
    try {
      const jsonValue = await AsyncStorage.getItem("savedLocations");
      const loadedPlaces: SavedLocation[] =
        jsonValue != null ? JSON.parse(jsonValue) : [];
      setSavedPlaces(loadedPlaces);
    } catch (e) {
      Alert.alert("Error", "Could not load saved places.");
    }
  }, []);

<<<<<<< HEAD
  // Use useFocusEffect to reload data whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSavedPlaces();
      return () => {
        // Optional: cleanup function if needed when screen blurs
      };
    }, [loadSavedPlaces])
  );

  // Function to delete a saved place
=======
  useFocusEffect(
    useCallback(() => {
      loadSavedPlaces();
      return () => {};
    }, [loadSavedPlaces]),
  );

>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  const handleDeletePlace = async (id: string) => {
    Alert.alert(
      "Delete Place",
      "Are you sure you want to delete this saved place?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              const updatedPlaces = savedPlaces.filter(
<<<<<<< HEAD
                (place) => place.id !== id
              );
              await AsyncStorage.setItem(
                "savedLocations",
                JSON.stringify(updatedPlaces)
              );
              setSavedPlaces(updatedPlaces); // Update state to re-render list
=======
                (place) => place.id !== id,
              );
              await AsyncStorage.setItem(
                "savedLocations",
                JSON.stringify(updatedPlaces),
              );
              setSavedPlaces(updatedPlaces);
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
              Alert.alert("Deleted", "Place removed from saved list.");
            } catch (e) {
              console.error("Failed to delete place:", e);
              Alert.alert("Error", "Could not delete place.");
            }
          },
          style: "destructive",
        },
<<<<<<< HEAD
      ]
    );
  };

  // Function to navigate back to SafeMaps and show the selected place on the map
=======
      ],
    );
  };

>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  const handleViewOnMap = (place: SavedLocation) => {
    navigation.navigate("(tabs)", {
      screen: "navigate",
      params: {
        selectedPlaceForMap: place.coordinate,
        selectedPlaceTitle: place.title,
        selectedPlaceSubtitle: place.subtitle,
      },
    });
  };

  const renderItem = ({ item }: { item: SavedLocation }) => (
<<<<<<< HEAD
    <View style={styles.placeItem}>
      <View style={styles.placeInfo}>
        <Text style={styles.placeTitle}>{item.title}</Text>
        <Text style={styles.placeSubtitle}>{item.subtitle}</Text>
      </View>
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleViewOnMap(item)}
        >
          <Text style={styles.actionButtonText}>🗺️ View</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeletePlace(item.id)}
        >
          <Text style={styles.actionButtonText}>🗑️ Delete</Text>
=======
    <View
      style={[
        styles.placeItem,
        { backgroundColor: c.cardBackground, ...elev.card },
      ]}
    >
      <View style={styles.placeInfo}>
        <Text style={[styles.placeTitle, { color: c.textPrimary }]}>
          {item.title}
        </Text>
        <Text style={[styles.placeSubtitle, { color: c.textSecondary }]}>
          {item.subtitle}
        </Text>
      </View>
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: c.primaryLight }]}
          onPress={() => handleViewOnMap(item)}
        >
          <Text style={[styles.actionButtonText, { color: c.textPrimary }]}>
            🗺️ View
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: c.primaryLight }]}
          onPress={() => handleDeletePlace(item.id)}
        >
          <Text style={[styles.actionButtonText, { color: c.textPrimary }]}>
            🗑️ Delete
          </Text>
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
<<<<<<< HEAD
    <SafeAreaView style={GlobalStyles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Saved Places</Text>
      </View>
      {savedPlaces.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No saved places yet.</Text>
          <Text style={styles.emptySubText}>
=======
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <View
        style={[
          styles.header,
          {
            borderBottomColor: c.border,
            backgroundColor: c.background,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: c.textPrimary }]}>
          Your Saved Places
        </Text>
      </View>
      {savedPlaces.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: c.textSecondary }]}>
            No saved places yet.
          </Text>
          <Text style={[styles.emptySubText, { color: c.textSecondary }]}>
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
            Search for a place and tap 'Save' to add it here!
          </Text>
        </View>
      ) : (
        <FlatList
          data={savedPlaces}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
<<<<<<< HEAD
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: GlobalStyles.colors.lightGray,
    backgroundColor: GlobalStyles.colors.background,
=======
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
<<<<<<< HEAD
    color: GlobalStyles.colors.textPrimary,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    textAlign: "center",
  },
  listContent: {
    padding: 10,
  },
  placeItem: {
<<<<<<< HEAD
    backgroundColor: GlobalStyles.colors.cardBackground,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    borderRadius: 8,
    padding: 15,
    marginVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
<<<<<<< HEAD
    ...GlobalStyles.shadow,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  },
  placeInfo: {
    flex: 1,
    marginRight: 10,
  },
  placeTitle: {
    fontSize: 18,
    fontWeight: "600",
<<<<<<< HEAD
    color: GlobalStyles.colors.textPrimary,
  },
  placeSubtitle: {
    fontSize: 14,
    color: GlobalStyles.colors.textSecondary,
=======
  },
  placeSubtitle: {
    fontSize: 14,
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: "row",
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginLeft: 10,
    borderRadius: 5,
<<<<<<< HEAD
    backgroundColor: GlobalStyles.colors.primaryLight,
  },
  actionButtonText: {
    color: GlobalStyles.colors.textPrimary,
=======
  },
  actionButtonText: {
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    fontWeight: "bold",
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
<<<<<<< HEAD
    color: GlobalStyles.colors.textSecondary,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    marginBottom: 10,
    fontWeight: "bold",
  },
  emptySubText: {
    fontSize: 14,
<<<<<<< HEAD
    color: GlobalStyles.colors.textSecondary,
=======
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    textAlign: "center",
  },
});

export default SavedPlacesScreen;
