import React from "react";

import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { radius, spacing, typography } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

export type NavTab = {
  key: string;

  label: string;

  icon: React.ComponentProps<typeof MaterialIcons>["name"];

  sos?: boolean;
};

export type BottomNavigationProps = {
  tabs: NavTab[];

  activeKey: string;

  onChange: (key: string) => void;

  style?: StyleProp<ViewStyle>;
};

export function BottomNavigation({
  tabs,

  activeKey,

  onChange,

  style,
}: BottomNavigationProps) {
  const { colors: c, elevation: elev } = useAppTheme();

  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,

        {
          paddingBottom: Math.max(insets.bottom, spacing.sm),

          backgroundColor: c.surfaceGlass,

          ...elev.sheet,
        },

        style,
      ]}
    >
      {tabs.map((tab) => {
        const active = tab.key === activeKey;

        if (tab.sos) {
          return (
            <Pressable
              key={tab.key}

              accessibilityRole="tab"

              accessibilityState={{ selected: active }}

              onPress={() => onChange(tab.key)}

              style={styles.sosSlot}
            >
              <View
                style={[
                  styles.sosOrb,

                  { backgroundColor: c.danger, ...elev.fab },
                ]}
              >
                <Text style={[styles.sosLabel, { color: c.textOnDanger }]}>
                  SOS
                </Text>
              </View>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={tab.key}

            accessibilityRole="tab"

            accessibilityState={{ selected: active }}

            onPress={() => onChange(tab.key)}

            style={styles.item}
          >
            <MaterialIcons
              name={tab.icon}

              size={24}

              color={active ? c.primary : c.textSecondary}
            />

            <Text
              style={[
                styles.label,

                { color: c.textSecondary },

                active && styles.labelActive,

                active && { color: c.primary },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",

    alignItems: "flex-end",

    justifyContent: "space-around",

    borderTopLeftRadius: radius.xl,

    borderTopRightRadius: radius.xl,

    paddingTop: spacing.sm,

    paddingHorizontal: spacing.sm,
  },

  item: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    gap: spacing.xs,

    minHeight: 48,

    paddingVertical: spacing.xs,
  },

  label: {
    fontFamily: typography.fontFamily.medium,

    fontSize: typography.size.caption,
  },

  labelActive: {
    fontFamily: typography.fontFamily.semibold,
  },

  sosSlot: {
    flex: 1,

    alignItems: "center",

    marginTop: -20,
  },

  sosOrb: {
    width: 56,

    height: 56,

    borderRadius: radius.full,

    alignItems: "center",

    justifyContent: "center",
  },

  sosLabel: {
    fontFamily: typography.fontFamily.bold,

    fontSize: 12,

    letterSpacing: 0.5,
  },
});
