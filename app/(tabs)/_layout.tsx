import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Tabs } from "expo-router";
import React from "react";
import { View } from "react-native";

export const unstable_settings = {
    initialRouteName: "(tabs)",
};

const Page = () => {
    const colorScheme = useColorScheme();
    const currentTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;

    return (
        <ThemeProvider value={currentTheme}>
            <Tabs
              screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
              tabBarInactiveTintColor: colorScheme === 'dark' ? '#fbfbfbff' : '#333333ff',
              tabBarStyle: {
                position: 'absolute',
                bottom: 20,
                left: 20,
                right: 20,
                backgroundColor: 'transparent',
                backdropFilter: 'blur(20px)',
                borderTopWidth: 0,
                elevation: 0,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                borderRadius: 17,
                height: 70,
                paddingBottom: 0,
                borderWidth: 1,
                borderColor: colorScheme === 'dark' 
                ? 'rgba(255, 255, 255, 0.08)' 
                : 'rgba(0, 0, 0, 0.05)',
              },
              tabBarBackground: () => (
                <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: colorScheme === 'dark' 
                  ? 'rgba(51, 51, 51, 0.3)' 
                  : 'rgba(255, 255, 255, 0.3)',
                backdropFilter: 'blur(20px)',
                borderRadius: 17,
                }} />
              ),
              tabBarLabelStyle: {
                fontSize: 11,
                fontWeight: '500',
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
                <View style={{
                  backgroundColor: '#FF0000',
                  borderRadius: 20,
                  padding: 3,
                  /* shadowColor: '#FF0000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.5,
                  shadowRadius: 4, */
                  elevation: 5,
                }}>
                  <MaterialCommunityIcons
                  name={focused ? "alert-circle" : "alert-circle-outline"}
                  color="#FFFFFF"
                  size={22}
                  />
                </View>
                ),
                tabBarLabelStyle: {
                color: '#FF0000',
                fontWeight: 'bold',
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
