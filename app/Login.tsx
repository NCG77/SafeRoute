import { useNavigation } from "@react-navigation/native";
import { SplashScreen, useRouter } from "expo-router";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
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

SplashScreen.preventAutoHideAsync();

const firebaseConfig = {
  apiKey: "AIzaSyCIwWpgUl9kYuPE9dMvozZ7WD54yv8ibbY",
  authDomain: "saferoute-758ad.firebaseapp.com",
  projectId: "saferoute-758ad",
  storageBucket: "saferoute-758ad.firebasestorage.app",
  messagingSenderId: "954471065861",
  appId: "1:954471065861:web:43794a2de01b0ea9bb6f6c",
  measurementId: "G-CCL0QZZM11",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const theme = {
  colors: {
    primary: "#f661abff",
    secondary: "#cd43d2ff",
    backgroundOverlay: "rgba(232, 138, 219, 1)",
    cardBackground: "#FFFFFF",
  },
};

const LoginScreen = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const [email, setEmail] = useState({ value: "", error: "" });
  const [password, setPassword] = useState({ value: "", error: "" });
  const [loading, setLoading] = useState(false);

  const onLoginPressed = async () => {
    if (!email.value) {
      setEmail({ ...email, error: "Email is required" });
      return;
    }
    if (!password.value) {
      setPassword({ ...password, error: "Password is required" });
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.value,
        password.value
      );
      const user = userCredential.user;
      Alert.alert("Login Successful", `Welcome back, ${user.email}!`);
      router.push("/Home");
    } catch (error) {
      const errorMessage = (error as Error).message;
      Alert.alert("Login Failed", errorMessage);
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

          <Text style={styles.header}>Welcome Back!</Text>
          <TextInput
            style={styles.input}
            label="Email"
            value={email.value}
            onChangeText={(text) => setEmail({ value: text, error: "" })}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email"
            error={!!email.error}
          />
          {email.error ? (
            <Text style={styles.errorText}>{email.error}</Text>
          ) : null}

          <TextInput
            style={styles.input}
            label="Password"
            value={password.value}
            onChangeText={(text) => setPassword({ value: text, error: "" })}
            secureTextEntry
            placeholder="Password"
            error={!!password.error}
          />
          {password.error ? (
            <Text style={styles.errorText}>{password.error}</Text>
          ) : null}

          <View style={styles.forgotPassword}>
            <TouchableOpacity
              onPress={() => navigation.navigate("ResetPasswordScreen")}
            >
              <Text style={styles.forgot}>Forgot your password?</Text>
            </TouchableOpacity>
          </View>

          <Button
            mode="contained"
            onPress={onLoginPressed}
            loading={loading}
            disabled={loading}
            style={styles.button}
            contentStyle={{ backgroundColor: theme.colors.primary }}
          >
            {loading ? "Logging In..." : "Next"}
          </Button>

          <View style={styles.row}>
            <Text>You do not have an account yet? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Signup")}>
              <Text style={styles.link}>Create!</Text>
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
    width: 250,
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
  forgotPassword: {
    width: "100%",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    marginTop: 10,
  },
  forgot: {
    fontSize: 13,
  },
  link: {
    fontWeight: "bold",
    color: theme.colors.primary,
  },
  button: {
    marginTop: 10,
    width: "100%",
    color: theme.colors.primary,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 5,
  },
});

export default LoginScreen;
