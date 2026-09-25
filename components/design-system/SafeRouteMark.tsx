import { Image } from "expo-image";
import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

type SafeRouteMarkProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * SafeRoute brand mark — natural path + shield logo.
 * Soft teal/indigo mark used across welcome, auth, and permissions.
 */
export function SafeRouteMark({ size = 52, style }: SafeRouteMarkProps) {
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="SafeRoute"
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size * 0.22,
        },
        style,
      ]}
    >
      <Image
        source={require("../../assets/images/saferoute-logo.png")}
        style={{ width: size, height: size }}
        contentFit="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
});