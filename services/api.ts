/**
 * Callable contracts for the Cloud Functions in functions/src/index.ts.
 * Paths match the product API:
 *   POST /route
 *   POST /report
 *   POST /sos
 *   GET  /safety-score
 *   POST /safe-walk/start
 *   POST /safe-walk/checkin
 */

export type {
  AcceptGuardianInviteRequest,
  AcceptGuardianInviteResponse,
  DeliveryStatus,
  EmergencyEventRequest,
  GuardianInviteRequest,
  GuardianInviteResponse,
  GuardianInviteStatus,
  LiveShareStartRequest,
  MarkNotificationReadRequest,
  MarkNotificationReadResponse,
  NotificationDelivery,
  RevokeGuardianRequest,
  RevokeGuardianResponse,
  SafeWalkStartRequest,
  SafetyEventRequest,
  SafetyEventResponse,
  SafetyEventType,
  SafetyLocation,
  SafetySessionKind,
  SafetySessionStartResponse,
  SafetySessionState,
  SosRequest,
  SosResponse,
} from "../core/guardianSafety";

export type LatLng = { latitude: number; longitude: number };

export type RouteRequest = {
  origin: LatLng;
  destination: LatLng;
  departAtMs: number;
};

export type RouteCard = {
  mode: "safest" | "balanced" | "fastest";
  title: string;
  distanceM: number;
  etaMinutes: number;
  safetyScore: number;
  confidence: number | null;
  lighting: number | null;
  crowd: number | null;
  nodeIds: string[];
};

export type RouteResponse = {
  routes: RouteCard[];
};

export type ReportRequest = {
  latitude: number;
  longitude: number;
  category: "lighting" | "harassment" | "crime" | "infrastructure" | "other";
  severity: 1 | 2 | 3 | 4 | 5;
  note: string;
  anonymous: boolean;
  photoPath: string | null;
  voicePath: string | null;
  deviceLatitude: number;
  deviceLongitude: number;
  accuracyM: number;
};

export type ReportResponse = {
  reportId: string;
  accepted: boolean;
  reason: string | null;
};

export type SafetyScoreQuery = {
  latitude: number;
  longitude: number;
  departAtMs: number;
};

export type SafetyScoreResponse = {
  score: number;
  confidence: number;
  geohash: string;
  modelApplied: boolean;
};

export type SafeWalkStartResponse =
  import("../core/guardianSafety").SafetySessionStartResponse;

export type SafeWalkCheckinRequest = {
  sessionId: string;
  ok: boolean;
  eventId?: string;
  location?: import("../core/guardianSafety").SafetyLocation | null;
};

export type SafeWalkCheckinResponse = {
  state: "active" | "sos";
  eventId: string;
  duplicate: boolean;
  deliveries: import("../core/guardianSafety").NotificationDelivery[];
  sms_required: boolean;
};

export type EmergencyEventResponse = {
  emergencyId: string;
  eventId: string;
  duplicate: boolean;
  state: "active" | "resolved" | "cancelled";
  deliveries: import("../core/guardianSafety").NotificationDelivery[];
  sms_required: boolean;
};

export type NotificationDocument = {
  userId: string;
  fromUserId: string;
  subjectId: string;
  type: string;
  title: string;
  body: string;
  route: string;
  data: Record<string, string>;
  readAt: unknown | null;
  createdAt: unknown;
  delivery?: import("../core/guardianSafety").NotificationDelivery;
};
