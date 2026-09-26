import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import React from "react";

import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { radius, spacing, typography } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

export type SegmentOption<T extends string> = {
  value: T;

  label: string;

  icon?: React.ComponentProps<typeof MaterialIcons>["name"];
};

export type SegmentedControlProps<T extends string> = {
  options: SegmentOption<T>[];

  value: T;

  onChange: (value: T) => void;

  style?: StyleProp<ViewStyle>;

  accessibilityLabel?: string;
};

/**

 * Pill segmented control. Selected segment is a solid indigo fill.

 */

export function SegmentedControl<T extends string>({
  options,

  value,

  onChange,

  style,

  accessibilityLabel = "Authentication method",
}: SegmentedControlProps<T>) {
  const { colors: c } = useAppTheme();

  return (
    <View
      style={[styles.track, { backgroundColor: c.surfaceVariant }, style]}

      accessibilityRole="tablist"

      accessibilityLabel={accessibilityLabel}
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <Pressable
            key={option.value}

            accessibilityRole="tab"

            accessibilityState={{ selected }}

            onPress={() => onChange(option.value)}

            style={[styles.segment, selected && { backgroundColor: c.primary }]}
          >
            {option.icon ? (
              <MaterialIcons
                name={option.icon}

                size={18}

                color={selected ? c.textOnPrimary : c.textSecondary}
              />
            ) : null}

            <Text
              style={[
                styles.label,

                { color: c.textSecondary },

                selected && styles.labelSelected,

                selected && { color: c.textOnPrimary },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",

    borderRadius: radius.pill,

    padding: 4,

    gap: 4,

    minHeight: 56,
  },

  segment: {
    flex: 1,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: spacing.sm,

    minHeight: 48,

    paddingVertical: spacing.sm,

    borderRadius: radius.pill,
  },

  label: {
    fontFamily: typography.fontFamily.medium,

    fontSize: typography.size.body,

    lineHeight: typography.lineHeight.body,
  },

  labelSelected: {
    fontFamily: typography.fontFamily.semibold,
  },
});
