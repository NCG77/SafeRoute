// LiveLocationShareScreen.js
import AsyncStorage from "@react-native-async-storage/async-storage"; // NEW: Import AsyncStorage
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Assuming GlobalStyles is in ../constants/GlobalStyles
import { GlobalStyles } from "../../constants/GlobalStyles";

// Define a unique name for your background location task
const LOCATION_TRACKING_TASK = "location-tracking-task";
const CONTACTS_STORAGE_KEY = "@SafeRoute:contacts"; // Same key as ContactsScreen

type Contact = {
  // Define Contact type for clarity
  id: string;
  name: string;
  phone: string;
};

// Register the background task (must be outside the component)
// This is where the actual live location data would be sent to your backend.
TaskManager.defineTask(LOCATION_TRACKING_TASK, async ({ data, error }) => {
  if (error) {
    console.error("Background location task error:", error);
    return;
  }
  if (data) {
    const { locations } = data;
    const latestLocation = locations[0];
    if (latestLocation) {
      // Retrieve options passed when starting the task
      const taskOptions = TaskManager.getTaskOptions();
      const sharingWithContacts =
        (taskOptions.sharingWithContacts as Contact[]) || [];
      const isGeneralShare = taskOptions.isGeneralShare || false;

      // In a real app, you would send this to your backend (e.g., Firestore)
      // The backend would then handle pushing this location to the specific contacts.
      console.log("Background Location Update:", {
        latitude: latestLocation.coords.latitude,
        longitude: latestLocation.coords.longitude,
        timestamp: latestLocation.timestamp,
        sharedWith: isGeneralShare
          ? "All emergency contacts"
          : sharingWithContacts.map((c) => c.name).join(", "),
        contactIds: sharingWithContacts.map((c) => c.id), // IDs of contacts to share with
      });

      // Example of what you'd do with Firestore (conceptual):
      /*
      import { getFirestore, doc, setDoc } from 'firebase/firestore';
      import { getAuth } from 'firebase/auth'; // Assuming Firebase Auth is set up

      const db = getFirestore(firebaseApp); // firebaseApp initialized elsewhere
      const auth = getAuth(firebaseApp);
      const userId = auth.currentUser?.uid;

      if (userId) {
        // Update user's own live location document
        await setDoc(doc(db, 'live_locations', userId), {
          latitude: latestLocation.coords.latitude,
          longitude: latestLocation.coords.longitude,
          timestamp: latestLocation.timestamp,
          sharingWith: sharingWithContacts.map(c => c.id), // Store IDs of contacts being shared with
          isGeneralShare: isGeneralShare,
        });

        // Optionally, update a 'shared_locations' collection for each target contact
        // This is more complex and depends on your backend architecture.
        // For example, for each contact ID:
        // await setDoc(doc(db, 'shared_locations', contactId), {
        //   [userId]: { latitude: latestLocation.coords.latitude, longitude: latestLocation.coords.longitude, timestamp: latestLocation.timestamp }
        // }, { merge: true });
      }
      */
    }
  }
});

const LiveLocationShareScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { startSharing, targetContact } = route.params || {}; // Receive targetContact param

  const [isSharing, setIsSharing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [statusMessage, setStatusMessage] = useState(
    "Ready to share location."
  );
  const [sharedWithContacts, setSharedWithContacts] = useState<Contact[]>([]); // NEW: State to display shared contacts
  const [allContacts, setAllContacts] = useState<Contact[]>([]); // NEW: State to hold all contacts from storage

  // Load all contacts from AsyncStorage on component mount
  useEffect(() => {
    const loadAllContacts = async () => {
      try {
        const savedContacts = await AsyncStorage.getItem(CONTACTS_STORAGE_KEY);
        if (savedContacts) {
          setAllContacts(JSON.parse(savedContacts));
        }
      } catch (error) {
        console.error(
          "Failed to load all contacts for LiveLocationShareScreen",
          error
        );
      }
    };
    loadAllContacts();
  }, []);

  // Effect to handle initial sharing request from HomePage or ContactsScreen
  useEffect(() => {
    if (startSharing) {
      if (targetContact) {
        // Sharing with a specific contact
        setSharedWithContacts([targetContact]);
        setStatusMessage(
          `Sharing with ${targetContact.name} (${targetContact.phone})`
        );
      } else {
        // Sharing with all emergency contacts (from HomePage button)
        // This relies on allContacts being loaded by the previous useEffect
        setSharedWithContacts(allContacts);
        setStatusMessage("Sharing with all emergency contacts.");
      }
      handleStartSharing();
      // Clear the param after use to prevent re-triggering if user navigates back
      navigation.setParams({
        startSharing: undefined,
        targetContact: undefined,
      });
    }
  }, [startSharing, targetContact, allContacts, navigation]); // Add allContacts to dependency array

  // Effect to clean up location watcher on unmount
  useEffect(() => {
    return () => {
      handleStopSharing(); // Ensure location tracking stops when component unmounts
    };
  }, []);

  const requestPermissions = async () => {
    const { status: foregroundStatus } =
      await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus === "granted") {
      const { status: backgroundStatus } =
        await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus === "granted") {
        return true;
      } else {
        Alert.alert(
          "Background Location Denied",
          "Background location access is required for live sharing. Please enable it in your device settings."
        );
      }
    } else {
      Alert.alert(
        "Location Denied",
        "Foreground location access is required. Please enable it in your device settings."
      );
    }
    return false;
  };

  const handleStartSharing = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      setStatusMessage("Permissions not granted. Cannot start sharing.");
      return;
    }

    // Determine which contacts to share with based on current state
    const contactsToShare =
      sharedWithContacts.length > 0 ? sharedWithContacts : allContacts;
    const isGeneralShare = !targetContact && contactsToShare.length > 0;

    // Check if task is already running
    const isTaskRunning = await TaskManager.isTaskRegisteredAsync(
      LOCATION_TRACKING_TASK
    );
    if (isTaskRunning) {
      await Location.stopLocationUpdatesAsync(LOCATION_TRACKING_TASK);
    }

    try {
      // Start background location updates, passing contacts as task options
      await Location.startLocationUpdatesAsync(LOCATION_TRACKING_TASK, {
        accuracy: Location.Accuracy.Balanced, // Adjust accuracy as needed
        timeInterval: 10000, // Update every 10 seconds (in milliseconds)
        distanceInterval: 10, // Update every 10 meters
        deferredUpdatesInterval: 5000, // Defer updates for 5 seconds to save battery
        foregroundService: {
          // Required for Android 8.0+ for persistent notification
          notificationTitle: "Live Location Sharing",
          notificationBody: "Your location is being shared for safety.",
          notificationColor: "#FF4444",
        },
        // Pass contacts data to the background task
        taskOptions: {
          sharingWithContacts: contactsToShare,
          isGeneralShare: isGeneralShare,
        },
      });
      setIsSharing(true);
      if (contactsToShare.length > 0) {
        setStatusMessage(
          `Live location sharing active with: ${contactsToShare
            .map((c) => c.name)
            .join(", ")}.`
        );
        Alert.alert(
          "Sharing Started",
          `Your live location is now being shared with ${contactsToShare
            .map((c) => c.name)
            .join(", ")}.`
        );
      } else {
        setStatusMessage("Live location sharing active.");
        Alert.alert(
          "Sharing Started",
          "Your live location is now being shared."
        );
      }

      // Also get current location for immediate display
      const currentLoc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation(currentLoc.coords);
    } catch (error) {
      console.error("Error starting location updates:", error);
      Alert.alert("Error", "Failed to start live location sharing.");
      setIsSharing(false);
      setStatusMessage("Failed to start sharing.");
    }
  };

  const handleStopSharing = async () => {
    try {
      const isTaskRunning = await TaskManager.isTaskRegisteredAsync(
        LOCATION_TRACKING_TASK
      );
      if (isTaskRunning) {
        await Location.stopLocationUpdatesAsync(LOCATION_TRACKING_TASK);
      }
      setIsSharing(false);
      setCurrentLocation(null);
      setSharedWithContacts([]); // Clear shared contacts
      setStatusMessage("Live location sharing stopped.");
      Alert.alert(
        "Sharing Stopped",
        "Your live location is no longer being shared."
      );
    } catch (error) {
      console.error("Error stopping location updates:", error);
      Alert.alert("Error", "Failed to stop live location sharing.");
      setStatusMessage("Failed to stop sharing.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Live Location Sharing</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.statusText}>{statusMessage}</Text>
        {isSharing &&
          sharedWithContacts.length > 0 && ( // Display shared contacts when sharing
            <View style={styles.sharedWithContainer}>
              <Text style={styles.sharedWithTextTitle}>Sharing with:</Text>
              {sharedWithContacts.map((contact) => (
                <Text key={contact.id} style={styles.sharedWithText}>
                  • {contact.name} ({contact.phone})
                </Text>
              ))}
            </View>
          )}
        {!isSharing && sharedWithContacts.length === 0 && (
          <Text style={styles.infoText}>
            Tap "Start Sharing" to share with all saved emergency contacts, or
            navigate from the Contacts screen to share with specific
            individuals.
          </Text>
        )}

        {currentLocation && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationText}>
              Latitude: {currentLocation.latitude.toFixed(6)}
            </Text>
            <Text style={styles.locationText}>
              Longitude: {currentLocation.longitude.toFixed(6)}
            </Text>
            <Text style={styles.locationText}>
              Accuracy: {currentLocation.accuracy?.toFixed(2)}m
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.shareButton,
            isSharing ? styles.stopButton : styles.startButton,
          ]}
          onPress={isSharing ? handleStopSharing : handleStartSharing}
          // Note: Location.hasServicesEnabledAsync() is not a synchronous getter.
          // It's an async function. For disabling, you'd need a state variable
          // that tracks its result, or remove this prop if not critical.
          // disabled={!Location.hasServicesEnabledAsync}
        >
          <Text style={styles.shareButtonText}>
            {isSharing ? "Stop Sharing" : "Start Sharing"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.infoText}>
          Your location will be shared continuously in the background. Ensure
          you have granted background location permissions.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.backgroundLight,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    backgroundColor: GlobalStyles.colors.primary,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 15,
  },
  backButton: {
    position: "absolute",
    left: 15,
    padding: 5,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  statusText: {
    fontSize: 18,
    fontWeight: "600",
    color: GlobalStyles.colors.textPrimary,
    marginBottom: 10,
    textAlign: "center",
  },
  sharedWithContainer: {
    // NEW STYLE
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    ...GlobalStyles.shadowSmall,
    width: "90%",
    alignItems: "flex-start",
  },
  sharedWithTextTitle: {
    // NEW STYLE
    fontSize: 16,
    fontWeight: "bold",
    color: GlobalStyles.colors.textPrimary,
    marginBottom: 5,
  },
  sharedWithText: {
    // NEW STYLE
    fontSize: 14,
    color: GlobalStyles.colors.textSecondary,
    marginBottom: 2,
  },
  locationInfo: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    ...GlobalStyles.shadowSmall,
    marginBottom: 20,
    alignItems: "center",
  },
  locationText: {
    fontSize: 14,
    color: GlobalStyles.colors.textSecondary,
    marginBottom: 5,
  },
  shareButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    ...GlobalStyles.shadow,
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: GlobalStyles.colors.success,
  },
  stopButton: {
    backgroundColor: GlobalStyles.colors.danger,
  },
  shareButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  infoText: {
    fontSize: 13,
    color: GlobalStyles.colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default LiveLocationShareScreen;
