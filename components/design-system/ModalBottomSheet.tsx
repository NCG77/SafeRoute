import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { motion, radius, spacing, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export type ModalBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Sticky actions below a scrollable body (keeps CTAs reachable). */
  footer?: React.ReactNode;
  /**
   * Wrap children in a vertical ScrollView (default true).
   * Set false when the child already owns scrolling (e.g. DestinationSearchSheet).
   */
  scrollable?: boolean;
  heightRatio?: number;
  style?: StyleProp<ViewStyle>;
};

export function ModalBottomSheet({
  visible,
  onClose,
  title,
  children,
  footer,
  scrollable = true,
  heightRatio = 0.45,
  style,
}: ModalBottomSheetProps) {
  const { colors: c, elevation: elev } = useAppTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const sheetHeight = SCREEN_HEIGHT * heightRatio;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: motion.normal,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 9,
          tension: 65,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: motion.fast,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: sheetHeight,
          duration: motion.normal,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacity, translateY, sheetHeight]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View
          style={[styles.scrim, { opacity, backgroundColor: c.scrim }]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              paddingBottom: Math.max(insets.bottom, spacing.md),
              backgroundColor: c.surface,
              ...elev.sheet,
              transform: [{ translateY }],
            },
            style,
          ]}
        >
          <Pressable
            onPress={onClose}
            style={styles.handleHit}
            accessibilityRole="button"
            accessibilityLabel="Close sheet"
          >
            <View style={[styles.handle, { backgroundColor: c.border }]} />
          </Pressable>

          {title ? (
            <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text>
          ) : null}

          <View style={styles.body}>
            {scrollable ? (
              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
              >
                {children}
              </ScrollView>
            ) : (
              children
            )}
          </View>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  scrim: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
  },
  handleHit: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: radius.pill,
  },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.size.title,
    lineHeight: typography.lineHeight.title,
    marginBottom: spacing.md,
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  footer: {
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
});
