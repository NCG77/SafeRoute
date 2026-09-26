// components/maps/MapDisplay.web.js
import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GlobalStyles } from "../../constants/GlobalStyles";

/**
 * MapDisplay Component - Web Version
 * This is a web-compatible implementation that doesn't use react-native-maps
 * since it's not compatible with web platforms.
 */
const MapDisplay = ({
  mapRef,
  initialRegion,
  selectedLocation,
  safetyReviews = [],
  dangerousAreas = [],
  routeCoordinates = [],
  routeColor,
  onLongPress,
  onMyLocationPress,
  nearbyPoliceStations = [],
  nearbyHospitals = [],
}) => {
  const webMapRef = useRef(null);

  useEffect(() => {
    console.log("MapDisplay Web: Component mounted");
    console.log("Initial region:", initialRegion);
    console.log("Selected location:", selectedLocation);
    console.log("Safety reviews count:", safetyReviews.length);
    console.log("Dangerous areas count:", dangerousAreas.length);
    console.log("Route coordinates count:", routeCoordinates.length);
    console.log("Nearby police stations count:", nearbyPoliceStations.length);
    console.log("Nearby hospitals count:", nearbyHospitals.length);
  }, []);

  const handleWebMapClick = () => {
    if (onLongPress) {
      onLongPress({
        nativeEvent: {
<<<<<<< HEAD
          coordinate: initialRegion || { latitude: 0, longitude: 0 }
        }
=======
          coordinate: initialRegion || { latitude: 0, longitude: 0 },
        },
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
      });
    }
  };

  return (
    <View style={styles.mapContainer}>
<<<<<<< HEAD
      <View 
        style={styles.webMapPlaceholder} 
        ref={webMapRef}
        onClick={handleWebMapClick}
      >
        <Text style={styles.placeholderText}>
          🗺️ Web Map View
        </Text>
=======
      <View
        style={styles.webMapPlaceholder}
        ref={webMapRef}
        onClick={handleWebMapClick}
      >
        <Text style={styles.placeholderText}>🗺️ Web Map View</Text>
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
        <Text style={styles.placeholderSubtext}>
          Interactive map features are optimized for mobile.
          {"\n"}
          For full functionality, please use the mobile app.
        </Text>
<<<<<<< HEAD
        
        {initialRegion && (
          <Text style={styles.infoText}>
            📍 Current Region: {initialRegion.latitude?.toFixed(4)}, {initialRegion.longitude?.toFixed(4)}
          </Text>
        )}
        
=======

        {initialRegion && (
          <Text style={styles.infoText}>
            📍 Current Region: {initialRegion.latitude?.toFixed(4)},{" "}
            {initialRegion.longitude?.toFixed(4)}
          </Text>
        )}

>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
        {selectedLocation && (
          <Text style={styles.infoText}>
            🎯 Selected: {selectedLocation.title || "Unknown location"}
          </Text>
        )}
<<<<<<< HEAD
        
=======

>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
        {safetyReviews.length > 0 && (
          <Text style={styles.infoText}>
            🛡️ Safety Reviews: {safetyReviews.length}
          </Text>
        )}
<<<<<<< HEAD
        
=======

>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
        {dangerousAreas.length > 0 && (
          <Text style={styles.infoText}>
            ⚠️ Dangerous Areas: {dangerousAreas.length}
          </Text>
        )}
<<<<<<< HEAD
        
=======

>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
        {routeCoordinates.length > 0 && (
          <Text style={styles.infoText}>
            🛣️ Route Points: {routeCoordinates.length}
          </Text>
        )}
<<<<<<< HEAD
        
        {(nearbyPoliceStations.length > 0 || nearbyHospitals.length > 0) && (
          <Text style={styles.infoText}>
            🚔 Police: {nearbyPoliceStations.length} | 🏥 Hospitals: {nearbyHospitals.length}
          </Text>
        )}
        
=======

        {(nearbyPoliceStations.length > 0 || nearbyHospitals.length > 0) && (
          <Text style={styles.infoText}>
            🚔 Police: {nearbyPoliceStations.length} | 🏥 Hospitals:{" "}
            {nearbyHospitals.length}
          </Text>
        )}

>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
        {onMyLocationPress && (
          <TouchableOpacity
            style={styles.myLocationButton}
            onPress={onMyLocationPress}
          >
            <Text style={styles.myLocationButtonText}>📍 My Location</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
  },
  webMapPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 20,
    borderRadius: 8,
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  placeholderSubtext: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 24,
  },
  infoText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 8,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  myLocationButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  myLocationButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

<<<<<<< HEAD
export default MapDisplay;
=======
export default MapDisplay;
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
