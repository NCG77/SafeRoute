/**
 * Firebase Auth ships getReactNativePersistence only on the RN entry.
 * Browser typings omit it; this augments the module for Expo / Metro RN builds.
 */
import type { Persistence } from "firebase/auth";

declare module "firebase/auth" {
  export function getReactNativePersistence(storage: {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
  }): Persistence;
}
