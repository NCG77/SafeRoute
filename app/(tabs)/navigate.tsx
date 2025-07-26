import { useFonts as useExpoFonts } from 'expo-font';
import { SplashScreen, useRouter } from "expo-router";
import React from "react";
import {
    Image,
    StyleSheet,
    Text,
    View
} from "react-native";
import { Button } from "react-native-paper";

SplashScreen.preventAutoHideAsync();

const theme = {
    colors: {
        primary: "#f661abff",
        secondary: "#cd43d2ff",
        backgroundOverlay: "rgba(232, 138, 219, 1)",
        cardBackground: "#FFFFFF",
    },
};

function useFonts(fontMap: { [key: string]: any }): [boolean] {
    const [loaded] = useExpoFonts(fontMap);
    return [loaded];
}

const HomePage = () => {
    const router = useRouter();
    const [Loading, setLoading] = React.useState(false);
    const [fontsLoaded] = useFonts({
        'Lufga': require('../../assets/fonts/LufgaRegular.ttf'), 
        'Magesta': require('../../assets/fonts/Magesta.ttf'),
    });

    React.useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    if (!fontsLoaded) {
        return null;
    }

    const onButtonPress = async () => {
        setLoading(true);
        try {
            router.push("/Login");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.background}>
            <View style={[styles.overlay, { backgroundColor: theme.colors.backgroundOverlay }]}>
                <View style={styles.card}>
                    <Text style={styles.header}>SafeRoute</Text>
                    <Image source={require('../../assets/images/Painting.png')} style={styles.logo} />
                    <Text style={[styles.description, { textAlign: 'center', marginBottom: 30, color: '#666' }]}>
                        Navigation page
                    </Text>
                    <Button
                        mode="contained"
                        onPress={onButtonPress}
                        loading={Loading}
                        disabled={Loading}
                        style={[styles.button, { backgroundColor: theme.colors.primary }]}
                        labelStyle={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}
                    >
                        Get Started
                    </Button>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    background: {
        flex: 1,
        width: "100%",
        height: "100%",
    },
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    card: {
        backgroundColor: theme.colors.cardBackground,
        padding: 20,
        borderRadius: 12,
        width: "80%",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    logo: {
        width: 200,
        height: 200,
        marginBottom: 20,
    },
    header: {
        fontFamily: 'Magesta',
        fontSize: 24,
        color: theme.colors.primary,
        fontWeight: "bold",
        margin: 24,
    },
    subHeader: {
        fontFamily: 'Lufga',
        fontSize: 18,
        fontWeight: "500",
    },
    description: {
        fontFamily: 'Lufga',
        fontSize: 14,
        lineHeight: 20,
    },
    button: {
        marginTop: 10,
        width: "100%",
    },
});

export default HomePage;
