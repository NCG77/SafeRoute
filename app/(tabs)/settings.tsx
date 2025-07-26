import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts as useExpoFonts } from 'expo-font';
import React, { useEffect, useState } from 'react';
import {
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    useColorScheme,
    View
} from 'react-native';

function useFonts(fontMap: { [key: string]: any }): [boolean] {
    const [loaded] = useExpoFonts(fontMap);
    return [loaded];
}

export default function Account() {
  const systemTheme = useColorScheme() ?? 'light';
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [activeTheme, setActiveTheme] = useState(systemTheme);
  const [overlayContent, setOverlayContent] = useState<string | null>(null);
  const [fontsLoaded] = useFonts({
        'Lufga': require('../../assets/fonts/LufgaRegular.ttf'), 
        'Magesta': require('../../assets/fonts/Magesta.ttf'),
    });

  useEffect(() => {
    if (selectedTheme === 'system') {
      setActiveTheme(systemTheme);
    } else {
      setActiveTheme(selectedTheme);
    }
  }, [selectedTheme, systemTheme]);

  const showOverlay = (content: string) => setOverlayContent(content);
  const hideOverlay = () => setOverlayContent(null);

  const currentColors = activeTheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]}>
      <View style={[{ paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 }]}>
        <ScrollView>
          <Header theme={currentColors} />
          <ThemedView style={styles.content}>
            <About theme={currentColors} />
            <SectionButton
              icon="information-circle-outline"
              text="About Us"
              onPress={() => showOverlay('About Us')}
              theme={currentColors}
            />
            <SectionButton
              icon="document-text-outline"
              text="License"
              onPress={() => showOverlay('License')}
              theme={currentColors}
            />
            <SectionButton
              icon="shield-checkmark-outline"
              text="Terms of Service"
              onPress={() => showOverlay('Terms of Service')}
              theme={currentColors}
            />
          </ThemedView>
        </ScrollView>

        <Modal
          animationType="fade"
          transparent={true}
          visible={overlayContent !== null}
          onRequestClose={hideOverlay}
        >
          <View style={styles.overlayContainer}>
            <View
              style={[
                styles.overlayContent,
                { backgroundColor: currentColors.background, borderColor: currentColors.text },
              ]}
            >
              <Ionicons
                name="close-circle-outline"
                size={36}
                color={currentColors.text}
                onPress={hideOverlay}
                style={styles.closeIcon}
              />
              <ThemedText style={[styles.overlayTitle, { color: currentColors.text }]}>
                {overlayContent}
              </ThemedText>
              <ScrollView style={{ marginVertical: 10 }}>
                {overlayContent === 'About Us' && (
                  <ThemedText style={[styles.overlayText, { color: currentColors.text }]}>
                    Welcome to SafeRoute, Navigate confidently with Vote based optimized paths, emergency contacts, and 
                        secure route planning designed for women's safety.
                    {'\n\n'}
                    <ThemedText style={{ fontWeight: 'bold', fontSize: 18 }}>Team:</ThemedText>
                    {'\n'}
                    Swastik, Avanesh, Yash.
                  </ThemedText>
                )}
                {overlayContent === 'License' && (
                  <ThemedText style={[styles.overlayText, { color: currentColors.text }]}>
                    Licensed under GNU GPL.
                    GNU GPL
                    for details.
                  </ThemedText>
                )}
                {overlayContent === 'Terms of Service' && (
                  <ThemedText style={[styles.overlayText, { color: currentColors.text }]}>
                    I dont know what to write here. Please dont sue me.😊
                  </ThemedText>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

function Header({ theme }: { theme: any }) {
  return (
    <ThemedView style={[styles.header, { backgroundColor: theme.primary }]}>
      <Text style={[styles.headerTitle, { color: theme.text }]}>SafeRoute</Text>
    </ThemedView>
  );
}

function ThemeSelector({ selectedTheme, setSelectedTheme, theme }: any) {
  return (
    <View style={styles.themeSection}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Theme Settings</Text>
      <View style={styles.themeButtonContainer}>
        <ThemeButton title="Dark" selected={selectedTheme === 'dark'} onPress={() => setSelectedTheme('dark')} theme={theme} />
        <ThemeButton title="Light" selected={selectedTheme === 'light'} onPress={() => setSelectedTheme('light')} theme={theme} />
        <ThemeButton title="System" selected={selectedTheme === 'system'} onPress={() => setSelectedTheme('system')} theme={theme} />
      </View>
    </View>
  );
}

function ThemeButton({ title, selected, onPress, theme }: any) {
  return (
    <Pressable
      style={[
        styles.themeButton,
        {
          backgroundColor: selected ? theme.primary : theme.background,
          borderColor: theme.text,
        },
      ]}
      onPress={onPress}
    >
      <Text style={{ color: selected ? theme.background : theme.text }}>{title}</Text>
    </Pressable>
  );
}

function SectionButton({ icon, text, onPress, theme }: any) {
  return (
    <Pressable
      style={[styles.sectionButton, { backgroundColor: theme.primary, borderColor: theme.text }]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={24} color={theme.text} />
      <Text style={[styles.sectionButtonText, { color: theme.text }]}>{text}</Text>
    </Pressable>
  );
}

function About({ theme }: { theme: any }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>App Info</Text>
    </View>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20, alignItems: 'center' },
    headerTitle: { fontFamily: 'Lufga', fontSize: 24, fontWeight: 'bold', margin: 30, marginTop: 70 },
    content: { padding: 20 },
    themeSection: { marginBottom: 20 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    themeButtonContainer: { flexDirection: 'row', justifyContent: 'space-between' },
    themeButton: { padding: 10, borderWidth: 1, borderRadius: 5, flex: 1, margin: 5 },
    sectionButton: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderRadius: 10, marginBottom: 10 },
    sectionButtonText: { marginLeft: 10, fontSize: 16 },
    overlayContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(244, 97, 234, 0.5)' },
    overlayContent: { width: '90%', padding: 20, borderRadius: 10, alignItems: 'center', elevation: 5 },
    overlayTitle: { fontSize: 20, fontWeight: 'bold' },
    overlayText: { fontSize: 16, lineHeight: 22, textAlign: 'center' },
    closeIcon: { position: 'absolute', top: 10, right: 10 },
    logo: {
        width: 200,
        height: 150,
        marginBottom: 16,
    },
});

