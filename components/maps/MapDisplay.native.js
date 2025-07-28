// components/MapDisplay.js
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
}) => {
  return (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={false} // Custom button is used instead
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
            pinColor={GlobalStyles.colors.primary} // Google blue
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
                ? GlobalStyles.colors.danger // Red for unsafe
                : review.rating >= 4
                ? GlobalStyles.colors.success // Green for safe
                : GlobalStyles.colors.warning // Orange for caution
            }
          />
        ))}

        {/* Dangerous area circles */}
        {dangerousAreas.map((area, index) => (
          <Circle
            key={`danger-${index}`}
            center={{ latitude: area.latitude, longitude: area.longitude }}
            radius={area.radius} // Radius in meters
            strokeColor="rgba(255, 68, 68, 0.6)" // Red border
            fillColor="rgba(255, 68, 68, 0.2)" // Light red fill
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
    bottom: 150, // Adjusted to not overlap with bottom sheets
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
