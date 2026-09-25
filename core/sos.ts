/**
 * Smart SOS client state machine.
 * Hold 2 seconds, then a 5-second cancel window, then an active alert.
 */

export const SOS_HOLD_MS = 2000;
export const SOS_CANCEL_MS = 5000;
export const SOS_GPS_INTERVAL_MS = 5000;
export const SOS_RETRY_LIMIT = 3;

export type SosPhase = "idle" | "holding" | "countdown" | "active" | "cancelled";

export type SosSession = {
  phase: SosPhase;
  holdStartedAtMs: number | null;
  countdownEndsAtMs: number | null;
  silent: boolean;
  siren: boolean;
  audio: boolean;
  snapshot: boolean;
  uploadAttempts: number;
};

export type SosEvent =
  | { type: "HOLD_START"; nowMs: number }
  | { type: "HOLD_RELEASE"; nowMs: number }
  | { type: "HOLD_COMPLETE"; nowMs: number }
  | { type: "CANCEL" }
  | { type: "COUNTDOWN_ELAPSED" }
  | { type: "UPLOAD_FAILED" }
  | { type: "UPLOAD_OK" }
  | { type: "TOGGLE_SILENT" }
  | { type: "TOGGLE_SIREN" }
  | { type: "TOGGLE_AUDIO" }
  | { type: "TOGGLE_SNAPSHOT" }
  | { type: "RESET" };

export function initialSos(prefs?: { silent?: boolean }): SosSession {
  return {
    phase: "idle",
    holdStartedAtMs: null,
    countdownEndsAtMs: null,
    silent: prefs?.silent ?? false,
    siren: false,
    audio: true,
    snapshot: false,
    uploadAttempts: 0,
  };
}

export function reduceSos(session: SosSession, event: SosEvent): SosSession {
  if (event.type === "TOGGLE_SILENT" && session.phase !== "active") {
    return { ...session, silent: !session.silent, siren: session.silent ? session.siren : false };
  }
  if (event.type === "TOGGLE_SIREN" && session.phase !== "active" && !session.silent) {
    return { ...session, siren: !session.siren };
  }
  if (event.type === "TOGGLE_AUDIO" && session.phase === "idle") {
    return { ...session, audio: !session.audio };
  }
  if (event.type === "TOGGLE_SNAPSHOT" && session.phase === "idle") {
    return { ...session, snapshot: !session.snapshot };
  }
  if (event.type === "RESET") return { ...initialSos(), silent: session.silent };

  switch (session.phase) {
    case "idle":
      if (event.type === "HOLD_START") {
        return { ...session, phase: "holding", holdStartedAtMs: event.nowMs };
      }
      return session;
    case "holding":
      if (event.type === "HOLD_RELEASE") {
        const held = session.holdStartedAtMs == null ? 0 : event.nowMs - session.holdStartedAtMs;
        if (held >= SOS_HOLD_MS) {
          return {
            ...session,
            phase: "countdown",
            countdownEndsAtMs: event.nowMs + SOS_CANCEL_MS,
          };
        }
        return { ...session, phase: "idle", holdStartedAtMs: null };
      }
      if (event.type === "HOLD_COMPLETE") {
        return {
          ...session,
          phase: "countdown",
          countdownEndsAtMs: event.nowMs + SOS_CANCEL_MS,
        };
      }
      return session;
    case "countdown":
      if (event.type === "CANCEL") {
        return { ...session, phase: "cancelled", countdownEndsAtMs: null };
      }
      if (event.type === "COUNTDOWN_ELAPSED") {
        return { ...session, phase: "active", countdownEndsAtMs: null, uploadAttempts: 1 };
      }
      return session;
    case "active":
      if (event.type === "UPLOAD_FAILED") {
        return { ...session, uploadAttempts: session.uploadAttempts + 1 };
      }
      return session;
    case "cancelled":
      if (event.type === "HOLD_START") {
        return { ...initialSos(), silent: session.silent, phase: "holding", holdStartedAtMs: event.nowMs };
      }
      return session;
    default:
      return session;
  }
}

export function smsFallbackRequired(session: SosSession, networkOnline: boolean): boolean {
  return session.phase === "active" && (!networkOnline || session.uploadAttempts > SOS_RETRY_LIMIT);
}
