export const GUARDIANS_STORAGE_KEY = "@SafeRoute:contacts";
export const MAX_GUARDIANS = 5;

export type GuardianRelationship =
  | "Parent"
  | "Sibling"
  | "Partner"
  | "Friend"
  | "Roommate"
  | "Other";

export type Guardian = {
  id: string;
  name: string;
  phone: string;
  relationship: GuardianRelationship;
  /** True only after the guardian accepts the in-app connection. */
  verified: boolean;
  isPrimary: boolean;
  connectionId?: string;
  guardianUserId?: string;
  connectionStatus?: "pending" | "accepted" | "revoked";
};

export const RELATIONSHIP_OPTIONS: GuardianRelationship[] = [
  "Parent",
  "Sibling",
  "Partner",
  "Friend",
  "Roommate",
  "Other",
];

export function createGuardianId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

/** Migrate legacy { id, name, phone } contacts into Guardian shape */
export function normalizeGuardians(raw: unknown): Guardian[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const name = typeof row.name === "string" ? row.name : "";
      const phone = typeof row.phone === "string" ? row.phone : "";
      if (!name || !phone) return null;
      const relationship = RELATIONSHIP_OPTIONS.includes(
        row.relationship as GuardianRelationship,
      )
        ? (row.relationship as GuardianRelationship)
        : "Other";
      const guardian: Guardian = {
        id:
          typeof row.id === "string"
            ? row.id
            : createGuardianId() + String(index),
        name,
        phone: String(phone).replace(/\D/g, ""),
        relationship,
        verified: Boolean(row.verified),
        isPrimary: Boolean(row.isPrimary),
        connectionId:
          typeof row.connectionId === "string" ? row.connectionId : undefined,
        guardianUserId:
          typeof row.guardianUserId === "string"
            ? row.guardianUserId
            : undefined,
        connectionStatus:
          row.connectionStatus === "accepted" ||
          row.connectionStatus === "pending" ||
          row.connectionStatus === "revoked"
            ? row.connectionStatus
            : undefined,
      };
      return guardian;
    })
    .filter((g): g is Guardian => g != null);
}

export function ensurePrimary(list: Guardian[]): Guardian[] {
  if (list.length === 0) return list;
  if (list.some((g) => g.isPrimary)) return list;
  return list.map((g, i) => ({ ...g, isPrimary: i === 0 }));
}

export function setPrimaryGuardian(
  list: Guardian[],
  id: string,
): Guardian[] {
  return list.map((g) => ({ ...g, isPrimary: g.id === id }));
}

export function sortGuardians(list: Guardian[]): Guardian[] {
  return [...list].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return a.name.localeCompare(b.name);
  });
}
