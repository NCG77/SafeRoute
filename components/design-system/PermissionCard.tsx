import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import React from "react";

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { radius, spacing, typography } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

export type PermissionImportance = "required" | "recommended";

export type PermissionStatus =
  "not_determined" | "granted" | "denied" | "blocked";

export type PermissionCardProps = {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];

  title: string;

  importance: PermissionImportance;

  why: string;

  privacy: string;

  status: PermissionStatus;

  loading?: boolean;

  onAllow: () => void;

  style?: StyleProp<ViewStyle>;
};

const STATUS_COPY: Record<PermissionStatus, string> = {
  not_determined: "Not enabled yet",

  granted: "Allowed",

  denied: "Not allowed",

  blocked: "Turn on in Settings",
};

/**

 * Trust-first permission card.

 * Status variants: not_determined | granted | denied | blocked

 * Importance variants: required | recommended

 * Allow button variants: Default | Loading | Granted (hidden/replaced) | Open Settings

 */

export function PermissionCard({
  icon,

  title,

  importance,

  why,

  privacy,

  status,

  loading = false,

  onAllow,

  style,
}: PermissionCardProps) {
  const { colors: c, elevation: elev } = useAppTheme();

  const granted = status === "granted";

  const blocked = status === "blocked";

  const denied = status === "denied";

  const allowLabel = blocked ? "Open Settings" : granted ? "Allowed" : "Allow";

  return (
    <View
      style={[
        styles.card,

        {
          backgroundColor: c.surface,

          borderColor: c.border,

          ...elev.card,
        },

        granted && {
          borderColor: c.successContainer,

          backgroundColor: c.successContainer,
        },

        style,
      ]}

      accessibilityRole="summary"

      accessibilityLabel={`${title}, ${importance}, ${STATUS_COPY[status]}`}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconWrap,

            { backgroundColor: c.primaryContainer },

            granted && { backgroundColor: c.successContainer },
          ]}
        >
          <MaterialIcons
            name={icon}

            size={24}

            color={granted ? c.success : c.primary}
          />
        </View>

        <View style={styles.headerText}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: c.textPrimary }]}>
              {title}
            </Text>

            <View
              style={[
                styles.badge,

                importance === "required"
                  ? { backgroundColor: c.primaryContainer }
                  : { backgroundColor: c.surfaceVariant },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,

                  {
                    color:
                      importance === "required"
                        ? c.primaryOnContainer
                        : c.textSecondary,
                  },
                ]}
              >
                {importance === "required" ? "Required" : "Recommended"}
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.status,

              { color: c.textTertiary },

              granted && { color: c.success },

              (denied || blocked) && { color: c.warning },
            ]}
          >
            {STATUS_COPY[status]}
          </Text>
        </View>
      </View>

      <Text style={[styles.why, { color: c.textPrimary }]}>{why}</Text>

      <Text style={[styles.privacy, { color: c.textSecondary }]}>
        {privacy}
      </Text>

      <Pressable
        onPress={onAllow}

        disabled={granted || loading}

        accessibilityRole="button"

        accessibilityLabel={`${allowLabel} ${title}`}

        accessibilityState={{ disabled: granted || loading, busy: loading }}

        style={({ pressed }) => [
          styles.allow,

          {
            borderColor: c.primary,

            backgroundColor: c.primaryContainer,
          },

          granted && {
            borderColor: c.successContainer,

            backgroundColor: c.successContainer,
          },

          pressed && !granted && !loading && styles.allowPressed,

          (granted || loading) && styles.allowDisabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={c.primary} />
        ) : (
          <>
            {granted ? (
              <MaterialIcons name="check-circle" size={18} color={c.success} />
            ) : null}

            <Text
              style={[
                styles.allowLabel,

                { color: c.primary },

                granted && { color: c.success },
              ]}
            >
              {allowLabel}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,

    padding: spacing.md,

    borderWidth: 1,

    gap: spacing.sm,
  },

  header: {
    flexDirection: "row",

    alignItems: "flex-start",

    gap: spacing.md,
  },

  iconWrap: {
    width: 48,

    height: 48,

    borderRadius: radius.lg,

    alignItems: "center",

    justifyContent: "center",
  },

  headerText: {
    flex: 1,

    gap: spacing.xs,
  },

  titleRow: {
    flexDirection: "row",

    flexWrap: "wrap",

    alignItems: "center",

    gap: spacing.sm,
  },

  title: {
    fontFamily: typography.fontFamily.semibold,

    fontSize: typography.size.title,

    lineHeight: typography.lineHeight.title,
  },

  badge: {
    paddingHorizontal: spacing.sm,

    paddingVertical: 2,

    borderRadius: radius.pill,
  },

  badgeText: {
    fontFamily: typography.fontFamily.medium,

    fontSize: typography.size.caption,

    lineHeight: typography.lineHeight.caption,
  },

  status: {
    fontFamily: typography.fontFamily.medium,

    fontSize: typography.size.caption,
  },

  why: {
    fontFamily: typography.fontFamily.regular,

    fontSize: typography.size.body,

    lineHeight: typography.lineHeight.body,
  },

  privacy: {
    fontFamily: typography.fontFamily.regular,

    fontSize: typography.size.caption,

    lineHeight: typography.lineHeight.caption + 2,
  },

  allow: {
    alignSelf: "flex-start",

    flexDirection: "row",

    alignItems: "center",

    gap: spacing.xs,

    minHeight: 40,

    paddingHorizontal: spacing.md,

    paddingVertical: spacing.sm,

    borderRadius: radius.pill,

    borderWidth: 1.5,

    marginTop: spacing.xs,
  },

  allowPressed: {
    opacity: 0.9,
  },

  allowDisabled: {
    opacity: 1,
  },

  allowLabel: {
    fontFamily: typography.fontFamily.semibold,

    fontSize: typography.size.body,
  },
});
