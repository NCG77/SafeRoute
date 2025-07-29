// LiveLocationShareScreen.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native"; // Added useFocusEffect
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import React, { useCallback, useEffect, useState } from "react"; // Added useCallback
import {
  Alert,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"; // Added AppState

// Firebase Imports
import { getApps, initializeApp } from "firebase/app"; // MODIFIED: Added getApps
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { doc, getFirestore, setDoc } from "firebase/firestore";

// Assuming GlobalStyles is in ../constants/GlobalStyles
import { GlobalStyles } from "../constants/GlobalStyles";

// Define a unique name for your background location task
const LOCATION_TRACKING_TASK = "location-tracking-task";
const CONTACTS_STORAGE_KEY = "@SafeRoute:contacts";
const IS_SHARING_STORAGE_KEY = "@SafeRoute:isSharing"; // NEW: Key to store sharing status

type Contact = {
  id: string;
  name: string;
  phone: string;
};

// Initialize Firebase App (outside component to avoid re-initialization)
// Note: This relies on your App.js (or root setup) also initializing Firebase
// using the same firebaseConfig for getApps() to pick it up correctly.
// A more robust pattern in large apps might be to pass the initialized 'app' instance around.
let firebaseApp;
let db;
let auth;
let currentFirebaseUserId: string | null = null; // Global variable to hold user ID for background task

// Try to get the already initialized app, or initialize it if it's the first time (e.g. for background task itself)
// This is critical for background tasks where the main app might not be fully loaded.
if (getApps().length === 0) {
  // Attempt to load firebaseConfig from process.env for background task context
  const backgroundFirebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };
  if (backgroundFirebaseConfig.apiKey) {
    // Basic check if config is present
    firebaseApp = initializeApp(backgroundFirebaseConfig);
    db = getFirestore(firebaseApp);
    auth = getAuth(firebaseApp);
    console.log("Firebase initialized in background context.");
  } else {
    console.error(
      "Firebase config not found in process.env for background task."
    );
    // Alert.alert("Firebase Config Missing", "Firebase environment variables are not set. Live location sharing will not work."); // Cannot alert in global scope
  }
} else {
  firebaseApp = getApps()[0];
  db = getFirestore(firebaseApp);
  auth = getAuth(firebaseApp);
  console.log("Firebase accessed from existing app instance.");
}

// Listen for auth state changes globally to update currentFirebaseUserId
if (auth) {
  // Only attach listener if auth is initialized
  auth.onAuthStateChanged((user) => {
    if (user) {
      currentFirebaseUserId = user.uid;
      console.log(
        "Firebase Auth State Changed (Global Task Scope): User is",
        user.uid
      );
    } else {
      currentFirebaseUserId = null;
      console.log(
        "Firebase Auth State Changed (Global Task Scope): User is signed out."
      );
    }
  });
} else {
  console.error("Firebase auth not initialized in task scope.");
}

// Register the background task
TaskManager.defineTask(
  LOCATION_TRACKING_TASK,
  async ({ data, error, executionInfo }) => {
    if (error) {
      console.error("Background location task error:", error);
      return;
    }
    if (data) {
      const { locations } = data;
      const latestLocation = locations[0];
      if (latestLocation) {
        const taskOptions = executionInfo?.taskOptions;
        const sharingWithContacts =
          (taskOptions?.sharingWithContacts as Contact[]) || [];
        const isGeneralShare = taskOptions?.isGeneralShare || false;
        const userId = taskOptions?.userId;

        if (db && userId) {
          try {
            const locationData = {
              latitude: latestLocation.coords.latitude,
              longitude: latestLocation.coords.longitude,
              timestamp: latestLocation.timestamp,
              accuracy: latestLocation.coords.accuracy,
              speed: latestLocation.coords.speed,
              heading: latestLocation.coords.heading,
              sharingWith: sharingWithContacts.map((c) => ({
                id: c.id,
                name: c.name,
                phone: c.phone,
              })),
              isGeneralShare: isGeneralShare,
              serverTimestamp: new Date().toISOString(),
            };

            await setDoc(doc(db, "live_locations", userId), locationData, {
              merge: true,
            });

            console.log(
              "Live location sent to Firestore for user:",
              userId,
              "Location:",
              latestLocation.coords.latitude,
              latestLocation.coords.longitude
            );
            console.log(
              "Shared with:",
              sharingWithContacts.map((c) => c.name).join(", ") || "General"
            );
          } catch (firestoreError) {
            console.error(
              "Failed to send location to Firestore:",
              firestoreError
            );
          }
        } else {
          console.warn(
            "Firestore DB or userId not available in background task. Location not sent. User ID:",
            userId,
            "DB:",
            !!db
          );
        }
      }
    }
  }
);

const LiveLocationShareScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { startSharing, targetContact } = route.params || {};

  const [isSharing, setIsSharing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [statusMessage, setStatusMessage] = useState(
    "Ready to share location."
  );
  const [sharedWithContacts, setSharedWithContacts] = useState<Contact[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [contactsLoaded, setContactsLoaded] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Function to load contacts from AsyncStorage
  const loadContactsFromStorage = useCallback(async () => {
    try {
      const savedContacts = await AsyncStorage.getItem(CONTACTS_STORAGE_KEY);
      if (savedContacts) {
        const parsedContacts: Contact[] = JSON.parse(savedContacts);
        setAllContacts(parsedContacts);
        if (parsedContacts.length === 0) {
          setStatusMessage("No emergency contacts added yet.");
        }
      } else {
        setAllContacts([]);
        setStatusMessage("No emergency contacts added yet.");
      }
    } catch (error) {
      console.error(
        "Failed to load all contacts for LiveLocationShareScreen",
        error
      );
      setStatusMessage("Error loading contacts.");
    } finally {
      setContactsLoaded(true);
    }
  }, []);

  // Function to load sharing status from AsyncStorage
  const loadSharingStatus = useCallback(async () => {
    try {
      const savedIsSharing = await AsyncStorage.getItem(IS_SHARING_STORAGE_KEY);
      if (savedIsSharing === "true") {
        const isTaskRunning = await TaskManager.isTaskRegisteredAsync(
          LOCATION_TRACKING_TASK
        );
        if (isTaskRunning) {
          setIsSharing(true);
          setStatusMessage("Live location sharing is active in background.");
          const currentLoc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          setCurrentLocation(currentLoc.coords);
        } else {
          setIsSharing(false);
          await AsyncStorage.setItem(IS_SHARING_STORAGE_KEY, "false");
          setStatusMessage("Ready to share location.");
        }
      }
    } catch (error) {
      console.error("Failed to load sharing status:", error);
    }
  }, []);

  // Initial setup effect: Load contacts, check auth, load sharing status
  useEffect(() => {
    loadContactsFromStorage();
    loadSharingStatus();

    if (auth) {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setCurrentUserId(user.uid);
          setStatusMessage("Authenticated. Ready to share location.");
        } else {
          setCurrentUserId(null);
          setStatusMessage("Not authenticated. Please log in.");
          signInAnonymously(auth)
            .then((userCred) => {
              setCurrentUserId(userCred.user.uid);
              setStatusMessage(
                "Authenticated anonymously. Ready to share location."
              );
            })
            .catch((err) => console.error("Anonymous auth failed:", err));
        }
        setAuthChecked(true);
      });
      return () => unsubscribe();
    } else {
      setStatusMessage(
        "Firebase Auth not initialized. Check your Firebase config."
      );
      setAuthChecked(true);
    }
  }, [loadContactsFromStorage, loadSharingStatus]);

  // Effect to handle initial sharing request from HomePage or ContactsScreen
  useEffect(() => {
    const triggerInitialSharing = async () => {
      if (startSharing && authChecked && contactsLoaded && currentUserId) {
        const isLocationEnabled = await Location.hasServicesEnabledAsync();
        if (!isLocationEnabled) {
          Alert.alert(
            "Location Services Disabled",
            "Please enable location services on your device to share your live location."
          );
          setStatusMessage("Location services disabled.");
          navigation.setParams({
            startSharing: undefined,
            targetContact: undefined,
          });
          return;
        }

        if (targetContact) {
          setSharedWithContacts([targetContact]);
          setStatusMessage(
            `Sharing with ${targetContact.name} (${targetContact.phone})`
          );
        } else {
          setSharedWithContacts(allContacts);
          setStatusMessage("Sharing with all emergency contacts.");
        }
        handleStartSharing();
        navigation.setParams({
          startSharing: undefined,
          targetContact: undefined,
        });
      } else if (
        startSharing &&
        (!authChecked || !contactsLoaded || !currentUserId)
      ) {
        setStatusMessage("Initializing... Please wait to start sharing.");
      }
    };
    triggerInitialSharing();
  }, [
    startSharing,
    targetContact,
    allContacts,
    currentUserId,
    authChecked,
    contactsLoaded,
    navigation,
  ]);

  // Effect to clean up location watcher on unmount (MODIFIED: Only stop if not sharing)
  useEffect(() => {
    return () => {
      // This effect runs when component unmounts. We only want to stop the task
      // if the user explicitly turned it off, or if the app is truly closing.
      // If isSharing is true, it means the user intends for it to continue in background.
      if (isSharing) {
        console.log(
          "LiveLocationShareScreen unmounting, sharing is active. Task will continue."
        );
      } else {
        // If sharing is already off, ensure task is stopped just in case
        TaskManager.isTaskRegisteredAsync(LOCATION_TRACKING_TASK).then(
          (isRegistered) => {
            if (isRegistered) {
              Location.stopLocationUpdatesAsync(LOCATION_TRACKING_TASK);
              console.log(
                "LiveLocationShareScreen unmounting, sharing was off. Task stopped."
              );
            }
          }
        );
      }
    };
  }, [isSharing]); // Depend on isSharing state

  // Use useFocusEffect to get current location for display when screen is focused
  useFocusEffect(
    useCallback(() => {
      let intervalId: NodeJS.Timeout | null = null;
      const getLiveLocationForDisplay = async () => {
        if (isSharing) {
          // Only fetch for display if sharing is active
          try {
            const currentLoc = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
            });
            setCurrentLocation(currentLoc.coords);
          } catch (error) {
            console.error("Error getting current location for display:", error);
          }
        }
      };

      // Fetch location immediately when screen is focused and sharing is active
      getLiveLocationForDisplay();

      // Set up interval to update location for display (not the background task)
      if (isSharing) {
        intervalId = setInterval(getLiveLocationForDisplay, 5000); // Update UI every 5 seconds
      }

      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    }, [isSharing])
  );

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
          "Background location access is required for live sharing. Please enable 'Always' location permission in your device settings."
        );
        return false;
      }
    } else {
      Alert.alert(
        "Location Denied",
        "Foreground location access is required. Please enable location permission in your device settings."
      );
      return false;
    }
  };

  const handleStartSharing = async () => {
    if (!currentUserId) {
      Alert.alert(
        "Authentication Required",
        "Please log in or wait for authentication to complete before sharing."
      );
      return;
    }
    if (sharedWithContacts.length === 0 && allContacts.length === 0) {
      // Check both sharedWith and allContacts
      Alert.alert(
        "No Contacts",
        "Please add emergency contacts first to share your location."
      );
      return;
    }

    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      setStatusMessage("Permissions not granted. Cannot start sharing.");
      return;
    }

    // Determine the actual contacts to share based on current state
    const contactsToShare = route.params?.targetContact
      ? [route.params.targetContact]
      : allContacts;
    const isGeneralShare =
      !route.params?.targetContact && contactsToShare.length > 0;

    const isTaskRunning = await TaskManager.isTaskRegisteredAsync(
      LOCATION_TRACKING_TASK
    );
    if (isTaskRunning) {
      setIsSharing(true);
      setStatusMessage("Live location sharing already active.");
      Alert.alert(
        "Sharing Already Active",
        "Your live location is already being shared."
      );
      // If already running, ensure UI reflects the correct sharedWithContacts
      if (route.params?.targetContact) {
        setSharedWithContacts([route.params.targetContact]);
      } else {
        setSharedWithContacts(allContacts);
      }
      return;
    }

    try {
      await Location.startLocationUpdatesAsync(LOCATION_TRACKING_TASK, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 10,
        deferredUpdatesInterval: 5000,
        foregroundService: {
          notificationTitle: "Live Location Sharing",
          notificationBody: "Your location is being shared for safety.",
          notificationColor: "#FF4444",
        },
        taskOptions: {
          sharingWithContacts: contactsToShare,
          isGeneralShare: isGeneralShare,
          userId: currentUserId,
        },
      });
      setIsSharing(true);
      await AsyncStorage.setItem(IS_SHARING_STORAGE_KEY, "true"); // Persist sharing status

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

      const currentLoc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation(currentLoc.coords);
    } catch (error) {
      console.error("Error starting location updates:", error);
      Alert.alert(
        "Error",
        "Failed to start live location sharing. Check permissions and try again."
      );
      setIsSharing(false);
      setStatusMessage("Failed to start sharing.");
      await AsyncStorage.setItem(IS_SHARING_STORAGE_KEY, "false");
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
      await AsyncStorage.setItem(IS_SHARING_STORAGE_KEY, "false");
      setCurrentLocation(null);
      setSharedWithContacts([]);
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
        {isSharing && sharedWithContacts.length > 0 && (
          <View style={styles.sharedWithContainer}>
            <Text style={styles.sharedWithTextTitle}>Sharing with:</Text>
            {sharedWithContacts.map((contact) => (
              <Text key={contact.id} style={styles.sharedWithText}>
                • {contact.name} ({contact.phone})
              </Text>
            ))}
          </View>
        )}
        {!isSharing && sharedWithContacts.length === 0 && contactsLoaded && (
          <Text style={styles.infoText}>
            No emergency contacts added yet. Please add contacts from the
            "Contacts" screen.
          </Text>
        )}
        {!isSharing &&
          sharedWithContacts.length > 0 &&
          !route.params?.targetContact && (
            <Text style={styles.infoText}>
              Tap "Start Sharing" to share with all {sharedWithContacts.length}{" "}
              saved emergency contacts.
            </Text>
          )}
        {!isSharing &&
          sharedWithContacts.length > 0 &&
          route.params?.targetContact && (
            <Text style={styles.infoText}>
              Tap "Start Sharing" to share with{" "}
              {route.params.targetContact.name}.
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
          disabled={
            !currentUserId ||
            (sharedWithContacts.length === 0 && !isSharing && contactsLoaded)
          }
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
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    ...GlobalStyles.shadowSmall,
    width: "90%",
    alignItems: "flex-start",
  },
  sharedWithTextTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: GlobalStyles.colors.textPrimary,
    marginBottom: 5,
  },
  sharedWithText: {
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
