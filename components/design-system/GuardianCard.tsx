import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import React from "react";

import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { UserAvatar } from "@/components/design-system/UserAvatar";

import { radius, spacing, typography } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

import type { Guardian } from "@/core/guardians";

export type GuardianCardProps = {
  guardian: Guardian;

  onTogglePrimary: (id: string, value: boolean) => void;

  onCall?: (guardian: Guardian) => void;

  onRemove?: (guardian: Guardian) => void;

  onResendInvite?: (guardian: Guardian) => void;

  onMarkVerified?: (guardian: Guardian) => void;

  style?: StyleProp<ViewStyle>;
};

/**

 * Trusted guardian list card.

 * Variants: Primary | Secondary × Verified | Pending

 */

export function GuardianCard({
  guardian,

  onTogglePrimary,

  onCall,

  onRemove,

  onResendInvite,

  onMarkVerified,

  style,
}: GuardianCardProps) {
  const { colors: c, elevation: elev } = useAppTheme();

  return (
    <View
      style={[
        styles.card,

        {
          backgroundColor: c.surface,

          borderColor: c.border,

          ...elev.card,
        },

        guardian.isPrimary && {
          borderColor: c.primaryContainer,

          backgroundColor: c.backgroundSelected,
        },

        style,
      ]}

      accessibilityLabel={`${guardian.name}, ${guardian.relationship}${
        guardian.isPrimary ? ", primary guardian" : ""
      }, ${guardian.verified ? "verified" : "invite pending"}`}
    >
      <View style={styles.top}>
        <UserAvatar name={guardian.name} size={52} />

        <View style={styles.meta}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.name, { color: c.textPrimary }]}
              numberOfLines={1}
            >
              {guardian.name}
            </Text>

            <View
              style={[
                styles.badge,

                guardian.verified
                  ? { backgroundColor: c.successContainer }
                  : { backgroundColor: c.warningContainer },
              ]}
            >
              <MaterialIcons
                name={guardian.verified ? "verified" : "schedule"}

                size={14}

                color={guardian.verified ? c.success : c.warning}
              />

              <Text
                style={[
                  styles.badgeText,

                  {
                    color: guardian.verified ? c.success : c.warning,
                  },
                ]}
              >
                {guardian.verified ? "Verified" : "Pending"}
              </Text>
            </View>
          </View>

          <Text style={[styles.phone, { color: c.textSecondary }]}>
            +91 {guardian.phone}
          </Text>

          <Text style={[styles.relationship, { color: c.primary }]}>
            {guardian.relationship}
          </Text>
        </View>
      </View>

      <View style={[styles.primaryRow, { borderTopColor: c.divider }]}>
        <View style={styles.primaryCopy}>
          <Text style={[styles.primaryLabel, { color: c.textPrimary }]}>
            Primary Guardian
          </Text>

          <Text style={[styles.primaryHint, { color: c.textTertiary }]}>
            First notified for Safe Walk and SOS
          </Text>
        </View>

        <Switch
          value={guardian.isPrimary}

          onValueChange={(value) => onTogglePrimary(guardian.id, value)}

          trackColor={{
            false: c.border,

            true: c.primaryContainer,
          }}

          thumbColor={guardian.isPrimary ? c.primary : c.textTertiary}

          accessibilityLabel={`Primary guardian for ${guardian.name}`}
        />
      </View>

      <View style={styles.actions}>
        {onCall ? (
          <Pressable
            onPress={() => onCall(guardian)}

            style={({ pressed }) => [
              styles.actionBtn,

              { backgroundColor: c.surfaceVariant },

              pressed && styles.pressed,
            ]}

            accessibilityRole="button"

            accessibilityLabel={`Call ${guardian.name}`}
          >
            <MaterialIcons name="phone" size={18} color={c.primary} />

            <Text style={[styles.actionLabel, { color: c.primary }]}>Call</Text>
          </Pressable>
        ) : null}

        {!guardian.verified && onMarkVerified ? (
          <Pressable
            onPress={() => onMarkVerified(guardian)}

            style={({ pressed }) => [
              styles.actionBtn,

              { backgroundColor: c.surfaceVariant },

              pressed && styles.pressed,
            ]}

            accessibilityRole="button"

            accessibilityLabel={`Mark ${guardian.name} as verified`}
          >
            <MaterialIcons name="verified" size={18} color={c.success} />

            <Text style={[styles.actionLabel, { color: c.success }]}>
              Verify
            </Text>
          </Pressable>
        ) : null}

        {!guardian.verified && onResendInvite ? (
          <Pressable
            onPress={() => onResendInvite(guardian)}

            style={({ pressed }) => [
              styles.actionBtn,

              { backgroundColor: c.surfaceVariant },

              pressed && styles.pressed,
            ]}

            accessibilityRole="button"

            accessibilityLabel={`Resend invite to ${guardian.name}`}
          >
            <MaterialIcons name="send" size={18} color={c.primary} />

            <Text style={[styles.actionLabel, { color: c.primary }]}>
              Resend
            </Text>
          </Pressable>
        ) : null}

        {onRemove ? (
          <Pressable
            onPress={() => onRemove(guardian)}

            style={({ pressed }) => [
              styles.actionBtn,

              { backgroundColor: c.surfaceVariant },

              pressed && styles.pressed,
            ]}

            accessibilityRole="button"

            accessibilityLabel={`Remove ${guardian.name}`}
          >
            <MaterialIcons name="person-remove" size={18} color={c.danger} />

            <Text style={[styles.actionLabel, { color: c.danger }]}>
              Remove
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,

    padding: spacing.md,

    borderWidth: 1,

    gap: spacing.md,
  },

  top: {
    flexDirection: "row",

    gap: spacing.md,
  },

  meta: {
    flex: 1,

    gap: 2,
  },

  nameRow: {
    flexDirection: "row",

    alignItems: "center",

    flexWrap: "wrap",

    gap: spacing.sm,
  },

  name: {
    flexShrink: 1,

    fontFamily: typography.fontFamily.semibold,

    fontSize: typography.size.title,

    lineHeight: typography.lineHeight.title,
  },

  badge: {
    flexDirection: "row",

    alignItems: "center",

    gap: 4,

    paddingHorizontal: spacing.sm,

    paddingVertical: 2,

    borderRadius: radius.pill,
  },

  badgeText: {
    fontFamily: typography.fontFamily.medium,

    fontSize: typography.size.caption,
  },

  phone: {
    fontFamily: typography.fontFamily.regular,

    fontSize: typography.size.body,
  },

  relationship: {
    fontFamily: typography.fontFamily.medium,

    fontSize: typography.size.caption,

    marginTop: 2,
  },

  primaryRow: {
    flexDirection: "row",

    alignItems: "center",

    gap: spacing.md,

    paddingTop: spacing.sm,

    borderTopWidth: StyleSheet.hairlineWidth,
  },

  primaryCopy: {
    flex: 1,
  },

  primaryLabel: {
    fontFamily: typography.fontFamily.semibold,

    fontSize: typography.size.body,
  },

  primaryHint: {
    fontFamily: typography.fontFamily.regular,

    fontSize: typography.size.caption,

    marginTop: 2,
  },

  actions: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: spacing.sm,
  },

  actionBtn: {
    flexDirection: "row",

    alignItems: "center",

    gap: 4,

    paddingVertical: spacing.xs,

    paddingHorizontal: spacing.sm,

    borderRadius: radius.pill,

    minHeight: 36,
  },

  pressed: {
    opacity: 0.75,
  },

  actionLabel: {
    fontFamily: typography.fontFamily.medium,

    fontSize: typography.size.caption,
  },
});
