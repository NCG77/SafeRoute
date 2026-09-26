import { httpsCallable } from "firebase/functions";
import { functions } from "../config/firebase";
import type {
  AcceptGuardianInviteRequest,
  AcceptGuardianInviteResponse,
  EmergencyEventRequest,
  EmergencyEventResponse,
  GuardianInviteRequest,
  GuardianInviteResponse,
  LiveShareStartRequest,
  MarkNotificationReadRequest,
  MarkNotificationReadResponse,
  ReportRequest,
  ReportResponse,
  RevokeGuardianRequest,
  RevokeGuardianResponse,
  RouteRequest,
  RouteResponse,
  SafeWalkCheckinRequest,
  SafeWalkCheckinResponse,
  SafeWalkStartRequest,
  SafeWalkStartResponse,
  SafetyEventRequest,
  SafetyEventResponse,
  SafetySessionStartResponse,
  SafetyScoreQuery,
  SafetyScoreResponse,
  SosRequest,
  SosResponse,
} from "./api";

export function postRoute(body: RouteRequest) {
  return httpsCallable<RouteRequest, RouteResponse>(functions, "generateRoutes")(body);
}

export function postReport(body: ReportRequest) {
  return httpsCallable<ReportRequest, ReportResponse>(functions, "verifyReport")(body);
}

export function postSos(body: SosRequest) {
  return httpsCallable<SosRequest, SosResponse>(functions, "activateSOS")(body);
}

export function getSafetyScore(query: SafetyScoreQuery) {
  return httpsCallable<SafetyScoreQuery, SafetyScoreResponse>(
    functions,
    "calculateSafetyScore"
  )(query);
}

export function postSafeWalkStart(body: SafeWalkStartRequest) {
  return httpsCallable<SafeWalkStartRequest, SafeWalkStartResponse>(
    functions,
    "startSafeWalk"
  )(body);
}

export function postSafeWalkCheckin(body: SafeWalkCheckinRequest) {
  return httpsCallable<SafeWalkCheckinRequest, SafeWalkCheckinResponse>(
    functions,
    "safeWalkCheckin"
  )(body);
}

export function createGuardianInvite(body: GuardianInviteRequest) {
  return httpsCallable<GuardianInviteRequest, GuardianInviteResponse>(
    functions,
    "createGuardianInvite"
  )(body);
}

export function acceptGuardianInvite(body: AcceptGuardianInviteRequest) {
  return httpsCallable<
    AcceptGuardianInviteRequest,
    AcceptGuardianInviteResponse
  >(functions, "acceptGuardianInvite")(body);
}

export function revokeGuardian(body: RevokeGuardianRequest) {
  return httpsCallable<RevokeGuardianRequest, RevokeGuardianResponse>(
    functions,
    "revokeGuardian"
  )(body);
}

export function postLiveShareStart(body: LiveShareStartRequest) {
  return httpsCallable<LiveShareStartRequest, SafetySessionStartResponse>(
    functions,
    "startLiveShare"
  )(body);
}

export function publishSafetyEvent(body: SafetyEventRequest) {
  return httpsCallable<SafetyEventRequest, SafetyEventResponse>(
    functions,
    "publishSafetyEvent"
  )(body);
}

export function publishEmergencyEvent(body: EmergencyEventRequest) {
  return httpsCallable<EmergencyEventRequest, EmergencyEventResponse>(
    functions,
    "publishEmergencyEvent"
  )(body);
}

export function markNotificationRead(body: MarkNotificationReadRequest) {
  return httpsCallable<
    MarkNotificationReadRequest,
    MarkNotificationReadResponse
  >(functions, "markNotificationRead")(body);
}
