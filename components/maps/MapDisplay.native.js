// components/maps/MapDisplay.js
import { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, {
  Circle,
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import { GlobalStyles } from "../../constants/GlobalStyles";

/**
 * MapDisplay Component
 * Renders the map with current location, selected location, safety reviews,
 * dangerous areas, and the calculated route.
 *
 * Props:
 * - mapRef: React ref for the MapView component.
 * - initialRegion: Initial region to display on the map.
 * - selectedLocation: Object containing coordinate, title, subtitle for a selected place.
 * - safetyReviews: Array of safety review objects.
 * - dangerousAreas: Array of dangerous area objects (latitude, longitude, radius, severity).
 * - routeCoordinates: Array of coordinates for the route polyline.
 * - routeColor: Color for the route polyline.
 * - onLongPress: Function to call when the map is long-pressed (for adding reviews).
 * - onMyLocationPress: Function to call when "My Location" button is pressed.
 * - nearbyPoliceStations: Array of nearby police station objects.
 * - nearbyHospitals: Array of nearby hospital objects.
 */
const MapDisplay = ({
  mapRef,
  initialRegion,
  selectedLocation,
  safetyReviews,
  dangerousAreas,
  routeCoordinates,
  routeColor,
  onLongPress,
  onMyLocationPress,
  nearbyPoliceStations,
  nearbyHospitals,
}) => {
  // Effect to fit map to nearby markers when they appear
  useEffect(() => {
    const allNearbyCoords = [];
    if (nearbyPoliceStations.length > 0) {
      allNearbyCoords.push(...nearbyPoliceStations.map((p) => p.coordinate));
    }
    if (nearbyHospitals.length > 0) {
      allNearbyCoords.push(...nearbyHospitals.map((p) => p.coordinate));
    }

    if (mapRef.current && allNearbyCoords.length > 0) {
      // Temporarily remove current location from fitToCoordinates to see if it helps
      // if (initialRegion?.latitude && initialRegion?.longitude) {
      //   allNearbyCoords.push({latitude: initialRegion.latitude, longitude: initialRegion.longitude});
      // }

      mapRef.current.fitToCoordinates(allNearbyCoords, {
        edgePadding: { top: 100, right: 50, bottom: 300, left: 50 }, // Adjust padding as needed
        animated: true,
      });
    }
  }, [nearbyPoliceStations, nearbyHospitals]); // Removed initialRegion from dependency array for this specific effect

  return (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsTraffic={true}
        showsBuildings={true}
        showsIndoors={true}
        onLongPress={onLongPress}
      >
        {/* Selected location marker */}
        {selectedLocation && (
          <Marker
            coordinate={selectedLocation.coordinate}
            title={selectedLocation.title}
            pinColor={GlobalStyles.colors.primary}
          />
        )}

        {/* Safety review markers */}
        {safetyReviews.map((review) => (
          <Marker
            key={`review-${review.id}`}
            coordinate={{
              latitude: review.latitude,
              longitude: review.longitude,
            }}
            title={`Safety: ${review.rating}/5`}
            description={review.comment}
            pinColor={
              review.rating <= 2
                ? GlobalStyles.colors.danger
                : review.rating >= 4
                ? GlobalStyles.colors.success
                : GlobalStyles.colors.warning
            }
          />
        ))}

        {/* Dangerous area circles */}
        {dangerousAreas.map((area, index) => (
          <Circle
            key={`danger-${index}`}
            center={{ latitude: area.latitude, longitude: area.longitude }}
            radius={area.radius}
            strokeColor="rgba(255, 68, 68, 0.6)"
            fillColor="rgba(255, 68, 68, 0.2)"
            strokeWidth={2}
          />
        ))}

        {/* Route polyline with safety color */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor={routeColor}
            strokeWidth={6}
            zIndex={2}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* Markers for nearby Police Stations */}
        {nearbyPoliceStations.map((place) => {
          return (
            <Marker
              key={`police-${place.id}`}
              coordinate={place.coordinate}
              title={place.title}
              description={place.subtitle}
              pinColor={GlobalStyles.colors.secondary} // Purple
            />
          );
        })}

        {/* Markers for nearby Hospitals */}
        {nearbyHospitals.map((place) => {
          return (
            <Marker
              key={`hospital-${place.id}`}
              coordinate={place.coordinate}
              title={place.title}
              description={place.subtitle}
              pinColor={GlobalStyles.colors.success} // Green
            />
          );
        })}
      </MapView>

      {/* My Location Button */}
      <TouchableOpacity
        style={styles.myLocationButton}
        onPress={onMyLocationPress}
      >
        <Text style={styles.myLocationIcon}>📍</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  myLocationButton: {
    position: "absolute",
    bottom: 150,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    ...GlobalStyles.shadow,
  },
  myLocationIcon: {
    fontSize: 20,
  },
});

export default MapDisplay;
