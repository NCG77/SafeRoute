import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import React, { useEffect, useRef, useState } from "react";

import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { radius, spacing, typography } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

export type FieldStatus = "default" | "error" | "success";

export type AuthTextFieldProps = Omit<TextInputProps, "style"> & {
  label: string;

  value: string;

  onChangeText: (text: string) => void;

  /** Supporting / error / success message under the field */

  helperText?: string;

  status?: FieldStatus;

  /** Enables eye toggle; forces secure entry when hidden */

  password?: boolean;

  leadingIcon?: React.ComponentProps<typeof MaterialIcons>["name"];

  /** Fixed prefix inside the field (e.g. country code "+91") */

  prefix?: string;

  containerStyle?: StyleProp<ViewStyle>;

  keyboardType?: KeyboardTypeOptions;
};

/**

 * Soft filled field with a label that floats when the field is focused or filled.

 */

export function AuthTextField({
  label,

  value,

  onChangeText,

  helperText,

  status = "default",

  password = false,

  leadingIcon,

  prefix,

  containerStyle,

  editable = true,

  keyboardType,

  ...rest
}: AuthTextFieldProps) {
  const { colors: c } = useAppTheme();

  const [focused, setFocused] = useState(false);

  const [visible, setVisible] = useState(false);

  const lift = useRef(new Animated.Value(value.length > 0 ? 1 : 0)).current;

  const isError = status === "error";

  const isSuccess = status === "success";

  const disabled = editable === false;

  const floated = focused || value.length > 0;

  useEffect(() => {
    Animated.timing(lift, {
      toValue: floated ? 1 : 0,

      duration: 160,

      useNativeDriver: false,
    }).start();
  }, [floated, lift]);

  const labelTop = lift.interpolate({
    inputRange: [0, 1],

    outputRange: [20, 8],
  });

  const labelSize = lift.interpolate({
    inputRange: [0, 1],

    outputRange: [16, 12],
  });

  const labelColor = isError
    ? c.errorText
    : isSuccess
      ? c.successText
      : focused
        ? c.primary
        : c.textLabel;

  const helperColor = isError
    ? c.errorText
    : isSuccess
      ? c.successText
      : c.textTertiary;

  const fill = disabled
    ? c.border
    : isError
      ? c.dangerContainer
      : isSuccess
        ? c.successContainer
        : focused
          ? c.primaryLight
          : c.surfaceVariant;

  const labelLeft = leadingIcon ? 48 : spacing.md;

  return (
    <View style={[styles.wrap, containerStyle]}>
      <View style={[styles.field, { backgroundColor: fill }]}>
        {leadingIcon ? (
          <MaterialIcons
            name={leadingIcon}

            size={22}

            color={labelColor}

            style={styles.leading}
          />
        ) : null}

        <Animated.Text
          style={[
            styles.label,

            {
              color: labelColor,

              top: labelTop,

              left: labelLeft,

              fontSize: labelSize,
            },
          ]}

          pointerEvents="none"
        >
          {label}
        </Animated.Text>

        <View style={styles.inputRow}>
          {prefix && floated ? (
            <Text
              style={[styles.prefix, { color: c.textSecondary }]}

              accessibilityElementsHidden
            >
              {prefix}
            </Text>
          ) : null}

          <TextInput
            value={value}

            onChangeText={onChangeText}

            editable={editable}

            keyboardType={keyboardType}

            secureTextEntry={password && !visible}

            placeholderTextColor="transparent"

            onFocus={(e) => {
              setFocused(true);

              rest.onFocus?.(e);
            }}

            onBlur={(e) => {
              setFocused(false);

              rest.onBlur?.(e);
            }}

            style={[
              styles.input,

              { color: c.textPrimary },

              disabled && { color: c.textTertiary },
            ]}

            accessibilityLabel={prefix ? `${label}, ${prefix}` : label}

            accessibilityState={{ disabled }}

            accessibilityHint={helperText}

            {...rest}
          />
        </View>

        {password ? (
          <Pressable
            onPress={() => setVisible((v) => !v)}

            hitSlop={10}

            accessibilityRole="button"

            accessibilityLabel={visible ? "Hide password" : "Show password"}

            style={styles.trailing}
          >
            <MaterialIcons
              name={visible ? "visibility-off" : "visibility"}

              size={22}

              color={c.textSecondary}
            />
          </Pressable>
        ) : isSuccess ? (
          <MaterialIcons
            name="check-circle"

            size={20}

            color={c.success}

            style={styles.trailing}
          />
        ) : isError ? (
          <MaterialIcons
            name="error-outline"

            size={20}

            color={c.danger}

            style={styles.trailing}
          />
        ) : null}
      </View>

      {helperText ? (
        <Text style={[styles.helper, { color: helperColor }]}>
          {helperText}
        </Text>
      ) : (
        <View style={styles.helperSpacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
  },

  field: {
    flexDirection: "row",

    alignItems: "flex-end",

    minHeight: 64,

    borderRadius: radius.lg,

    paddingHorizontal: spacing.md,

    paddingBottom: 8,
  },

  leading: {
    marginRight: spacing.sm,

    marginBottom: 2,
  },

  label: {
    position: "absolute",

    fontFamily: typography.fontFamily.medium,
  },

  inputRow: {
    flex: 1,

    flexDirection: "row",

    alignItems: "center",

    minHeight: 24,
  },

  prefix: {
    fontFamily: typography.fontFamily.semibold,

    fontSize: typography.size.bodyLarge,

    lineHeight: typography.lineHeight.bodyLarge,

    marginRight: spacing.xs,
  },

  input: {
    flex: 1,

    fontFamily: typography.fontFamily.regular,

    fontSize: typography.size.bodyLarge,

    lineHeight: typography.lineHeight.bodyLarge,

    padding: 0,

    margin: 0,

    height: 24,
  },

  trailing: {
    marginLeft: spacing.sm,

    marginBottom: 0,

    padding: spacing.xs,
  },

  helper: {
    fontFamily: typography.fontFamily.regular,

    fontSize: typography.size.caption,

    lineHeight: typography.lineHeight.caption,

    marginTop: spacing.xs,

    marginLeft: spacing.sm,

    minHeight: 16,
  },

  helperSpacer: {
    height: spacing.xs,
  },
});
