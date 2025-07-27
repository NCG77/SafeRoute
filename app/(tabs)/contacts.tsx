import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import * as React from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, Card, Dialog, IconButton, Portal } from 'react-native-paper';

type Contact = {
  id: string;
  name: string;
  phone: string;
};

const CONTACTS_STORAGE_KEY = '@SafeRoute:contacts';

// Simple ID generator for React Native without crypto dependency
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

const theme = {
  colors: {
    primary: '#f661ab', // Pink
    secondary: '#cd43d2', // Purple
    backgroundOverlay: '#f5f5f5',
    cardBackground: '#fff',
    text: '#333',
    border: '#ddd',
    danger: '#ff4444',
  },
  font: 'Lufga',
};

export default function ContactsScreen() {
  const [fontsLoaded] = useFonts({
    Lufga: require('../../assets/fonts/LufgaRegular.ttf'),
  });
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [dialogVisible, setDialogVisible] = React.useState(false);
  const contactIdToDelete = React.useRef<string | null>(null);

  // Load contacts on mount
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
      console.error('Failed to load contacts', error);
    }
  };

  const saveContacts = React.useCallback(async (updatedContacts: Contact[]) => {
    try {
      await AsyncStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(updatedContacts));
    } catch (error) {
      console.error('Failed to save contacts', error);
    }
  }, []);

  const handleAddContact = () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const newContact: Contact = {
      id: generateId(),
      name: name.trim(),
      phone: phone.trim(),
    };

    const updatedContacts = [...contacts, newContact];
    setContacts(updatedContacts);
    saveContacts(updatedContacts);
    setName('');
    setPhone('');
  };

  const handleEdit = () => {
    if (!editingId || !name.trim() || !phone.trim()) return;

    const updatedContacts = contacts.map(contact =>
      contact.id === editingId
        ? { ...contact, name: name.trim(), phone: phone.trim() }
        : contact
    );

    setContacts(updatedContacts);
    saveContacts(updatedContacts);
    setEditingId(null);
    setName('');
    setPhone('');
    setDialogVisible(false);
  };

  const performDelete = React.useCallback(() => {
    if (!contactIdToDelete.current) return;

    setContacts(currentContacts => {
      const updatedContacts = currentContacts.filter(
        contact => contact.id !== contactIdToDelete.current
      );
      saveContacts(updatedContacts);
      return updatedContacts;
    });

    contactIdToDelete.current = null;
  }, [saveContacts]);

  const handleDelete = (id: string) => {
    contactIdToDelete.current = id;
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to delete this contact?',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => (contactIdToDelete.current = null) },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: performDelete,
        },
      ],
      { cancelable: true, onDismiss: () => (contactIdToDelete.current = null) }
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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.primary, fontFamily: theme.font }]}>Emergency Contacts</Text>
          <Text style={[styles.subtitle, { color: theme.colors.secondary, fontFamily: theme.font }]}>Save important contacts for quick access</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={[styles.input, { fontFamily: theme.font }]}
            placeholder="Contact Name"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#999"
          />
          <TextInput
            style={[styles.input, { fontFamily: theme.font }]}
            placeholder="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor="#999"
          />
          <Button
            mode="contained"
            onPress={editingId ? handleEdit : handleAddContact}
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            labelStyle={[styles.buttonLabel, { fontFamily: theme.font }]}
          >
            {editingId ? 'Update Contact' : 'Add Contact'}
          </Button>
        </View>

        <View style={styles.contactsList}>
          {contacts.length > 0 ? (
            contacts.map((contact) => (
              <Card key={contact.id} style={[styles.contactCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.secondary }] }>
                <Card.Content>
                  <Text style={[styles.contactName, { color: theme.colors.primary, fontFamily: theme.font }]}>{contact.name}</Text>
                  <Text style={[styles.contactPhone, { color: theme.colors.secondary, fontFamily: theme.font }]}>{contact.phone}</Text>
                </Card.Content>
                <Card.Actions style={styles.cardActions}>
                  <IconButton
                    icon="phone"
                    size={24}
                    onPress={() => handleCall(contact.phone)}
                    iconColor={theme.colors.primary}
                  />
                  <IconButton
                    icon="pencil"
                    size={24}
                    onPress={() => startEditing(contact)}
                    iconColor={theme.colors.secondary}
                  />
                  <IconButton
                    icon="delete"
                    size={24}
                    onPress={() => handleDelete(contact.id)}
                    iconColor={theme.colors.danger}
                  />
                </Card.Actions>
              </Card>
            ))
          ) : (
            <Text style={[styles.noContacts, { fontFamily: theme.font }]}>No contacts saved yet</Text>
          )}
        </View>
      </ScrollView>

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title style={{ color: theme.colors.primary, fontFamily: theme.font }}>Edit Contact</Dialog.Title>
          <Dialog.Content>
            <TextInput
              style={[styles.dialogInput, { fontFamily: theme.font }]}
              placeholder="Contact Name"
              value={name}
              onChangeText={setName}
              autoFocus
            />
            <TextInput
              style={[styles.dialogInput, { fontFamily: theme.font }]}
              placeholder="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)} textColor={theme.colors.secondary}>Cancel</Button>
            <Button onPress={handleEdit} textColor={theme.colors.primary}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
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
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#f661ab',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1.5,
    borderColor: '#f661ab',
  },
  input: {
    backgroundColor: '#f9f6fb',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    fontSize: 17,
    borderWidth: 1,
    borderColor: '#cd43d2',
  },
  addButton: {
    marginTop: 8,
    borderRadius: 10,
    elevation: 2,
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
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
    shadowColor: '#cd43d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  contactName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
    letterSpacing: 0.1,
  },
  contactPhone: {
    fontSize: 16,
    marginBottom: 2,
    letterSpacing: 0.1,
  },
  cardActions: {
    justifyContent: 'flex-end',
  },
  noContacts: {
    textAlign: 'center',
    color: '#999',
    marginTop: 24,
    fontSize: 16,
  },
  dialogInput: {
    backgroundColor: '#f9f6fb',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
    fontSize: 17,
    borderWidth: 1,
    borderColor: '#cd43d2',
  },
});
