<<<<<<< HEAD
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native"; // Ensure useNavigation is imported
import { useFonts } from "expo-font";
import * as React from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Button, Card, Dialog, IconButton, Portal } from "react-native-paper";

type Contact = {
  id: string;
  name: string;
  phone: string;
};

const CONTACTS_STORAGE_KEY = "@SafeRoute:contacts";

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

const theme = {
  colors: {
    primary: "#f661ab",
    secondary: "#cd43d2",
    backgroundOverlay: "#f5f5f5",
    cardBackground: "#fff",
    text: "#fff", // This color is used for button labels, not general text in your styles
    border: "#ddd",
    danger: "#ff4444",
  },
  font: "Lufga",
};

export default function ContactsScreen() {
  const navigation = useNavigation(); // Initialize useNavigation
  const [fontsLoaded] = useFonts({
    Lufga: require("../../assets/fonts/LufgaRegular.ttf"),
  });
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [dialogVisible, setDialogVisible] = React.useState(false);
  const contactIdToDelete = React.useRef<string | null>(null);

  React.useEffect(() => {
    loadContacts();
  }, []);

  if (!fontsLoaded) return null;

  const loadContacts = async () => {
    try {
      const savedContacts = await AsyncStorage.getItem(CONTACTS_STORAGE_KEY);
      if (savedContacts) {
        setContacts(JSON.parse(savedContacts));
      }
    } catch (error) {
      console.error("Failed to load contacts", error);
    }
  };

  const saveContacts = React.useCallback(async (updatedContacts: Contact[]) => {
    try {
      await AsyncStorage.setItem(
        CONTACTS_STORAGE_KEY,
        JSON.stringify(updatedContacts)
      );
    } catch (error) {
      console.error("Failed to save contacts", error);
    }
  }, []);

  const handleAddContact = () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const phoneDigits = phone.replace(/\D/g, "");
    const isValidPhone = /^\d{10}$/.test(phoneDigits);

    if (!isValidPhone) {
      Alert.alert(
        "Invalid Phone Number",
        "Please enter a valid 10-digit phone number"
      );
      return;
    }

    const newContact: Contact = {
      id: generateId(),
      name: name.trim(),
      phone: phoneDigits,
    };

    const updatedContacts = [...contacts, newContact];
    setContacts(updatedContacts);
    saveContacts(updatedContacts);
    setName("");
    setPhone("");
  };

  const handleEdit = () => {
    if (!editingId || !name.trim() || !phone.trim()) return;

    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      Alert.alert(
        "Invalid Phone Number",
        "Please enter a valid 10-digit phone number"
      );
      return;
    }

    const updatedContacts = contacts.map((contact) =>
      contact.id === editingId
        ? { ...contact, name: name.trim(), phone: phoneDigits }
        : contact
    );

    setContacts(updatedContacts);
    saveContacts(updatedContacts);
    setEditingId(null);
    setName("");
    setPhone("");
    setDialogVisible(false);
  };

  const performDelete = React.useCallback(async () => {
    if (!contactIdToDelete.current) return;

    try {
      const updatedContacts = contacts.filter(
        (contact) => contact.id !== contactIdToDelete.current
      );

      setContacts(updatedContacts);

      await AsyncStorage.setItem(
        CONTACTS_STORAGE_KEY,
        JSON.stringify(updatedContacts)
      );

      contactIdToDelete.current = null;
      setDialogVisible(false); // Ensure dialog is closed after delete

      Alert.alert("Success", "Contact deleted successfully");
    } catch (error) {
      console.error("Failed to delete contact", error);
      Alert.alert("Error", "Failed to delete contact");
    }
  }, [contacts, saveContacts]); // Added saveContacts to dependency array

  const handleDelete = (id: string) => {
    contactIdToDelete.current = id;
    Alert.alert(
      "Delete Contact",
      "Are you sure you want to delete this contact?",
      [
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => {
            contactIdToDelete.current = null;
          },
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            if (contactIdToDelete.current) {
              performDelete();
            }
          },
        },
      ],
      {
        cancelable: true,
        onDismiss: () => {
          contactIdToDelete.current = null;
        },
      }
    );
  };

  const handleCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const startEditing = (contact: Contact) => {
    setName(contact.name);
    setPhone(contact.phone);
    setEditingId(contact.id);
    setDialogVisible(true);
  };

  // Function to handle sharing live location for a specific contact (from previous turns)
  const handleShareLiveLocation = (contact: Contact) => {
    Alert.alert(
      "Share Live Location",
      `Do you want to share your live location with ${contact.name} (${contact.phone})?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Share",
          onPress: () => {
            navigation.navigate("LiveLocationShareScreen", {
              startSharing: true,
              targetContact: {
                id: contact.id,
                name: contact.name,
                phone: contact.phone,
              },
            });
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              { color: theme.colors.primary, fontFamily: theme.font },
            ]}
          >
            Emergency Contacts
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: theme.colors.secondary, fontFamily: theme.font },
            ]}
          >
            Save important contacts for quick access
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, { fontFamily: theme.font }]}
            placeholder="Contact Name"
            value={name}
            onChangeText={setName}
            placeholderTextColor={theme.colors.secondary}
          />
          <TextInput
            style={[styles.input, { fontFamily: theme.font }]}
            placeholder="+91 Phone Number"
            value={phone}
            onChangeText={(text) => {
              const formatted = text.replace(/\D/g, "");
              setPhone(formatted);
            }}
            keyboardType="phone-pad"
            placeholderTextColor={theme.colors.secondary}
            maxLength={10}
          />
          <Button
            mode="contained"
            onPress={editingId ? handleEdit : handleAddContact}
            style={[
              styles.addButton,
              { backgroundColor: theme.colors.primary },
            ]}
            labelStyle={[styles.buttonLabel, { fontFamily: theme.font }]}
          >
            {editingId ? "Update Contact" : "Add Contact"}
          </Button>
        </View>

        <View style={styles.contactsList}>
          {contacts.length > 0 ? (
            contacts.map((contact) => (
              <Card
                key={contact.id}
                style={[
                  styles.contactCard,
                  {
                    backgroundColor: theme.colors.cardBackground,
                    borderColor: theme.colors.secondary,
                  },
                ]}
              >
                <Card.Content>
                  <Text
                    style={[
                      styles.contactName,
                      { color: theme.colors.primary, fontFamily: theme.font },
                    ]}
                  >
                    Name: {contact.name}
                  </Text>
                  <Text
                    style={[
                      styles.contactPhone,
                      { color: theme.colors.secondary, fontFamily: theme.font },
                    ]}
                  >
                    Number: +91 {contact.phone}
                  </Text>
                </Card.Content>
                <Card.Actions style={styles.cardActions}>
                  <IconButton
                    icon="phone"
                    size={24}
                    onPress={() => handleCall(contact.phone)}
                    iconColor={theme.colors.primary}
                  />
                  <IconButton
                    icon="share-variant" // MaterialCommunityIcons share icon
                    size={24}
                    onPress={() => handleShareLiveLocation(contact)}
                    iconColor={theme.colors.secondary}
                  />
                  <IconButton
                    icon="pencil"
                    size={24}
                    onPress={() => startEditing(contact)}
                    iconColor={theme.colors.secondary}
                  />
                  {/* NEW: Delete Icon Button */}
                  <IconButton
                    icon="delete" // MaterialCommunityIcons delete icon
                    size={24}
                    onPress={() => handleDelete(contact.id)} // Calls handleDelete with contact ID
                    iconColor={theme.colors.danger} // Red color for delete
                  />
                </Card.Actions>
              </Card>
            ))
          ) : (
            <Text
              style={[
                styles.noContacts,
                { fontFamily: theme.font, color: theme.colors.secondary },
              ]}
            >
              No contacts saved yet
            </Text>
          )}
        </View>
      </ScrollView>

      <Portal>
        <Dialog
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
        >
          <Dialog.Title
            style={{ color: theme.colors.primary, fontFamily: theme.font }}
          >
            Edit Contact
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              style={[styles.dialogInput, { fontFamily: theme.font }]}
              placeholder="Contact Name"
              value={name}
              onChangeText={setName}
              autoFocus
              placeholderTextColor={theme.colors.secondary}
            />
            <TextInput
              style={[styles.dialogInput, { fontFamily: theme.font }]}
              placeholder="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor={theme.colors.secondary}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setDialogVisible(false)}
              textColor={theme.colors.secondary}
            >
              Cancel
            </Button>
            <Button onPress={handleEdit} textColor={theme.colors.primary}>
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
=======
import {
  AuthTextField,
  GuardianCard,
  ModalBottomSheet,
  PrimaryButton,
  SecondaryButton,
} from "@/components/design-system";
import {
  radius,
  spacing,
  tabContentBottomInset,
  touch,
  typography,
} from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { auth, db, functions } from "@/config/firebase";
import {
  GUARDIANS_STORAGE_KEY,
  MAX_GUARDIANS,
  RELATIONSHIP_OPTIONS,
  createGuardianId,
  ensurePrimary,
  normalizeGuardians,
  setPrimaryGuardian,
  sortGuardians,
  type Guardian,
  type GuardianRelationship,
} from "@/core/guardians";
import {
  guardianInviteMessage,
  notifyGuardianSms,
} from "@/services/guardianAlerts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import * as Linking from "expo-linking";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function GuardiansScreen() {
  const insets = useSafeAreaInsets();
  const { colors: c, elevation: elev } = useAppTheme();

  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] =
    useState<GuardianRelationship>("Friend");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(GUARDIANS_STORAGE_KEY);
      const list = ensurePrimary(
        normalizeGuardians(raw ? JSON.parse(raw) : []),
      );
      setGuardians(sortGuardians(list));
    } catch (error) {
      console.error("Failed to load guardians", error);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const persist = async (next: Guardian[]) => {
    const sorted = sortGuardians(ensurePrimary(next));
    setGuardians(sorted);
    await AsyncStorage.setItem(GUARDIANS_STORAGE_KEY, JSON.stringify(sorted));
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setRelationship("Friend");
    setNameError("");
    setPhoneError("");
  };

  const openSheet = () => {
    if (guardians.length >= MAX_GUARDIANS) {
      Alert.alert(
        "Guardian limit reached",
        `You can add up to ${MAX_GUARDIANS} trusted guardians. Remove one to invite someone new.`,
      );
      return;
    }
    resetForm();
    setSheetOpen(true);
  };

  const sendInvite = async (g: Guardian, inviteUrl?: string) => {
    const body = guardianInviteMessage({ guardianName: g.name, inviteUrl });
    // Prefer native SMS to the guardian's number; Share is the fallback.
    const result = await notifyGuardianSms(g.phone, body);
    if (result.opened) return;
    try {
      await Promise.race([
        Share.share({ message: body }),
        new Promise<void>((resolve) => setTimeout(resolve, 1200)),
      ]);
    } catch {
      // User dismissed share sheet
    }
  };

  useEffect(() => {
    let stopConnections: (() => void) | undefined;
    const stopAuth = onAuthStateChanged(auth, (user) => {
      stopConnections?.();
      if (!user) return;
      stopConnections = onSnapshot(
        query(collection(db, "guardians"), where("userId", "==", user.uid)),
        (snapshot) => {
          const connections = new Map(
            snapshot.docs.map((item) => [item.id, item.data()]),
          );
          setGuardians((current) => {
            const next = current.map((guardian) => {
              const connection = guardian.connectionId
                ? connections.get(guardian.connectionId)
                : undefined;
              if (!connection) return guardian;
              const status = connection.status as Guardian["connectionStatus"];
              return {
                ...guardian,
                verified: status === "accepted",
                connectionStatus: status,
                guardianUserId:
                  typeof connection.guardianUserId === "string"
                    ? connection.guardianUserId
                    : undefined,
              };
            });
            void AsyncStorage.setItem(
              GUARDIANS_STORAGE_KEY,
              JSON.stringify(next),
            );
            return sortGuardians(next);
          });
        },
      );
    });
    return () => {
      stopAuth();
      stopConnections?.();
    };
  }, []);

  const handleSaveInvite = async () => {
    let ok = true;
    if (!name.trim() || name.trim().length < 2) {
      setNameError("Enter their name");
      ok = false;
    } else setNameError("");

    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      setPhoneError("Enter a valid 10-digit mobile number");
      ok = false;
    } else setPhoneError("");

    if (!ok) return;

    if (guardians.some((g) => g.phone === digits)) {
      Alert.alert("Already added", "This number is already a guardian.");
      return;
    }

    setSaving(true);
    try {
      const isFirst = guardians.length === 0;
      let newbie: Guardian = {
        id: createGuardianId(),
        name: name.trim(),
        phone: digits,
        relationship,
        verified: false,
        isPrimary: isFirst,
        connectionStatus: "pending",
      };
      let inviteUrl: string | undefined;
      try {
        const result = await httpsCallable<
          {
            displayName: string;
            phone: string;
            relationship: GuardianRelationship;
            isPrimary: boolean;
          },
          {
            connectionId?: string;
            inviteId: string;
            token?: string;
            inviteToken: string;
            inviteUrl?: string;
          }
        >(functions, "createGuardianInvite")({
          displayName: newbie.name,
          phone: newbie.phone,
          relationship: newbie.relationship,
          isPrimary: newbie.isPrimary,
        });
        const inviteId = result.data.inviteId;
        const inviteToken = result.data.inviteToken ?? result.data.token ?? "";
        inviteUrl =
          result.data.inviteUrl ??
          Linking.createURL("/GuardianInvite", {
            queryParams: { inviteId, token: inviteToken },
          });
        newbie = {
          ...newbie,
          connectionId: result.data.connectionId ?? result.data.inviteId,
        };
      } catch (error) {
        console.warn("Created local SMS-only guardian; invite backend unavailable.", error);
      }
      const next = isFirst
        ? [newbie]
        : [...guardians.map((g) => ({ ...g, isPrimary: g.isPrimary })), newbie];
      await persist(next);
      setSheetOpen(false);
      resetForm();
      await sendInvite(newbie, inviteUrl);
      Alert.alert(
        "Invite ready",
        `${newbie.name} is pending until they accept the SafeRoute invite. SMS fallback remains available.`,
      );
    } finally {
      setSaving(false);
    }
  };

  const onTogglePrimary = async (id: string, value: boolean) => {
    if (!value) {
      Alert.alert(
        "Keep one primary",
        "Choose another guardian as Primary instead of turning this off.",
      );
      return;
    }
    await persist(setPrimaryGuardian(guardians, id));
  };

  const onRemove = (guardian: Guardian) => {
    Alert.alert(
      "Remove guardian?",
      `${guardian.name} will no longer receive Safe Walk or SOS alerts from you.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            if (guardian.connectionId) {
              void httpsCallable(functions, "revokeGuardian")({
                guardianId: guardian.connectionId,
              }).catch(console.warn);
            }
            const next = guardians.filter((g) => g.id !== guardian.id);
            await persist(ensurePrimary(next));
          },
        },
      ],
    );
  };

  const onCall = (guardian: Guardian) => {
    void Linking.openURL(`tel:${guardian.phone}`);
  };

  const onResend = async (guardian: Guardian) => {
    try {
      const result = await httpsCallable<
        {
          connectionId?: string;
          displayName: string;
          phone: string;
          relationship: string;
        },
        {
          connectionId?: string;
          inviteId: string;
          token?: string;
          inviteToken: string;
          inviteUrl?: string;
        }
      >(functions, "createGuardianInvite")({
        connectionId: guardian.connectionId,
        displayName: guardian.name,
        phone: guardian.phone,
        relationship: guardian.relationship,
      });
      const inviteId = result.data.inviteId;
      const inviteToken = result.data.inviteToken ?? result.data.token ?? "";
      const inviteUrl =
        result.data.inviteUrl ??
        Linking.createURL("/GuardianInvite", {
          queryParams: { inviteId, token: inviteToken },
        });
      await sendInvite(guardian, inviteUrl);
    } catch {
      await sendInvite(guardian);
    }
  };

  const atCapacity = guardians.length >= MAX_GUARDIANS;
  const empty = guardians.length === 0;

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: Math.max(insets.top, spacing.md),
          backgroundColor: c.background,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom:
              tabContentBottomInset(insets.bottom) +
              touch.buttonHeight +
              spacing.lg,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={[styles.title, { color: c.textPrimary }]}
          accessibilityRole="header"
        >
          Trusted Guardians
        </Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>
          People who can follow your Safe Walk and receive SOS if you need help.
          Add up to {MAX_GUARDIANS}.
        </Text>

        <View style={[styles.counter, { backgroundColor: c.primaryContainer }]}>
          <Text style={[styles.counterText, { color: c.primaryOnContainer }]}>
            {guardians.length} of {MAX_GUARDIANS} guardians
          </Text>
          {guardians.some((g) => g.isPrimary) ? (
            <Text
              style={[styles.counterPrimary, { color: c.primaryOnContainer }]}
            >
              Primary: {guardians.find((g) => g.isPrimary)?.name}
            </Text>
          ) : null}
        </View>

        {empty ? (
          <View style={styles.empty} accessibilityLabel="No guardians yet">
            <Image
              source={require("../../assets/images/guardians-empty.png")}
              style={styles.emptyArt}
              contentFit="contain"
            />
            <Text style={[styles.emptyTitle, { color: c.textPrimary }]}>
              No guardians yet
            </Text>
            <Text style={[styles.emptyBody, { color: c.textSecondary }]}>
              Invite someone you trust. Your Primary Guardian is notified first
              during Safe Walk and SOS.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {guardians.map((g) => (
              <GuardianCard
                key={g.id}
                guardian={g}
                onTogglePrimary={onTogglePrimary}
                onCall={onCall}
                onRemove={onRemove}
                onMarkVerified={
                  undefined
                }
                onResendInvite={g.verified ? undefined : onResend}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: tabContentBottomInset(insets.bottom),
            backgroundColor: c.background,
            borderTopColor: c.border,
            ...elev.sheet,
          },
        ]}
      >
        <PrimaryButton
          label="Invite Guardian"
          onPress={openSheet}
          disabled={atCapacity}
          accessibilityHint={
            atCapacity
              ? "Maximum of five guardians reached"
              : "Open form to invite a guardian"
          }
        />
      </View>

      <ModalBottomSheet
        visible={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          resetForm();
        }}
        title="Invite Guardian"
        heightRatio={0.72}
        scrollable={false}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.sheetBody}
        >
          <Text style={[styles.sheetHint, { color: c.textSecondary }]}>
            We’ll help you share an invite. They stay Pending until confirmed.
          </Text>

          <AuthTextField
            label="Name"
            value={name}
            onChangeText={(t) => {
              setName(t);
              setNameError("");
            }}
            status={nameError ? "error" : "default"}
            helperText={nameError}
            leadingIcon="person-outline"
            autoCapitalize="words"
            textContentType="name"
          />

          <AuthTextField
            label="Phone"
            value={phone}
            onChangeText={(t) => {
              setPhone(t.replace(/\D/g, "").slice(0, 10));
              setPhoneError("");
            }}
            status={phoneError ? "error" : "default"}
            helperText={phoneError || "10-digit mobile number"}
            leadingIcon="phone-iphone"
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
          />

          <Text style={[styles.relLabel, { color: c.textPrimary }]}>
            Relationship
          </Text>
          <View style={styles.relChips}>
            {RELATIONSHIP_OPTIONS.map((option) => {
              const selected = option === relationship;
              return (
                <Pressable
                  key={option}
                  onPress={() => setRelationship(option)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: c.surfaceVariant,
                      borderColor: c.border,
                    },
                    selected && {
                      backgroundColor: c.primaryContainer,
                      borderColor: c.primary,
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[
                      styles.chipLabel,
                      { color: c.textSecondary },
                      selected && {
                        color: c.primary,
                        fontFamily: typography.fontFamily.semibold,
                      },
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <PrimaryButton
            label="Send Invite"
            loading={saving}
            onPress={handleSaveInvite}
            style={styles.sheetCta}
          />
          <SecondaryButton
            label="Cancel"
            onPress={() => {
              setSheetOpen(false);
              resetForm();
            }}
          />
        </ScrollView>
      </ModalBottomSheet>
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
    </View>
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingTop: 48, // Adjusted to match your original code
    borderTopWidth: 1,
    borderTopColor: theme.colors.secondary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.secondary,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 8,
    letterSpacing: 0.1,
  },
  form: {
    marginBottom: 24,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: "#f661ab",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1.5,
    borderColor: "#f661ab",
  },
  input: {
    backgroundColor: "#f9f6fb",
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    fontSize: 17,
    borderWidth: 1,
    borderColor: theme.colors.secondary,
    color: theme.colors.secondary, // Ensure text color is visible
  },
  addButton: {
    marginTop: 8,
    borderRadius: 10,
    elevation: 2,
  },
  buttonLabel: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "bold",
    letterSpacing: 0.2,
  },
  contactsList: {
    marginBottom: 24,
  },
  contactCard: {
    marginBottom: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    elevation: 2,
    shadowColor: theme.colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  contactName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  contactPhone: {
    fontSize: 16,
    letterSpacing: 0.1,
  },
  cardActions: {
    justifyContent: "flex-end",
  },
  noContacts: {
    textAlign: "center",
    marginTop: 24,
    fontSize: 16,
  },
  dialogInput: {
    backgroundColor: "#f9f6fb",
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    fontSize: 17,
    borderWidth: 1,
    borderColor: theme.colors.secondary,
    color: theme.colors.secondary, // Ensure text color is visible
=======
  root: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.size.headline,
    lineHeight: typography.lineHeight.headline,
    letterSpacing: -0.3,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.bodyLarge,
    lineHeight: typography.lineHeight.bodyLarge,
  },
  counter: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.xl,
    gap: 2,
  },
  counterText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.size.body,
  },
  counterPrimary: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.caption,
  },
  list: {
    gap: spacing.md,
  },
  empty: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  emptyArt: {
    width: 200,
    height: 200,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.size.title,
    marginBottom: spacing.sm,
  },
  emptyBody: {
    textAlign: "center",
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.body,
    lineHeight: typography.lineHeight.body,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sheetBody: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  sheetHint: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.body,
    marginBottom: spacing.sm,
  },
  relLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.size.body,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  relChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.size.caption,
  },
  sheetCta: {
    marginTop: spacing.sm,
>>>>>>> 5e3d2c8612989772d6fb21c83de6a6b0116ec9c3
  },
});
