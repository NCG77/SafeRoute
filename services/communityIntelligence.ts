/**
 * Phase 5 — Community Intelligence helpers for the Expo app.
 * Maps UI categories → API categories and submits via verifyReport.
 */
import * as Location from "expo-location";
import { auth } from "@/config/firebase";
import { postReport } from "@/services/callables";
import type { ReportRequest, ReportResponse } from "@/services/api";

export type UiReportCategory =
  | "lighting"
  | "harassment"
  | "crime"
  | "road"
  | "medical"
  | "infrastructure"
  | "other";

/** CommunityReport UI ids → Cloud Function / SRS categories */
export function mapReportCategory(
  uiCategory: string,
): ReportRequest["category"] {
  switch (uiCategory) {
    case "lighting":
      return "lighting";
    case "harassment":
      return "harassment";
    case "crime":
      return "crime";
    case "road":
    case "infrastructure":
      return "infrastructure";
    case "medical":
    case "other":
      return "other";
    default:
      return "other";
  }
}

/** Star rating (1 bad … 5 good) → report severity (1 low … 5 critical). */
export function ratingToSeverity(rating: number): 1 | 2 | 3 | 4 | 5 {
  const inverted = 6 - Math.round(Math.min(5, Math.max(1, rating)));
  return inverted as 1 | 2 | 3 | 4 | 5;
}

export type SubmitCommunityReportInput = {
  latitude: number;
  longitude: number;
  category: string;
  severity: number;
  note: string;
  anonymous?: boolean;
  photoPath?: string | null;
  voicePath?: string | null;
};

export type SubmitCommunityReportResult =
  | { ok: true; reportId: string; source: "firebase" }
  | { ok: false; error: string; needsAuth?: boolean };

/**
 * Submit a community safety report through Firebase verifyReport.
 * Requires a signed-in user (callable auth).
 */
export async function submitCommunityReport(
  input: SubmitCommunityReportInput,
): Promise<SubmitCommunityReportResult> {
  if (!auth.currentUser) {
    return {
      ok: false,
      needsAuth: true,
      error: "Sign in to contribute a community report.",
    };
  }

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    return { ok: false, error: "Location permission is required to file a report." };
  }

  const pos = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  const accuracyM = Math.max(1, Math.min(100, pos.coords.accuracy ?? 50));

  const severity = Math.min(
    5,
    Math.max(1, Math.round(input.severity)),
  ) as 1 | 2 | 3 | 4 | 5;

  const body: ReportRequest = {
    latitude: input.latitude,
    longitude: input.longitude,
    category: mapReportCategory(input.category),
    severity,
    note: (input.note || "").trim() || "Community safety report",
    anonymous: input.anonymous !== false,
    photoPath: input.photoPath ?? null,
    voicePath: input.voicePath ?? null,
    deviceLatitude: pos.coords.latitude,
    deviceLongitude: pos.coords.longitude,
    accuracyM,
  };

  try {
    const res = await postReport(body);
    const data = res.data as ReportResponse;
    if (!data?.accepted) {
      return {
        ok: false,
        error: data?.reason || "Report was not accepted.",
      };
    }
    return { ok: true, reportId: data.reportId, source: "firebase" };
  } catch (err: unknown) {
    const message =
      err && typeof err === "object" && "message" in err
        ? String((err as { message: string }).message)
        : "Could not submit report. Try again.";
    return { ok: false, error: message };
  }
}
