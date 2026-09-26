<<<<<<< HEAD
import { useColorScheme } from "@/hooks/useColorScheme";
=======
import {
  AnimatedTabIcon,
  AnimatedTabLabel,
} from "@/components/design-system/AnimatedTabIcon";
import { ProductTourOverlay } from "@/components/tour/ProductTourOverlay";
import { radius, spacing, touch, typography } from "@/constants/theme";
import { useAlertsBadge } from "@/hooks/useAlertsBadge";
import { useAppTheme } from "@/hooks/useAppTheme";
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
<<<<<<< HEAD
} from "@react-navigation/native";
import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";
=======
} from "expo-router/react-navigation";
import type { Theme } from "@react-navigation/native";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3

export const unstable_settings = {
  initialRouteName: "Home",
};

<<<<<<< HEAD
const Page = () => {
  const colorScheme = useColorScheme();
  const currentTheme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider value={currentTheme}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colorScheme === "dark" ? "#FFFFFF" : "#000000",
          tabBarInactiveTintColor:
            colorScheme === "dark" ? "#fbfbfbff" : "#333333ff",
          tabBarStyle: {
            position: "absolute",
            bottom: 20,
            left: 20,
            right: 20,
            backgroundColor: "transparent",
            backdropFilter: "blur(20px)",
            borderTopWidth: 0,
            elevation: 0,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            borderRadius: 17,
            height: 70,
            paddingBottom: 0,
            borderWidth: 1,
            borderColor:
              colorScheme === "dark"
                ? "rgba(255, 255, 255, 0.08)"
                : "rgba(0, 0, 0, 0.05)",
          },
          tabBarBackground: () => (
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor:
                  colorScheme === "dark"
                    ? "rgba(51, 51, 51, 0.3)"
                    : "rgba(255, 255, 255, 0.3)",
                backdropFilter: "blur(20px)",
                borderRadius: 17,
              }}
            />
          ),
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "500",
            marginTop: -2,
          },
          tabBarItemStyle: {
            paddingVertical: 8,
          },
        }}
      >
        <Tabs.Screen
          name="Home"
          options={{
            tabBarLabel: "Home",
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? "home" : "home-outline"}
                color={color}
                size={22}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="navigate"
          options={{
            title: "Navigate",
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? "map-marker" : "map-marker-outline"}
                color={color}
                size={22}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="SOS"
          options={{
            tabBarLabel: "SOS",
            tabBarIcon: ({ color, focused }) => (
              <View
                style={{
                  backgroundColor: "#FF0000",
                  borderRadius: 20,
                  padding: 3,
                  /* shadowColor: '#FF0000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.5,
                  shadowRadius: 4, */
                  elevation: 5,
                }}
              >
                <MaterialCommunityIcons
                  name={focused ? "alert-circle" : "alert-circle-outline"}
                  color="#FFFFFF"
                  size={22}
                />
              </View>
            ),
            tabBarLabelStyle: {
              color: "#FF0000",
              fontWeight: "bold",
            },
          }}
        />
        <Tabs.Screen
          name="contacts"
          options={{
            title: "Contacts",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "person" : "person-outline"}
                color={color}
                size={22}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, focused }) => (
              <MaterialCommunityIcons
                name={focused ? "cog" : "cog-outline"}
                color={color}
                size={22}
              />
            ),
          }}
        />
      </Tabs>
    </ThemeProvider>
  );
};

export default Page;
=======
function AlertsTabIcon({
  color,
  focused,
}: {
  color: string;
  focused: boolean;
}) {
  const { hasUnread } = useAlertsBadge();
  const { colors: c } = useAppTheme();

  return (
    <AnimatedTabIcon focused={focused} color={color}>
      {({ color: iconColor, size }) => (
        <View style={styles.iconWrap}>
          <Ionicons
            name={focused ? "notifications" : "notifications-outline"}
            color={iconColor}
            size={size}
          />
          {hasUnread ? (
            <View
              style={[styles.unreadDot, { backgroundColor: c.danger }]}
              accessibilityLabel="Unread notifications"
            />
          ) : null}
        </View>
      )}
    </AnimatedTabIcon>
  );
}

export default function TabsLayout() {
  const { colors: c, elevation: elev, isDark } = useAppTheme();
  const base = isDark ? DarkTheme : DefaultTheme;
  const currentTheme: Theme = {
    dark: base.dark,
    fonts: base.fonts,
    colors: {
      background: c.background,
      card: c.surface,
      text: c.textPrimary,
      border: c.border,
      primary: c.primary,
      notification: String(base.colors.notification),
    },
  };
  const insets = useSafeAreaInsets();
  const floatBottom = Math.max(insets.bottom, spacing.sm);
  const barHeight = touch.tabBarHeight;

  return (
    <ThemeProvider value={currentTheme}>
      <View style={styles.root}>
        <Tabs
          safeAreaInsets={{ top: 0, right: 0, bottom: 0, left: 0 }}
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: c.primary,
            tabBarInactiveTintColor: c.textSecondary,
            tabBarStyle: {
              position: "absolute",
              left: spacing.md,
              right: spacing.md,
              bottom: floatBottom,
              height: barHeight,
              paddingBottom: 8,
              paddingTop: 8,
              borderRadius: radius.xl,
              backgroundColor: c.surfaceGlass,
              borderTopWidth: 0,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: c.border,
              // Avoid Android's light rectangular elevation wash behind rounded bars.
              ...(isDark
                ? { elevation: 0, shadowOpacity: 0, shadowRadius: 0 }
                : elev.floating),
              overflow: "hidden",
            },
            tabBarItemStyle: {
              paddingVertical: 2,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontFamily: typography.fontFamily.semibold,
              marginTop: 2,
            },
            tabBarLabel: ({ focused, children }) => (
              <AnimatedTabLabel focused={focused}>
                {typeof children === "string" ? children : ""}
              </AnimatedTabLabel>
            ),
            tabBarBackground: () => (
              <View style={StyleSheet.absoluteFill}>
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      backgroundColor: c.surfaceGlass,
                      borderRadius: radius.xl,
                    },
                  ]}
                />
              </View>
            ),
          }}
        >
          <Tabs.Screen
            name="Home"
            options={{
              title: "Home",
              tabBarIcon: ({ color, focused }) => (
                <AnimatedTabIcon focused={focused} color={color}>
                  {({ color: iconColor, size }) => (
                    <MaterialCommunityIcons
                      name={focused ? "home" : "home-outline"}
                      color={iconColor}
                      size={size}
                    />
                  )}
                </AnimatedTabIcon>
              ),
            }}
          />
          <Tabs.Screen
            name="navigate"
            options={{
              title: "Map",
              tabBarIcon: ({ color, focused }) => (
                <AnimatedTabIcon focused={focused} color={color}>
                  {({ color: iconColor, size }) => (
                    <MaterialCommunityIcons
                      name={focused ? "map" : "map-outline"}
                      color={iconColor}
                      size={size}
                    />
                  )}
                </AnimatedTabIcon>
              ),
            }}
          />
          <Tabs.Screen
            name="safewalk"
            options={{
              title: "Safe Walk",
              tabBarIcon: ({ color, focused }) => (
                <AnimatedTabIcon focused={focused} color={color}>
                  {({ color: iconColor, size }) => (
                    <MaterialCommunityIcons
                      name="walk"
                      color={iconColor}
                      size={size}
                    />
                  )}
                </AnimatedTabIcon>
              ),
            }}
          />
          <Tabs.Screen
            name="alerts"
            options={{
              title: "Alerts",
              tabBarIcon: ({ color, focused }) => (
                <AlertsTabIcon color={color} focused={focused} />
              ),
            }}
          />
          <Tabs.Screen
            name="settings"
            options={{
              title: "Profile",
              tabBarIcon: ({ color, focused }) => (
                <AnimatedTabIcon focused={focused} color={color}>
                  {({ color: iconColor, size }) => (
                    <Ionicons
                      name={focused ? "person-circle" : "person-circle-outline"}
                      color={iconColor}
                      size={size}
                    />
                  )}
                </AnimatedTabIcon>
              ),
            }}
          />
          <Tabs.Screen name="SOS" options={{ href: null }} />
          <Tabs.Screen name="contacts" options={{ href: null }} />
        </Tabs>
        <ProductTourOverlay />
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadDot: {
    position: "absolute",
    top: 1,
    right: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
