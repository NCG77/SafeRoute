import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import {
  onDocumentCreated,
  onDocumentWritten,
} from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { calculateSafetyScore as scoreSegment } from "../../core/safetyScore";
import { encodeGeohash } from "../../core/geohash";
import type {
  DeliveryStatus,
  EmergencyEventType,
  NotificationDelivery,
  SafetyEventType,
  SafetyLocation,
  SafetySessionKind,
  SafetySessionState,
} from "../../core/guardianSafety";
import {
  isDuplicateReport,
  isLocationMismatch,
  isRateLimited,
} from "../../core/trust";
import {
  generateRoutes as searchRoutes,
  haversineM,
  type GraphEdge,
  type GraphNode,
} from "../../core/routeOptimization";

initializeApp();
const db = getFirestore();

function requireAuth(uid: string | undefined): string {
  if (!uid) throw new HttpsError("unauthenticated", "Sign in is required.");
  return uid;
}

/** GET /safety-score — callable calculateSafetyScore */
export const calculateSafetyScore = onCall(async (request) => {
  requireAuth(request.auth?.uid);
  const { latitude, longitude, departAtMs } = request.data as {
    latitude: number;
    longitude: number;
    departAtMs: number;
  };
  const when = new Date(departAtMs);
  const geohash = encodeGeohash(latitude, longitude, 7);
  const snap = await db.collection("safety_scores").doc(geohash).get();
  const stored = snap.data();
  const result = scoreSegment({
    hour: when.getHours() + when.getMinutes() / 60,
    dayOfWeek: when.getDay(),
    communityRating: stored?.communityRating ?? null,
    crowdDensity: stored?.crowdDensity ?? null,
    streetLighting: stored?.streetLighting ?? null,
    visibilityKm: stored?.visibilityKm ?? null,
    policeDistanceM: stored?.policeDistanceM ?? null,
    cctv: stored?.cctv ?? null,
    verifiedIncidents30d: stored?.verifiedIncidents30d ?? null,
    historicalReports: stored?.historicalReports ?? null,
    xgbRisk: stored?.xgbRisk ?? null,
    xgbConfidence: stored?.xgbConfidence ?? null,
  });
  return {
    score: result.score,
    confidence: result.confidence,
    geohash,
    modelApplied: result.modelApplied,
  };
});

/** POST /route — callable generateRoutes. The client also runs the same planner. */
export const generateRoutes = onCall(async (request) => {
  requireAuth(request.auth?.uid);
  const { origin, destination, departAtMs } = request.data as {
    origin: { latitude: number; longitude: number };
    destination: { latitude: number; longitude: number };
    departAtMs: number;
  };
  const originHash = encodeGeohash(origin.latitude, origin.longitude, 6);
  const segments = await db
    .collection("road_segments")
    .where("geohash6", "==", originHash)
    .limit(400)
    .get();
  const nodes: Record<string, GraphNode> = {};
  const edges: GraphEdge[] = [];
  segments.docs.forEach((doc) => {
    const row = doc.data();
    const fromId = String(row.fromNodeId);
    const toId = String(row.toNodeId);
    nodes[fromId] = {
      id: fromId,
      latitude: row.fromLat,
      longitude: row.fromLng,
    };
    nodes[toId] = {
      id: toId,
      latitude: row.toLat,
      longitude: row.toLng,
    };
    edges.push({
      id: doc.id,
      from: fromId,
      to: toId,
      lengthM: row.lengthM,
      speedKmh: row.speedKmh,
      safetyScore: row.safetyScore,
      lighting: row.lighting ?? null,
      crowd: row.crowd ?? null,
    });
  });
  if (edges.length === 0) {
    return {
      routes: [],
      segmentCount: 0,
      departAtMs,
      destination,
    };
  }
  const nearest = (point: { latitude: number; longitude: number }) => {
    let bestId = Object.keys(nodes)[0];
    let best = Infinity;
    for (const node of Object.values(nodes)) {
      const distance = haversineM(point, node);
      if (distance < best) {
        best = distance;
        bestId = node.id;
      }
    }
    return bestId;
  };
  const searched = searchRoutes(
    { nodes, edges },
    nearest(origin),
    nearest(destination)
  );
  const cards = (["safest", "balanced", "fastest"] as const).flatMap((mode) => {
    const path = searched[mode];
    if (!path) return [];
    return [
      {
        mode,
        title:
          mode === "safest"
            ? "Safest Route"
            : mode === "balanced"
              ? "Balanced Route"
              : "Fastest Route",
        distanceM: path.distanceM,
        etaMinutes: path.etaMinutes,
        safetyScore: path.safetyScore,
        lighting: path.lighting,
        crowd: path.crowd,
        confidence: null,
        nodeIds: path.nodeIds,
      },
    ];
  });
  return { routes: cards, segmentCount: edges.length, departAtMs };
});

/** POST /report — writes the report, then verifyReport adjusts trust. */
export const verifyReport = onCall(async (request) => {
  const uid = requireAuth(request.auth?.uid);
  const data = request.data as {
    latitude: number;
    longitude: number;
    category: string;
    severity: number;
    note: string;
    anonymous: boolean;
    deviceLatitude: number;
    deviceLongitude: number;
    accuracyM: number;
  };
  if (data.accuracyM > 100) {
    throw new HttpsError("failed-precondition", "Location accuracy is coarser than 100 m.");
  }
  const distanceM = haversineM(
    { latitude: data.deviceLatitude, longitude: data.deviceLongitude },
    { latitude: data.latitude, longitude: data.longitude }
  );
  if (isLocationMismatch(distanceM)) {
    await db.collection("trust_logs").add({
      userId: uid,
      delta: -10,
      reason: "location_mismatch",
      createdAt: FieldValue.serverTimestamp(),
    });
    throw new HttpsError("failed-precondition", "Report location does not match the device.");
  }
  const recent = await db
    .collection("reports")
    .where("authorIdPrivate", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(5)
    .get();
  const stamps = recent.docs
    .map((doc) => doc.get("createdAt")?.toMillis?.() ?? 0)
    .filter((ms) => ms > 0);
  if (isRateLimited(stamps, Date.now())) {
    throw new HttpsError("resource-exhausted", "Report limit reached for this hour.");
  }
  const geohash = encodeGeohash(data.latitude, data.longitude, 7);
  const last = recent.docs[0];
  if (
    last &&
    isDuplicateReport({
      lastGeohash: last.get("geohash") ?? null,
      lastCategory: last.get("category") ?? null,
      lastTimestampMs: last.get("createdAt")?.toMillis?.() ?? null,
      geohash,
      category: data.category,
      nowMs: Date.now(),
    })
  ) {
    throw new HttpsError("already-exists", "A matching report was filed in the last hour.");
  }
  const ref = await db.collection("reports").add({
    authorId: data.anonymous ? null : uid,
    authorIdPrivate: uid,
    anonymous: data.anonymous,
    latitude: data.latitude,
    longitude: data.longitude,
    geohash,
    category: data.category,
    severity: data.severity,
    note: data.note,
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
  });
  return { reportId: ref.id, accepted: true, reason: null };
});

export const onReportCreated = onDocumentCreated("reports/{reportId}", async (event) => {
  const report = event.data?.data();
  const userId = report?.authorIdPrivate;
  if (!report || typeof userId !== "string") return;
  await createAndDispatchNotification({
    userId,
    fromUserId: userId,
    subjectId: event.params.reportId,
    eventId: event.params.reportId,
    type: "report_pending",
    title: "Report received",
    body: "Your safety report is being verified.",
    route: "/(tabs)/alerts",
    data: {
      reportId: event.params.reportId,
      geohash: String(report.geohash ?? ""),
    },
  });
});

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const EVENT_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

function requiredString(value: unknown, name: string, max = 256): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) {
    throw new HttpsError("invalid-argument", `${name} is required.`);
  }
  return value.trim();
}

function optionalString(value: unknown, max = 256): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || value.length > max) {
    throw new HttpsError("invalid-argument", "Invalid string value.");
  }
  return value.trim();
}

function eventId(value: unknown): string {
  const id = requiredString(value, "eventId", 128);
  if (!EVENT_ID_RE.test(id)) {
    throw new HttpsError("invalid-argument", "eventId contains unsupported characters.");
  }
  return id;
}

function validLocation(value: unknown): SafetyLocation | null {
  if (value == null || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const latitude = row.latitude;
  const longitude = row.longitude;
  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new HttpsError("invalid-argument", "A valid location is required.");
  }
  return {
    latitude,
    longitude,
    accuracyM:
      typeof row.accuracyM === "number" && Number.isFinite(row.accuracyM)
        ? Math.max(0, row.accuracyM)
        : null,
    recordedAtMs:
      typeof row.recordedAtMs === "number" && Number.isFinite(row.recordedAtMs)
        ? row.recordedAtMs
        : Date.now(),
  };
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function documentId(prefix: string, uid: string, id: string): string {
  return `${prefix}_${hash(`${uid}:${id}`).slice(0, 40)}`;
}

function uniqueStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string =>
    typeof item === "string" && item.length > 0 && item.length <= 128
  ))];
}

async function acceptedGuardianIds(
  ownerId: string,
  requestedIds?: string[]
): Promise<string[]> {
  const snap = await db
    .collection("guardians")
    .where("userId", "==", ownerId)
    .where("status", "==", "accepted")
    .get();
  const accepted = new Set(
    snap.docs
      .map((doc) => doc.get("guardianUserId"))
      .filter((id): id is string => typeof id === "string" && id.length > 0)
  );
  if (!requestedIds || requestedIds.length === 0) return [...accepted];
  const requested = [...new Set(requestedIds)];
  if (requested.some((id) => !accepted.has(id))) {
    throw new HttpsError(
      "failed-precondition",
      "Every participant must be an accepted guardian."
    );
  }
  return requested;
}

type NotificationInput = {
  userId: string;
  fromUserId: string;
  subjectId: string;
  type: string;
  title: string;
  body: string;
  route: string;
  data: Record<string, string>;
  eventId?: string;
};

function isExpoToken(token: unknown): token is string {
  return (
    typeof token === "string" &&
    /^(ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/.test(token)
  );
}

async function sendExpo(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, string>
): Promise<{ status: DeliveryStatus; ticketIds: string[]; error?: string }> {
  if (tokens.length === 0) return { status: "no_push_token", ticketIds: [] };
  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        tokens.map((to) => ({
          to,
          title,
          body,
          data,
          sound: "default",
          priority: "high",
          channelId: "safety-alerts",
        }))
      ),
    });
    if (!response.ok) {
      return {
        status: "failed",
        ticketIds: [],
        error: `Expo Push Service returned HTTP ${response.status}.`,
      };
    }
    const payload = (await response.json()) as {
      data?: Array<{
        status?: string;
        id?: string;
        message?: string;
        details?: { error?: string };
      }>;
    };
    const tickets = Array.isArray(payload.data) ? payload.data : [];
    const ticketIds = tickets
      .map((ticket) => ticket.id)
      .filter((id): id is string => typeof id === "string");
    if (tickets.some((ticket) => ticket.status === "ok")) {
      return { status: "sent", ticketIds };
    }
    const invalid = tickets.length > 0 && tickets.every(
      (ticket) => ticket.details?.error === "DeviceNotRegistered"
    );
    return {
      status: invalid ? "invalid_push_token" : "failed",
      ticketIds,
      error: tickets.map((ticket) => ticket.message).filter(Boolean).join("; ") ||
        "Expo Push Service did not accept the notification.",
    };
  } catch (error) {
    return {
      status: "failed",
      ticketIds: [],
      error: error instanceof Error ? error.message : "Push delivery failed.",
    };
  }
}

async function createAndDispatchNotification(
  input: NotificationInput
): Promise<NotificationDelivery> {
  const id = input.eventId
    ? documentId(
        "notification",
        input.userId,
        `${input.subjectId}:${input.type}:${input.eventId}`
      )
    : db.collection("notifications").doc().id;
  const ref = db.collection("notifications").doc(id);
  const existing = await ref.get();
  if (existing.exists && existing.get("delivery")) {
    return existing.get("delivery") as NotificationDelivery;
  }
  await ref.set(
    {
      userId: input.userId,
      fromUserId: input.fromUserId,
      subjectId: input.subjectId,
      type: input.type,
      title: input.title,
      body: input.body,
      route: input.route,
      data: input.data,
      readAt: null,
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  const user = await db.collection("users").doc(input.userId).get();
  const allTokens = [
    ...(Array.isArray(user.get("expoPushTokens")) ? user.get("expoPushTokens") : []),
    user.get("expoPushToken"),
  ];
  const tokens = [...new Set(allTokens.filter(isExpoToken))].slice(0, 100);
  const result = await sendExpo(tokens, input.title, input.body, {
    ...input.data,
    route: input.route,
    notificationId: id,
  });
  const delivery: NotificationDelivery = {
    userId: input.userId,
    notificationId: id,
    status: result.status,
    sms_required: result.status !== "sent",
    ticketIds: result.ticketIds,
    ...(result.error ? { error: result.error } : {}),
  };
  await ref.set(
    { delivery, deliveredAt: FieldValue.serverTimestamp() },
    { merge: true }
  );
  return delivery;
}

async function notifyParticipants(input: {
  ownerId: string;
  participantIds: string[];
  subjectId: string;
  eventId: string;
  type: string;
  title: string;
  body: string;
  route: string;
  data?: Record<string, string>;
  includeOwner?: boolean;
}): Promise<NotificationDelivery[]> {
  const recipients = input.participantIds.filter(
    (id) => input.includeOwner || id !== input.ownerId
  );
  return Promise.all(
    recipients.map((userId) =>
      createAndDispatchNotification({
        userId,
        fromUserId: input.ownerId,
        subjectId: input.subjectId,
        eventId: input.eventId,
        type: input.type,
        title: input.title,
        body: input.body,
        route: input.route,
        data: { subjectId: input.subjectId, type: input.type, ...(input.data ?? {}) },
      })
    )
  );
}

/** Creates a token-bound guardian invitation. Guardian writes are callable-only. */
export const createGuardianInvite = onCall(async (request) => {
  const uid = requireAuth(request.auth?.uid);
  const data = (request.data ?? {}) as Record<string, unknown>;
  const existingId = optionalString(data.connectionId, 128);
  if (existingId) {
    const ref = db.collection("guardians").doc(existingId);
    const snap = await ref.get();
    if (!snap.exists || snap.get("userId") !== uid) {
      throw new HttpsError("not-found", "Guardian invitation not found.");
    }
    if (snap.get("status") === "accepted") {
      throw new HttpsError("failed-precondition", "Guardian is already connected.");
    }
    const inviteToken = randomBytes(32).toString("base64url");
    const expiresAtMs = Date.now() + INVITE_TTL_MS;
    await ref.update({
      status: "pending",
      inviteTokenHash: hash(inviteToken),
      expiresAt: Timestamp.fromMillis(expiresAtMs),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return {
      inviteId: ref.id,
      inviteToken,
      status: "pending" as const,
      expiresAtMs,
      delivery: null,
      sms_required: true,
    };
  }
  let guardianUserId = optionalString(data.guardianUserId, 128);
  const email = optionalString(data.email)?.toLowerCase() ?? null;
  const phone = optionalString(data.phone, 32)?.replace(/[^\d+]/g, "") ?? null;
  if (guardianUserId === uid) {
    throw new HttpsError("invalid-argument", "You cannot invite yourself.");
  }
  if (!guardianUserId && !email && !phone) {
    throw new HttpsError(
      "invalid-argument",
      "guardianUserId, email, or phone is required."
    );
  }
  if (!guardianUserId) {
    const field = email ? "email" : "phoneNumber";
    const value = email ?? phone;
    const match = await db.collection("users").where(field, "==", value).limit(1).get();
    guardianUserId = match.empty ? null : match.docs[0].id;
  }
  const existing = await db
    .collection("guardians")
    .where("userId", "==", uid)
    .where("status", "in", ["pending", "accepted"])
    .get();
  if (existing.size >= 5) {
    throw new HttpsError("resource-exhausted", "Guardian limit reached.");
  }
  if (
    guardianUserId &&
    existing.docs.some((doc) => doc.get("guardianUserId") === guardianUserId)
  ) {
    throw new HttpsError("already-exists", "This guardian is already invited.");
  }
  const inviteToken = randomBytes(32).toString("base64url");
  const ref = db.collection("guardians").doc();
  const expiresAtMs = Date.now() + INVITE_TTL_MS;
  await ref.set({
    userId: uid,
    ownerId: uid,
    guardianUserId,
    inviteeEmail: email,
    inviteePhone: phone,
    displayName: optionalString(data.displayName, 100),
    relationship: optionalString(data.relationship, 50),
    status: "pending",
    inviteTokenHash: hash(inviteToken),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    expiresAt: Timestamp.fromMillis(expiresAtMs),
  });
  const delivery = guardianUserId
    ? await createAndDispatchNotification({
        userId: guardianUserId,
        fromUserId: uid,
        subjectId: ref.id,
        eventId: ref.id,
        type: "guardian_invite",
        title: "Guardian invitation",
        body: "Someone invited you to be their SafeRoute guardian.",
        route: "/(tabs)/contacts",
        data: { inviteId: ref.id },
      })
    : null;
  return {
    inviteId: ref.id,
    inviteToken,
    status: "pending" as const,
    expiresAtMs,
    delivery,
    sms_required: !delivery || delivery.sms_required,
  };
});

export const inviteGuardian = createGuardianInvite;

export const acceptGuardianInvite = onCall(async (request) => {
  const uid = requireAuth(request.auth?.uid);
  const data = (request.data ?? {}) as Record<string, unknown>;
  const inviteId = requiredString(data.inviteId, "inviteId", 128);
  const token = requiredString(data.inviteToken, "inviteToken", 256);
  const ref = db.collection("guardians").doc(inviteId);
  const now = Timestamp.now();
  const ownerId = await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists) throw new HttpsError("not-found", "Invitation not found.");
    const row = snap.data()!;
    if (row.status === "accepted" && row.guardianUserId === uid) return row.userId as string;
    if (row.status !== "pending") {
      throw new HttpsError("failed-precondition", "Invitation is no longer active.");
    }
    if (row.expiresAt instanceof Timestamp && row.expiresAt.toMillis() <= now.toMillis()) {
      throw new HttpsError("deadline-exceeded", "Invitation has expired.");
    }
    const expected = Buffer.from(String(row.inviteTokenHash), "hex");
    const supplied = Buffer.from(hash(token), "hex");
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
      throw new HttpsError("permission-denied", "Invitation token is invalid.");
    }
    // Possession of the high-entropy, one-time token is the acceptance proof
    // when the invite was sent to a phone number that is not an auth claim.
    const intended = !row.guardianUserId || row.guardianUserId === uid;
    if (!intended) {
      throw new HttpsError("permission-denied", "Invitation is intended for another account.");
    }
    transaction.update(ref, {
      guardianUserId: uid,
      status: "accepted",
      acceptedAt: now,
      updatedAt: now,
      inviteTokenHash: FieldValue.delete(),
    });
    return row.userId as string;
  });
  await createAndDispatchNotification({
    userId: ownerId,
    fromUserId: uid,
    subjectId: inviteId,
    eventId: `accepted-${inviteId}`,
    type: "guardian_accepted",
    title: "Guardian connected",
    body: "Your guardian accepted the SafeRoute invitation.",
    route: "/(tabs)/contacts",
    data: { inviteId },
  });
  return { guardianId: inviteId, ownerId, guardianUserId: uid, status: "accepted" as const };
});

export const revokeGuardian = onCall(async (request) => {
  const uid = requireAuth(request.auth?.uid);
  const guardianId = requiredString(
    (request.data as Record<string, unknown> | undefined)?.guardianId,
    "guardianId",
    128
  );
  const ref = db.collection("guardians").doc(guardianId);
  const revokedUserId = await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists) throw new HttpsError("not-found", "Guardian relationship not found.");
    if (snap.get("userId") !== uid) {
      throw new HttpsError("permission-denied", "Only the owner can revoke a guardian.");
    }
    transaction.update(ref, {
      status: "revoked",
      revokedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      inviteTokenHash: FieldValue.delete(),
    });
    return typeof snap.get("guardianUserId") === "string"
      ? (snap.get("guardianUserId") as string)
      : null;
  });
  if (revokedUserId) {
    const [routes, emergencies] = await Promise.all([
      db.collection("routes").where("userId", "==", uid).limit(200).get(),
      db.collection("emergencies").where("userId", "==", uid).limit(200).get(),
    ]);
    const active = [...routes.docs, ...emergencies.docs].filter(
      (doc) =>
        !["completed", "cancelled", "resolved"].includes(String(doc.get("state")))
    );
    const batch = db.batch();
    active.forEach((doc) => {
      batch.update(doc.ref, {
        participantIds: FieldValue.arrayRemove(revokedUserId),
        guardianUserIds: FieldValue.arrayRemove(revokedUserId),
        updatedAt: FieldValue.serverTimestamp(),
      });
      batch.set(
        doc.ref.collection("live").doc("current"),
        {
          participantIds: FieldValue.arrayRemove(revokedUserId),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });
    if (active.length > 0) await batch.commit();
  }
  return { guardianId, status: "revoked" as const };
});

async function createSafetySession(
  ownerId: string,
  kind: SafetySessionKind,
  data: Record<string, unknown>
) {
  const requested = uniqueStrings(
    data.guardianUserIds ?? (data.guardianUserId ? [data.guardianUserId] : [])
  );
  const hasExplicitGuardians =
    Array.isArray(data.guardianUserIds) || data.guardianUserId != null;
  const guardianIds =
    hasExplicitGuardians && requested.length === 0
      ? []
      : await acceptedGuardianIds(ownerId, requested);
  const idempotencyKey =
    data.eventId == null ? randomUUID() : eventId(data.eventId);
  const sessionId = documentId(kind, ownerId, idempotencyKey);
  const ref = db.collection("routes").doc(sessionId);
  const location = kind === "live_share" ? validLocation(data.location) : null;
  const destination = kind === "safe_walk" ? validLocation(data.destination) : null;
  if (kind === "safe_walk" && !destination) {
    throw new HttpsError("invalid-argument", "destination is required.");
  }
  const participantIds = [ownerId, ...guardianIds];
  const ownerProfile = await db.collection("users").doc(ownerId).get();
  const walkerName =
    optionalString(data.walkerName, 100) ||
    optionalString(ownerProfile.get("displayName"), 100) ||
    "Someone you trust";
  const created = await db.runTransaction(async (transaction) => {
    const existing = await transaction.get(ref);
    if (existing.exists) {
      if (existing.get("userId") !== ownerId) {
        throw new HttpsError("permission-denied", "Session ID is already in use.");
      }
      return false;
    }
    const now = FieldValue.serverTimestamp();
    transaction.create(ref, {
      kind,
      userId: ownerId,
      ownerId,
      guardianUserId: guardianIds[0],
      guardianUserIds: guardianIds,
      participantIds,
      walkerName,
      destination,
      destinationLabel: optionalString(data.destinationLabel, 200),
      etaMinutes:
        typeof data.etaMinutes === "number" && Number.isFinite(data.etaMinutes)
          ? Math.max(0, data.etaMinutes)
          : null,
      expiresAt:
        typeof data.expiresAtMs === "number"
          ? Timestamp.fromMillis(data.expiresAtMs)
          : null,
      state: "active",
      lastEventId: idempotencyKey,
      createdAt: now,
      updatedAt: now,
    });
    transaction.create(ref.collection("events").doc(idempotencyKey), {
      eventId: idempotencyKey,
      type: "started",
      actorId: ownerId,
      location,
      createdAt: now,
    });
    transaction.set(ref.collection("live").doc("current"), {
      ownerId,
      participantIds,
      state: "active",
      location,
      eventId: idempotencyKey,
      updatedAt: now,
    });
    return true;
  });
  const deliveries = created
    ? await notifyParticipants({
        ownerId,
        participantIds,
        subjectId: sessionId,
        eventId: idempotencyKey,
        type: `${kind}_started`,
        title: kind === "safe_walk" ? "Safe Walk started" : "Live location shared",
        body:
          kind === "safe_walk"
            ? `${walkerName} started a Safe Walk. Tap to follow their live location.`
            : `${walkerName} shared a live location with you.`,
        route: `/LiveWalkViewer?sessionId=${sessionId}&collection=routes`,
        data: { sessionId, kind },
      })
    : [];
  return {
    sessionId,
    state: "active" as const,
    participantIds,
    deliveries,
    sms_required:
      guardianIds.length === 0 ||
      deliveries.some((item) => item.sms_required),
  };
}

/** POST /safe-walk/start */
export const startSafeWalk = onCall(async (request) => {
  const uid = requireAuth(request.auth?.uid);
  return createSafetySession(uid, "safe_walk", request.data ?? {});
});

export const startLiveShare = onCall(async (request) => {
  const uid = requireAuth(request.auth?.uid);
  return createSafetySession(uid, "live_share", request.data ?? {});
});

const SAFETY_EVENTS = new Set<SafetyEventType>([
  "started",
  "location",
  "checkin_requested",
  "checkin_ok",
  "checkin_failed",
  "guardian_acknowledged",
  "arrived",
  "ended",
  "cancelled",
]);

function stateForSafetyEvent(type: SafetyEventType, current: string): SafetySessionState {
  if (type === "checkin_requested") return "check_in_pending";
  if (type === "checkin_failed") return "sos";
  if (type === "arrived" || type === "ended") return "completed";
  if (type === "cancelled") return "cancelled";
  if (type === "checkin_ok") return "active";
  return current as SafetySessionState;
}

async function publishSafetyEventInternal(
  uid: string,
  data: Record<string, unknown>
) {
  const sessionId = requiredString(data.sessionId, "sessionId", 128);
  const id = eventId(data.eventId);
  const type = requiredString(data.type, "type", 64) as SafetyEventType;
  if (!SAFETY_EVENTS.has(type) || type === "started") {
    throw new HttpsError("invalid-argument", "Unsupported safety event type.");
  }
  const location = validLocation(data.location);
  const ref = db.collection("routes").doc(sessionId);
  let participantIds: string[] = [];
  let ownerId = "";
  let state: SafetySessionState = "active";
  const duplicate = await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists) throw new HttpsError("not-found", "Safety session not found.");
    participantIds = uniqueStrings(snap.get("participantIds"));
    ownerId = String(snap.get("ownerId") ?? snap.get("userId") ?? "");
    if (!participantIds.includes(uid)) {
      throw new HttpsError("permission-denied", "You are not a session participant.");
    }
    if (uid !== ownerId && type !== "guardian_acknowledged") {
      throw new HttpsError("permission-denied", "Only the session owner can publish this event.");
    }
    const eventRef = ref.collection("events").doc(id);
    const existing = await transaction.get(eventRef);
    const currentState = String(snap.get("state") ?? "active");
    if (
      !existing.exists &&
      ["completed", "cancelled", "expired"].includes(currentState)
    ) {
      throw new HttpsError(
        "failed-precondition",
        "This safety session is already closed."
      );
    }
    state = stateForSafetyEvent(type, currentState);
    if (existing.exists) return true;
    const now = FieldValue.serverTimestamp();
    transaction.create(eventRef, {
      eventId: id,
      type,
      actorId: uid,
      location,
      etaMinutes:
        typeof data.etaMinutes === "number" ? Math.max(0, data.etaMinutes) : null,
      data: data.data && typeof data.data === "object" ? data.data : {},
      createdAt: now,
    });
    transaction.update(ref, { state, lastEventId: id, updatedAt: now });
    transaction.set(
      ref.collection("live").doc("current"),
      {
        ownerId,
        participantIds,
        state,
        eventId: id,
        ...(location ? { location } : {}),
        updatedAt: now,
      },
      { merge: true }
    );
    return false;
  });
  const shouldNotify = !duplicate && !["location", "checkin_ok"].includes(type);
  const ownerProfile = await db.collection("users").doc(ownerId).get();
  const walkerName =
    optionalString(ownerProfile.get("displayName"), 100) ||
    "Someone you trust";
  const deliveries = shouldNotify
    ? await notifyParticipants({
        ownerId,
        participantIds,
        subjectId: sessionId,
        eventId: id,
        type: `safety_${type}`,
        title: type === "checkin_failed" ? "Safety check-in missed" : "Safe Walk update",
        body: type === "arrived"
          ? `${walkerName} arrived safely.`
          : "Open SafeRoute for the latest safety update.",
        route: `/LiveWalkViewer?sessionId=${sessionId}&collection=routes`,
        data: { sessionId, eventType: type },
        includeOwner: uid !== ownerId,
      })
    : [];
  return {
    sessionId,
    eventId: id,
    duplicate,
    state,
    deliveries,
    sms_required: deliveries.some((item) => item.sms_required),
  };
}

export const publishSafetyEvent = onCall(async (request) => {
  const uid = requireAuth(request.auth?.uid);
  return publishSafetyEventInternal(uid, request.data ?? {});
});

export const onLiveRouteLocationUpdated = onDocumentWritten(
  "routes/{routeId}/live/current",
  async (event) => {
    const live = event.data?.after.data();
    const location = live?.location;
    if (
      typeof location?.latitude !== "number" ||
      typeof location?.longitude !== "number" ||
      live?.source !== "background"
    ) {
      return;
    }
    const route = await db.collection("routes").doc(event.params.routeId).get();
    if (
      !route.exists ||
      route.get("kind") !== "safe_walk" ||
      route.get("state") !== "active"
    ) {
      return;
    }
    const destination = route.get("destination");
    if (
      typeof destination?.latitude !== "number" ||
      typeof destination?.longitude !== "number" ||
      haversineM(location, destination) > 50
    ) {
      return;
    }
    await publishSafetyEventInternal(String(route.get("ownerId")), {
      sessionId: event.params.routeId,
      eventId: `arrival-${event.params.routeId}`,
      type: "arrived",
      location,
    });
  }
);

export const publishSafeWalkEvent = publishSafetyEvent;
export const publishLiveShareEvent = publishSafetyEvent;

/** Compatibility endpoint for the original boolean check-in contract. */
export const safeWalkCheckin = onCall(async (request) => {
  const uid = requireAuth(request.auth?.uid);
  const data = (request.data ?? {}) as Record<string, unknown>;
  const ok = data.ok === true;
  const result = await publishSafetyEventInternal(uid, {
    sessionId: data.sessionId,
    eventId: data.eventId ?? randomUUID(),
    type: ok ? "checkin_ok" : "checkin_failed",
    location: data.location,
  });
  return { ...result, state: ok ? ("active" as const) : ("sos" as const) };
});

/** POST /sos */
export const activateSOS = onCall(async (request) => {
  const uid = requireAuth(request.auth?.uid);
  const data = (request.data ?? {}) as Record<string, unknown>;
  const id = data.eventId == null ? randomUUID() : eventId(data.eventId);
  const location = validLocation({
    latitude: data.latitude,
    longitude: data.longitude,
    accuracyM: data.accuracyM,
    recordedAtMs: Date.now(),
  });
  if (!location) throw new HttpsError("invalid-argument", "Location is required.");
  const requested = uniqueStrings(data.guardianUserIds);
  const guardianIds = await acceptedGuardianIds(uid, requested);
  const participantIds = [uid, ...guardianIds];
  const emergencyId = documentId("sos", uid, id);
  const ref = db.collection("emergencies").doc(emergencyId);
  const duplicate = await db.runTransaction(async (transaction) => {
    const existing = await transaction.get(ref);
    if (existing.exists) return true;
    const now = FieldValue.serverTimestamp();
    transaction.create(ref, {
      userId: uid,
      ownerId: uid,
      guardianUserIds: guardianIds,
      participantIds,
      latitude: location.latitude,
      longitude: location.longitude,
      location,
      geohash: encodeGeohash(location.latitude, location.longitude, 7),
      silent: data.silent === true,
      batteryPct: typeof data.batteryPct === "number" ? data.batteryPct : null,
      networkType: optionalString(data.networkType, 50),
      audioPath: optionalString(data.audioPath, 500),
      snapshotPath: optionalString(data.snapshotPath, 500),
      safeWalkId: optionalString(data.safeWalkId, 128),
      state: "active",
      eventId: id,
      lastEventId: id,
      createdAt: now,
      updatedAt: now,
      nextGpsAt: Timestamp.fromMillis(Date.now() + 5000),
    });
    transaction.create(ref.collection("events").doc(id), {
      eventId: id,
      type: "activated",
      actorId: uid,
      location,
      createdAt: now,
    });
    transaction.set(ref.collection("live").doc("current"), {
      ownerId: uid,
      participantIds,
      state: "active",
      eventId: id,
      location,
      updatedAt: now,
    });
    return false;
  });
  const deliveries = duplicate
    ? []
    : await notifyParticipants({
        ownerId: uid,
        participantIds,
        subjectId: emergencyId,
        eventId: id,
        type: "sos_activated",
        title: "SOS alert",
        body: "A person who trusts you needs help. Open SafeRoute now.",
        route: `/LiveWalkViewer?sessionId=${emergencyId}&collection=emergencies`,
        data: { emergencyId, eventType: "activated" },
      });
  const smsRequired =
    data.networkType === "none" ||
    guardianIds.length === 0 ||
    deliveries.some((item) => item.sms_required);
  return {
    emergencyId,
    eventId: id,
    duplicate,
    deliveries,
    sms_required: smsRequired,
    smsFallback: smsRequired,
  };
});

const EMERGENCY_EVENTS = new Set<EmergencyEventType>([
  "activated",
  "location",
  "guardian_acknowledged",
  "resolved",
  "cancelled",
]);

export const publishEmergencyEvent = onCall(async (request) => {
  const uid = requireAuth(request.auth?.uid);
  const data = (request.data ?? {}) as Record<string, unknown>;
  const emergencyId = requiredString(data.emergencyId, "emergencyId", 128);
  const id = eventId(data.eventId);
  const type = requiredString(data.type, "type", 64) as EmergencyEventType;
  if (!EMERGENCY_EVENTS.has(type) || type === "activated") {
    throw new HttpsError("invalid-argument", "Unsupported emergency event type.");
  }
  const location = validLocation(data.location);
  const ref = db.collection("emergencies").doc(emergencyId);
  let participantIds: string[] = [];
  let ownerId = "";
  let state = "active";
  const duplicate = await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists) throw new HttpsError("not-found", "Emergency not found.");
    participantIds = uniqueStrings(snap.get("participantIds"));
    ownerId = String(snap.get("ownerId") ?? snap.get("userId") ?? "");
    if (!participantIds.includes(uid)) {
      throw new HttpsError("permission-denied", "You are not an emergency participant.");
    }
    if (uid !== ownerId && type !== "guardian_acknowledged") {
      throw new HttpsError("permission-denied", "Only the owner can publish this event.");
    }
    const eventRef = ref.collection("events").doc(id);
    const existing = await transaction.get(eventRef);
    if (
      !existing.exists &&
      ["resolved", "cancelled", "expired"].includes(
        String(snap.get("state") ?? "active")
      )
    ) {
      throw new HttpsError(
        "failed-precondition",
        "This emergency session is already closed."
      );
    }
    if (existing.exists) return true;
    state = type === "resolved" ? "resolved" : type === "cancelled" ? "cancelled" : "active";
    const now = FieldValue.serverTimestamp();
    transaction.create(eventRef, {
      eventId: id,
      type,
      actorId: uid,
      location,
      data: data.data && typeof data.data === "object" ? data.data : {},
      createdAt: now,
    });
    transaction.update(ref, { state, lastEventId: id, updatedAt: now });
    transaction.set(
      ref.collection("live").doc("current"),
      {
        ownerId,
        participantIds,
        state,
        eventId: id,
        ...(location ? { location } : {}),
        updatedAt: now,
      },
      { merge: true }
    );
    return false;
  });
  const shouldNotify = !duplicate && type !== "location";
  const deliveries = shouldNotify
    ? await notifyParticipants({
        ownerId,
        participantIds,
        subjectId: emergencyId,
        eventId: id,
        type: `sos_${type}`,
        title: type === "resolved" ? "SOS resolved" : "SOS update",
        body: type === "resolved"
          ? "The emergency has been marked resolved."
          : "Open SafeRoute for the latest emergency update.",
        route: `/LiveWalkViewer?sessionId=${emergencyId}&collection=emergencies`,
        data: { emergencyId, eventType: type },
        includeOwner: uid !== ownerId,
      })
    : [];
  return {
    emergencyId,
    eventId: id,
    duplicate,
    state,
    deliveries,
    sms_required: deliveries.some((item) => item.sms_required),
  };
});

export const markNotificationRead = onCall(async (request) => {
  const uid = requireAuth(request.auth?.uid);
  const notificationId = requiredString(
    (request.data as Record<string, unknown> | undefined)?.notificationId,
    "notificationId",
    128
  );
  const ref = db.collection("notifications").doc(notificationId);
  const readAt = Timestamp.now();
  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists) throw new HttpsError("not-found", "Notification not found.");
    if (snap.get("userId") !== uid) {
      throw new HttpsError("permission-denied", "This notification is not yours.");
    }
    if (!snap.get("readAt")) transaction.update(ref, { readAt });
  });
  return { notificationId, readAtMs: readAt.toMillis() };
});

/** Compatibility helper retained for existing server imports. */
export async function sendGuardianNotification(
  userId: string,
  guardianUserId: string,
  subjectId: string,
  title: string
): Promise<NotificationDelivery> {
  return createAndDispatchNotification({
    userId: guardianUserId,
    fromUserId: userId,
    subjectId,
    title,
    body: "Open SafeRoute to respond.",
    type: "guardian_alert",
    route: "/(tabs)/alerts",
    data: { subjectId },
  });
}

/** Anonymous count. Document id is geohash + minute bucket. No user id is stored. */
export const updateCrowdDensity = onRequest(async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("POST only");
    return;
  }
  const { geohash, bucketStartMs } = req.body as {
    geohash?: string;
    bucketStartMs?: number;
  };
  if (!geohash || geohash.length < 7 || !bucketStartMs) {
    res.status(400).send("geohash and bucketStartMs are required");
    return;
  }
  const id = `${geohash}_${bucketStartMs}`;
  await db
    .collection("crowd_cells")
    .doc(id)
    .set(
      {
        geohash: geohash.slice(0, 7),
        bucketStartMs,
        count: FieldValue.increment(1),
        expiresAt: Timestamp.fromMillis(bucketStartMs + 15 * 60 * 1000),
      },
      { merge: true }
    );
  res.status(204).send("");
});

/** Hourly. Reports older than 180 days are marked expired. */
export const expireOldReports = onSchedule("every 60 minutes", async () => {
  const cutoff = Timestamp.fromMillis(Date.now() - 180 * 24 * 60 * 60 * 1000);
  const stale = await db
    .collection("reports")
    .where("createdAt", "<", cutoff)
    .limit(200)
    .get();
  const batch = db.batch();
  stale.docs.forEach((doc) => batch.update(doc.ref, { status: "expired" }));
  await batch.commit();
});

export const expireStaleSafetySessions = onSchedule(
  "every 60 minutes",
  async () => {
    const cutoff = Timestamp.fromMillis(Date.now() - 24 * 60 * 60 * 1000);
    const [routes, emergencies] = await Promise.all([
      db
        .collection("routes")
        .where("state", "==", "active")
        .where("updatedAt", "<", cutoff)
        .limit(200)
        .get(),
      db
        .collection("emergencies")
        .where("state", "==", "active")
        .where("updatedAt", "<", cutoff)
        .limit(200)
        .get(),
    ]);
    const batch = db.batch();
    routes.docs.forEach((item) =>
      batch.update(item.ref, {
        state: "expired",
        updatedAt: FieldValue.serverTimestamp(),
      }),
    );
    emergencies.docs.forEach((item) =>
      batch.update(item.ref, {
        state: "expired",
        updatedAt: FieldValue.serverTimestamp(),
      }),
    );
    await batch.commit();
  },
);
