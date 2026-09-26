import { auth } from "@/config/firebase";
import {
  ONBOARDING_DONE_KEY,
  PERMISSIONS_WIZARD_KEY,
} from "@/constants/preferences";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged, type User } from "firebase/auth";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type AuthBootstrapRoute =
  | "loading"
  | "welcome"
  | "login"
  | "permissions"
  | "home";

type AuthContextValue = {
  user: User | null;
  /** False until Firebase restores the persisted session (or confirms none). */
  ready: boolean;
  /** Where cold start should land after session + first-run flags resolve. */
  bootstrapRoute: AuthBootstrapRoute;
  refreshBootstrap: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function resolveBootstrapRoute(
  user: User | null,
): Promise<Exclude<AuthBootstrapRoute, "loading">> {
  if (user) {
    const wizardDone = await AsyncStorage.getItem(PERMISSIONS_WIZARD_KEY);
    return wizardDone === "true" ? "home" : "permissions";
  }
  const onboardingDone = await AsyncStorage.getItem(ONBOARDING_DONE_KEY);
  return onboardingDone === "true" ? "login" : "welcome";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [ready, setReady] = useState(false);
  const [bootstrapRoute, setBootstrapRoute] =
    useState<AuthBootstrapRoute>("loading");

  const refreshBootstrap = async () => {
    const next = await resolveBootstrapRoute(auth.currentUser);
    setBootstrapRoute(next);
  };

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = onAuthStateChanged(auth, (next) => {
      void (async () => {
        const route = await resolveBootstrapRoute(next);
        if (cancelled) return;
        setUser(next);
        setBootstrapRoute(route);
        setReady(true);
      })();
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({ user, ready, bootstrapRoute, refreshBootstrap }),
    [user, ready, bootstrapRoute],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
