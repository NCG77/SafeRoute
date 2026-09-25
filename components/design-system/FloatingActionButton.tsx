import { LinearGradient } from "expo-linear-gradient";

import React, { useRef } from "react";

import {
  Animated,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { motion, radius, touch } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

export type FloatingActionButtonProps = {
  icon?: React.ComponentProps<typeof MaterialIcons>["name"];

  onPress?: () => void;

  accessibilityLabel: string;

  variant?: "primary" | "surface";

  style?: StyleProp<ViewStyle>;
};

export function FloatingActionButton({
  icon = "add",

  onPress,

  accessibilityLabel,

  variant = "primary",

  style,
}: FloatingActionButtonProps) {
  const { colors: c, elevation: elev, gradients: grads } = useAppTheme();

  const isPrimary = variant === "primary";

  const scale = useRef(new Animated.Value(1)).current;

  const animate = (down: boolean) => {
    Animated.spring(scale, {
      toValue: down ? motion.pressScale : 1,

      useNativeDriver: true,

      friction: 7,

      tension: 160,
    }).start();
  };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        accessibilityRole="button"

        accessibilityLabel={accessibilityLabel}

        onPress={onPress}

        onPressIn={() => animate(true)}

        onPressOut={() => animate(false)}

        style={[
          styles.fab,

          !isPrimary && {
            backgroundColor: c.surface,

            borderWidth: 1,

            borderColor: c.border,
          },

          isPrimary && elev.fab,
        ]}
      >
        {isPrimary ? (
          <LinearGradient
            colors={[...grads.primaryButton]}

            start={{ x: 0, y: 0 }}

            end={{ x: 1, y: 1 }}

            style={styles.fill}
          >
            <MaterialIcons name={icon} size={26} color={c.textOnPrimary} />
          </LinearGradient>
        ) : (
          <MaterialIcons name={icon} size={26} color={c.primary} />
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fab: {
    width: touch.fabSize,

    height: touch.fabSize,

    borderRadius: radius.full,

    alignItems: "center",

    justifyContent: "center",

    overflow: "hidden",
  },

  fill: {
    width: "100%",

    height: "100%",

    alignItems: "center",

    justifyContent: "center",
  },
});
