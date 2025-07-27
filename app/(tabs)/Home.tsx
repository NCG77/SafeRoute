import { useFonts as useExpoFonts } from 'expo-font';
import * as Linking from 'expo-linking';
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
    const [showHelplineModal, setShowHelplineModal] = React.useState(false);
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
    const Helpline = () => {
        setShowHelplineModal(true);
    };

    const HelplineModal = () => {
        const helplineNumbers = [
            { name: 'Police', number: '100' },
            { name: 'Fire Brigade', number: '101' },
            { name: 'Ambulance', number: '102' },
            { name: 'Women Helpline', number: '1091' },
            { name: 'Child Helpline', number: '1098' },
            { name: 'Tourist Helpline', number: '1363' },
            { name: 'Women Distress', number: '181' },
            { name: 'Cyber Crime Helpline', number: '1930' },
            { name: 'Mental Health Helpline', number: '14416' }
        ];

        const callNumber = async (number: string) => {
            try {
                await Linking.openURL(`tel:${number}`);
            } catch (error) {
                console.error('Error opening phone dialer:', error);
            }
            setShowHelplineModal(false);
        };

        return (
            <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 1000
            }}>
                <View style={{
                    backgroundColor: 'white',
                    borderRadius: 20,
                    padding: 30,
                    width: '90%',
                    maxHeight: '80%'
                }}>
                    <Text style={[styles.header, { marginBottom: 20 }]}>Emergency Helplines</Text>
                    {helplineNumbers.map((helpline, index) => (
                        <Button
                            key={index}
                            mode="contained"
                            onPress={() => callNumber(helpline.number)}
                            style={[styles.button, { marginVertical: 5, borderColor: '#F37199' }]}
                            labelStyle={{ color: 'white', fontSize: 16 }}
                        >
                            {helpline.name} - {helpline.number}
                        </Button>
                    ))}
                    <Button
                        mode="outlined"
                        onPress={() => setShowHelplineModal(false)}
                        style={{ marginTop: 10, borderColor: theme.colors.primary }}
                        labelStyle={{ color: theme.colors.primary }}
                    >
                        Close
                    </Button>
                </View>
            </View>
        );
    };

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
            <View style={[styles.overlay, { backgroundColor: "#AC1754" }]}>
                <Image source={require('../../assets/images/Home.png')} style={styles.logo} />
                <View style={styles.card}>
                    <Text style={styles.header}>SafeRoute</Text>
                    <Text style={[styles.description, { textAlign: 'center', marginBottom: 30, color: '#666' }]}>
                        Quick access to emergency contacts and services.
                    </Text>
                    <View style={styles.innercard}>
                        <View style={styles.buttonRow}>
                            <Button
                                mode="contained"
                                onPress={() => router.push("/contacts")}
                                loading={Loading}
                                disabled={Loading}
                                style={[styles.buttonUpper]}
                                labelStyle={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}
                            >
                                Add Contacts +
                            </Button>
                            <Button
                                mode="contained"
                                onPress={onButtonPress}
                                loading={Loading}
                                disabled={Loading}
                                style={[styles.buttonUpper]}
                                labelStyle={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}
                            >
                                Share Location
                            </Button>
                        </View>
                    </View>
                    <View style={styles.innercard}>
                        <Button
                            mode="contained"
                            onPress={Helpline}
                            loading={Loading}
                            disabled={Loading}
                            style={[styles.button]}
                            labelStyle={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}
                        >
                            Helpline Numbers
                        </Button>
                        <Button
                            mode="contained"
                            onPress={onButtonPress}
                            loading={Loading}
                            disabled={Loading}
                            style={[styles.button]}
                            labelStyle={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}
                        >
                            Police Station Near me
                        </Button>
                        <Button
                            mode="contained"
                            onPress={onButtonPress}
                            loading={Loading}
                            disabled={Loading}
                            style={[styles.button]}
                            labelStyle={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}
                        >
                            Hospital Near me
                        </Button>
                    </View>
                    <View style={styles.Plinnercard}>
                        <Text style={styles.subHeader}>Make a community that cares.</Text>
                        <Text style={styles.description}>
                            Together create a safer world, Empower yourself with tools designed to keep you safe anytime, anywhere.
                        </Text>
                    </View>
                </View>
            </View>
            {showHelplineModal && <HelplineModal />}
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
        justifyContent: "flex-end",
        alignItems: "center",
    },
    card: {
        backgroundColor: theme.colors.cardBackground,
        padding: 20,
        borderTopLeftRadius: 60,
        borderTopRightRadius: 60,
        width: "100%",
        height: "75%",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 10,
    },
    innercard: {
        margin: 10,
        backgroundColor: theme.colors.cardBackground,
        borderColor: '#f661abff',
        padding: 10,
        borderRadius: 24,
        width: "98%",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    Plinnercard: {
        margin: 10,
        backgroundColor: '#F7A8C4',
        borderColor: '#f661abff',
        padding: 10,
        borderRadius: 24,
        width: "100%",
        height: 150,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,

    },
    logo: {
        width: 200,
        height: 200,
        marginTop: 20,
        paddingTop: 50,
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
        textAlign: 'center',
    },
    button: {
        margin: 5,
        width: "100%",
        borderColor: '#f661abff',
        borderWidth: 1,
        backgroundColor: '#F37199',    
        borderRadius: 16,
        paddingVertical: 6,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 5,
    },
    buttonUpper: {
        flex: 1,
        marginHorizontal: 5,
        borderColor: '#f661abff',
        borderWidth: 1,
        backgroundColor: '#E53888',    
        borderRadius: 16,
        paddingVertical: 15,
    },
});

export default HomePage;
