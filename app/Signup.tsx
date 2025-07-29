import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import React, { useState } from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Button, TextInput } from "react-native-paper";
import "react-native-reanimated";
import { auth } from "../config/firebase";

const theme = {
  colors: {
    primary: "#f661abff",
    secondary: "#cd43d2ff",
    backgroundOverlay: "rgba(232, 138, 219, 1)",
    cardBackground: "#FFFFFF",
  },
};

const SignupScreen: React.FC = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const [name, setName] = useState({ value: "", error: "" });
  const [email, setEmail] = useState({ value: "", error: "" });
  const [password, setPassword] = useState({ value: "", error: "" });
  const [loading, setLoading] = useState(false);

  const onSignUpPressed = async () => {
    if (!name.value.trim()) {
      setName({ ...name, error: "Name is required" });
      return;
    }
    if (!email.value.trim()) {
      setEmail({ ...email, error: "Email is required" });
      return;
    }
    if (!password.value.trim() || password.value.length < 6) {
      setPassword({
        ...password,
        error: "Password must be at least 6 characters",
      });
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.value,
        password.value
      );
      await updateProfile(userCredential.user, { displayName: name.value });

      Alert.alert(
        "Account Created",
        `Welcome, ${name.value}! Your account has been created successfully.`
      );
      router.push("/Login");
    } catch (error) {
      Alert.alert("Sign-Up Failed", (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.background, { backgroundColor: "#FFE6F2" }]}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Image
            source={require("../assets/images/Verify.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.header}>Create Your Account</Text>
          <TextInput
            style={styles.input}
            label="Name"
            returnKeyType="next"
            value={name.value}
            onChangeText={(text) => setName({ value: text, error: "" })}
            error={!!name.error}
          />
          {name.error ? (
            <Text style={styles.errorText}>{name.error}</Text>
          ) : null}

          <TextInput
            style={styles.input}
            label="Email"
            returnKeyType="next"
            value={email.value}
            onChangeText={(text) => setEmail({ value: text, error: "" })}
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            keyboardType="email-address"
            error={!!email.error}
          />
          {email.error ? (
            <Text style={styles.errorText}>{email.error}</Text>
          ) : null}

          <TextInput
            style={styles.input}
            label="Password"
            returnKeyType="done"
            value={password.value}
            onChangeText={(text) => setPassword({ value: text, error: "" })}
            secureTextEntry
            error={!!password.error}
          />
          {password.error ? (
            <Text style={styles.errorText}>{password.error}</Text>
          ) : null}

          <Button
            mode="contained"
            onPress={onSignUpPressed}
            loading={loading}
            disabled={loading}
            style={styles.button}
            contentStyle={{ backgroundColor: theme.colors.primary }}
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </Button>

          <View style={styles.row}>
            <Text>I already have an account! </Text>
            <TouchableOpacity onPress={() => router.push("/Login")}>
              <Text style={styles.link}>Log in</Text>
            </TouchableOpacity>
          </View>
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
    height: 150,
    marginBottom: 16,
  },
  header: {
    fontSize: 24,
    color: theme.colors.primary,
    fontWeight: "bold",
    marginBottom: 16,
  },
  input: {
    width: "100%",
    marginBottom: 10,
    backgroundColor: theme.colors.backgroundOverlay,
  },
  row: {
    flexDirection: "row",
    marginTop: 10,
  },
  link: {
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  button: {
    marginTop: 16,
    width: "100%",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 5,
  },
});

export default SignupScreen;
