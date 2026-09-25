import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme as useSystemScheme } from "react-native";

const STORAGE_KEY = "@SafeRoute:appearance";

export type AppearanceMode = "system" | "light" | "dark";

type AppearanceContextValue = {
  mode: AppearanceMode;
  scheme: "light" | "dark";
  setMode: (mode: AppearanceMode) => void;
};

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function isMode(value: string | null): value is AppearanceMode {
  return value === "system" || value === "light" || value === "dark";
}

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const system = useSystemScheme();
  const [mode, setModeState] = useState<AppearanceMode>("system");

  useEffect(() => {
    void AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (isMode(stored)) setModeState(stored);
    });
  }, []);

  const setMode = useCallback((next: AppearanceMode) => {
    setModeState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const scheme: "light" | "dark" =
    mode === "system" ? (system === "dark" ? "dark" : "light") : mode;

  const value = useMemo(
    () => ({ mode, scheme, setMode }),
    [mode, scheme, setMode],
  );

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance(): AppearanceContextValue {
  const ctx = useContext(AppearanceContext);
  if (!ctx) {
    throw new Error("useAppearance must be used within AppearanceProvider");
  }
  return ctx;
}
