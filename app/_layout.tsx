import { useColorScheme } from '@/hooks/useColorScheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from "react-native-safe-area-context";
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const colorScheme = useColorScheme();
    const [fontsLoaded, error] = useFonts({
        "Roboto-Mono": require("../assets/fonts/SpaceMono-Regular.ttf"),
    }); 

    useEffect(() => {
        if (error) throw error;
        if (fontsLoaded) SplashScreen.hideAsync();
    }, [fontsLoaded, error]);

    if (!fontsLoaded) {
        return null;
    }

    console.log('Color Scheme:', colorScheme); 

    return (
        <PaperProvider>
            <SafeAreaProvider>
                <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                        <Stack>
                            <Stack.Screen name="index" options={{ headerShown: false }} />
                            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                            <Stack.Screen name="Login" options={{ headerShown: false }} />
                            <Stack.Screen name="Signup" options={{ headerShown: false }} />
                        </Stack>
                </ThemeProvider>
            </SafeAreaProvider>
        </PaperProvider>
    );
}
