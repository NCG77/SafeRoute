import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { motion, radius, spacing, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

export type DesignSearchBarProps = TextInputProps & {
  onClear?: () => void;
  onMicPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  showMic?: boolean;
  variant?: "default" | "hero";
};

export function DesignSearchBar({
  value,
  onClear,
  onMicPress,
  containerStyle,
  showMic = true,
  variant = "default",
  placeholder = "Where do you want to go safely?",
  onFocus,
  onBlur,
  ...rest
}: DesignSearchBarProps) {
  const { colors: c, elevation: elev } = useAppTheme();
  const hasValue = typeof value === "string" && value.length > 0;
  const [focused, setFocused] = useState(false);
  const expand = useRef(new Animated.Value(0)).current;
  const placeholderFade = useRef(new Animated.Value(hasValue ? 0 : 1)).current;

  const runFocus = (next: boolean) => {
    setFocused(next);
    Animated.parallel([
      Animated.timing(expand, {
        toValue: next ? 1 : 0,
        duration: motion.normal,
        useNativeDriver: false,
      }),
      Animated.timing(placeholderFade, {
        toValue: hasValue || next ? 0.35 : 1,
        duration: motion.fast,
        useNativeDriver: false,
      }),
    ]).start();
  };

  React.useEffect(() => {
    Animated.timing(placeholderFade, {
      toValue: hasValue ? 0 : focused ? 0.35 : 1,
      duration: motion.fast,
      useNativeDriver: false,
    }).start();
  }, [hasValue, focused, placeholderFade]);

  const scaleX = expand.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.02],
  });

  const placeholderColor = placeholderFade.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [c.textDisabled, c.textTertiary, c.textTertiary],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: c.surface,
          borderColor: focused ? c.borderFocus : c.border,
          ...elev.floating,
        },
        variant === "hero" && styles.hero,
        variant === "hero" && {
          borderWidth: 2,
          borderColor: "#FFFFFF",
        },
        focused && variant !== "hero" && { borderColor: c.borderFocus },
        focused && { shadowOpacity: 0.14 },
        { transform: [{ scaleX }] },
        containerStyle,
      ]}
    >
      <MaterialIcons
        name="search"
        size={22}
        color={c.primary}
        style={styles.leading}
      />
      <View style={styles.inputWrap}>
        {!hasValue ? (
          <Animated.Text
            pointerEvents="none"
            style={[
              styles.placeholder,
              { opacity: placeholderFade, color: placeholderColor as never },
            ]}
          >
            {placeholder}
          </Animated.Text>
        ) : null}
        <TextInput
          value={value}
          placeholder=""
          style={[
            styles.input,
            { color: c.textPrimary },
            variant === "hero" && styles.heroInput,
          ]}
          returnKeyType="search"
          accessibilityLabel="Search destination"
          onFocus={(e) => {
            runFocus(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            runFocus(false);
            onBlur?.(e);
          }}
          {...rest}
        />
      </View>
      {hasValue && onClear ? (
        <Pressable
          onPress={onClear}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          style={styles.iconBtn}
        >
          <MaterialIcons name="close" size={20} color={c.textSecondary} />
        </Pressable>
      ) : showMic ? (
        <Pressable
          onPress={onMicPress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Voice search"
          style={styles.iconBtn}
        >
          <MaterialIcons name="mic-none" size={22} color={c.textSecondary} />
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    paddingHorizontal: spacing.md,
    borderRadius: radius.search,
    borderWidth: StyleSheet.hairlineWidth,
  },
  leading: {
    marginRight: spacing.sm,
  },
  inputWrap: {
    flex: 1,
    justifyContent: "center",
  },
  placeholder: {
    position: "absolute",
    left: 0,
    right: 0,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.body,
    lineHeight: typography.lineHeight.body,
  },
  input: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.body,
    lineHeight: typography.lineHeight.body,
    paddingVertical: spacing.sm,
  },
  iconBtn: {
    padding: spacing.xs,
    minWidth: 40,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    minHeight: 68,
    paddingHorizontal: spacing.lg,
  },
  heroInput: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.size.bodyLarge,
  },
});
