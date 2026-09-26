import React from "react";

import {
  Image,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { radius, typography } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

export type UserAvatarProps = {
  name?: string;

  uri?: string | null;

  source?: ImageSourcePropType;

  size?: number;

  style?: StyleProp<ViewStyle>;
};

function initialsFrom(name?: string): string {
  if (!name?.trim()) return "?";

  const parts = name.trim().split(/\s+/);

  const first = parts[0]?.[0] ?? "";

  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";

  return (first + last).toUpperCase();
}

export function UserAvatar({
  name,

  uri,

  source,

  size = 40,

  style,
}: UserAvatarProps) {
  const { colors: c } = useAppTheme();

  const imageSource = source ?? (uri ? { uri } : undefined);

  return (
    <View
      accessibilityRole="image"

      accessibilityLabel={name ? `Avatar for ${name}` : "User avatar"}

      style={[
        styles.base,

        {
          width: size,

          height: size,

          borderRadius: radius.full,

          backgroundColor: c.primaryContainer,
        },

        style,
      ]}
    >
      {imageSource ? (
        <Image source={imageSource} style={styles.image} />
      ) : (
        <Text
          style={[
            styles.initials,

            { fontSize: size * 0.36, color: c.primaryOnContainer },
          ]}
        >
          {initialsFrom(name)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",

    justifyContent: "center",

    overflow: "hidden",
  },

  image: {
    width: "100%",

    height: "100%",
  },

  initials: {
    fontFamily: typography.fontFamily.semibold,
  },
});
