import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import { auth, db } from "@/config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";

type AlertsBadgeContextValue = {
  unreadCount: number;
  hasUnread: boolean;
  setUnreadCount: (count: number) => void;
  markAllRead: () => void;
};

const AlertsBadgeContext = createContext<AlertsBadgeContextValue | null>(null);

export function AlertsBadgeProvider({ children }: { children: React.ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let stopFeed: (() => void) | undefined;
    const stopAuth = onAuthStateChanged(auth, (user) => {
      stopFeed?.();
      if (!user) {
        setUnreadCount(0);
        return;
      }
      stopFeed = onSnapshot(
        query(collection(db, "notifications"), where("userId", "==", user.uid)),
        (snapshot) => {
          setUnreadCount(
            snapshot.docs.reduce(
              (count, item) => count + (item.data().readAt ? 0 : 1),
              0,
            ),
          );
        },
      );
    });
    return () => {
      stopAuth();
      stopFeed?.();
    };
  }, []);

  const markAllRead = useCallback(() => setUnreadCount(0), []);

  const value = useMemo(
    () => ({
      unreadCount,
      hasUnread: unreadCount > 0,
      setUnreadCount,
      markAllRead,
    }),
    [unreadCount, markAllRead],
  );

  return (
    <AlertsBadgeContext.Provider value={value}>
      {children}
    </AlertsBadgeContext.Provider>
  );
}

export function useAlertsBadge(): AlertsBadgeContextValue {
  const ctx = useContext(AlertsBadgeContext);
  if (!ctx) {
    throw new Error("useAlertsBadge must be used within AlertsBadgeProvider");
  }
  return ctx;
}

/** Safe for tab chrome that may render before provider in edge cases. */
export function useAlertsBadgeOptional(): AlertsBadgeContextValue | null {
  return useContext(AlertsBadgeContext);
}
