import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, type StyleProp, type TextStyle } from "react-native";
import { gradients, typography } from "@/constants/theme";

export type GradientTextProps = {
  children: string;
  colors?: readonly [string, string, ...string[]];
  style?: StyleProp<TextStyle>;
};

/** Indigo gradient fill for important words / greetings (visual only). */
export function GradientText({
  children,
  colors = gradients.important,
  style,
}: GradientTextProps) {
  return (
    <MaskedView
      maskElement={<Text style={[styles.mask, style]}>{children}</Text>}
    >
      <LinearGradient
        colors={[...colors]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={[styles.mask, style, styles.invisible]}>{children}</Text>
      </LinearGradient>
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  mask: {
    fontFamily: typography.fontFamily.bold,
    backgroundColor: "transparent",
  },
  invisible: {
    opacity: 0,
  },
});
