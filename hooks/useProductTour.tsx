import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

export const TOUR_DONE_KEY = "@SafeRoute:productTourDone";
export const TOUR_PENDING_KEY = "@SafeRoute:productTourPending";

export type TourStepId =
  | "search"
  | "safewalk"
  | "heatmap"
  | "sos"
  | "report"
  | "complete";

export type TourRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TourStep = {
  id: TourStepId;
  title: string;
  description: string;
  /** Target to spotlight; omit for celebration */
  targetId?: Exclude<TourStepId, "complete">;
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: "search",
    title: "Search Destination",
    description:
      "Type where you’re headed. SafeRoute ranks paths by lighting, crowds, and community reports—not just speed.",
    targetId: "search",
  },
  {
    id: "safewalk",
    title: "Safe Walk",
    description:
      "Start a live trip so your Primary Guardian can follow your progress until you arrive.",
    targetId: "safewalk",
  },
  {
    id: "heatmap",
    title: "Community Heat Map",
    description:
      "See safety around you from recent reports and lighting. Tap to open the full map.",
    targetId: "heatmap",
  },
  {
    id: "sos",
    title: "SOS Button",
    description:
      "Hold to trigger emergency help with a cancel window, SMS fallback, and guardian alerts.",
    targetId: "sos",
  },
  {
    id: "report",
    title: "Report Area",
    description:
      "Share lighting issues, hazards, or harassment so neighbors and future routes stay safer.",
    targetId: "report",
  },
  {
    id: "complete",
    title: "You’re ready",
    description:
      "That’s SafeRoute in a nutshell. Explore at your pace—you can replay this tour anytime in Profile.",
  },
];

type ProductTourContextValue = {
  active: boolean;
  stepIndex: number;
  step: TourStep;
  total: number;
  targets: Partial<Record<string, TourRect>>;
  measureEpoch: number;
  registerTarget: (id: string, rect: TourRect) => void;
  requestRemeasure: () => void;
  startTour: () => void;
  /** Navigate to Home first, then call this — starts the tour from the root overlay */
  requestReplay: () => void;
  next: () => void;
  skip: () => void;
  maybeAutoStart: () => Promise<void>;
  markPending: () => Promise<void>;
};

const ProductTourContext = createContext<ProductTourContextValue | null>(null);

export function ProductTourProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targets, setTargets] = useState<Partial<Record<string, TourRect>>>({});
  const [measureEpoch, setMeasureEpoch] = useState(0);
  /** Bumped on finish/skip/new-replay so delayed starts can't revive a dismissed tour */
  const launchGenRef = useRef(0);

  const registerTarget = useCallback((id: string, rect: TourRect) => {
    setTargets((prev) => {
      const cur = prev[id];
      if (
        cur &&
        Math.abs(cur.x - rect.x) < 1 &&
        Math.abs(cur.y - rect.y) < 1 &&
        Math.abs(cur.width - rect.width) < 1 &&
        Math.abs(cur.height - rect.height) < 1
      ) {
        return prev;
      }
      return { ...prev, [id]: rect };
    });
  }, []);

  const requestRemeasure = useCallback(() => {
    setMeasureEpoch((n) => n + 1);
  }, []);

  const activateTour = useCallback((gen: number) => {
    if (launchGenRef.current !== gen) return;
    setStepIndex(0);
    setActive(true);
    setMeasureEpoch((n) => n + 1);
    void AsyncStorage.multiSet([
      [TOUR_DONE_KEY, "false"],
      [TOUR_PENDING_KEY, "false"],
    ]);
  }, []);

  const finish = useCallback(async () => {
    launchGenRef.current += 1;
    setActive(false);
    setStepIndex(0);
    await AsyncStorage.multiSet([
      [TOUR_DONE_KEY, "true"],
      [TOUR_PENDING_KEY, "false"],
    ]);
  }, []);

  const startTour = useCallback(() => {
    const gen = ++launchGenRef.current;
    activateTour(gen);
  }, [activateTour]);

  const requestReplay = useCallback(() => {
    const gen = ++launchGenRef.current;
    activateTour(gen);
    void AsyncStorage.multiSet([
      [TOUR_DONE_KEY, "false"],
      [TOUR_PENDING_KEY, "false"],
    ]);
  }, [activateTour]);

  const next = useCallback(() => {
    setStepIndex((i) => {
      if (i >= TOUR_STEPS.length - 1) {
        void finish();
        return i;
      }
      return i + 1;
    });
    setMeasureEpoch((n) => n + 1);
  }, [finish]);

  const skip = useCallback(() => {
    void finish();
  }, [finish]);

  const markPending = useCallback(async () => {
    const done = await AsyncStorage.getItem(TOUR_DONE_KEY);
    if (done !== "true") {
      await AsyncStorage.setItem(TOUR_PENDING_KEY, "true");
    }
  }, []);

  const maybeAutoStart = useCallback(async () => {
    const [done, pending] = await AsyncStorage.multiGet([
      TOUR_DONE_KEY,
      TOUR_PENDING_KEY,
    ]);
    if (pending[1] === "true") {
      await AsyncStorage.setItem(TOUR_PENDING_KEY, "false");
      const gen = ++launchGenRef.current;
      setTimeout(() => activateTour(gen), 400);
      return;
    }
    if (done[1] === "true") return;
  }, [activateTour]);

  const value = useMemo(
    () => ({
      active,
      stepIndex,
      step: TOUR_STEPS[stepIndex] ?? TOUR_STEPS[0],
      total: TOUR_STEPS.length,
      targets,
      measureEpoch,
      registerTarget,
      requestRemeasure,
      startTour,
      requestReplay,
      next,
      skip,
      maybeAutoStart,
      markPending,
    }),
    [
      active,
      stepIndex,
      targets,
      measureEpoch,
      registerTarget,
      requestRemeasure,
      startTour,
      requestReplay,
      next,
      skip,
      maybeAutoStart,
      markPending,
    ],
  );

  return (
    <ProductTourContext.Provider value={value}>
      {children}
    </ProductTourContext.Provider>
  );
}

export function useProductTour(): ProductTourContextValue {
  const ctx = useContext(ProductTourContext);
  if (!ctx) {
    throw new Error("useProductTour must be used within ProductTourProvider");
  }
  return ctx;
}

export function useProductTourOptional(): ProductTourContextValue | null {
  return useContext(ProductTourContext);
}
