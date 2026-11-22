import type { LanguageCode, Role } from "./languages";
import { isLanguage } from "./languages";

export type SaathiKind = "chat" | "checkin" | "voice";
export type CheckinStatus = "ok" | "help";

export type SaathiExtra = {
  language: LanguageCode;
  displayName: string;
  role: Role;
  kind: SaathiKind;
  status?: CheckinStatus;
};

export type ChatItem = {
  id: string;
  text: string;
  language: LanguageCode;
  displayName: string;
  role: Role;
  kind: SaathiKind;
  status?: CheckinStatus;
  senderUserId: string;
  sentTime: number;
  channel: "group" | "direct";
  peerId?: string;
  voiceUrl?: string;
  duration?: number;
};

export function encodeExtra(extra: SaathiExtra): string {
  return JSON.stringify(extra);
}

function asRecord(value: unknown): Record<string, string> {
  if (!value) return {};
  if (value instanceof Map) {
    const record: Record<string, string> = {};
    value.forEach((item, key) => {
      record[String(key)] = String(item);
    });
    return record;
  }
  if (typeof value === "object") {
    const record: Record<string, string> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (typeof item === "string") record[key] = item;
    }
    return record;
  }
  return {};
}

export function readExtra(content: { extra?: string } | undefined, metadata: unknown): Partial<SaathiExtra> {
  let parsed: Partial<SaathiExtra> = {};
  if (content?.extra) {
    try {
      const data = JSON.parse(content.extra) as Partial<SaathiExtra>;
      if (data && typeof data === "object") parsed = data;
    } catch {
      parsed = {};
    }
  }
  const meta = asRecord(metadata);
  const language = isLanguage(parsed.language)
    ? parsed.language
    : isLanguage(meta.lang)
      ? meta.lang
      : undefined;
  const role = parsed.role === "elder" || parsed.role === "family"
    ? parsed.role
    : meta.role === "elder" || meta.role === "family"
      ? meta.role
      : undefined;
  const kind = parsed.kind === "chat" || parsed.kind === "checkin" || parsed.kind === "voice"
    ? parsed.kind
    : meta.kind === "chat" || meta.kind === "checkin" || meta.kind === "voice"
      ? meta.kind
      : undefined;
  const status = parsed.status === "ok" || parsed.status === "help"
    ? parsed.status
    : meta.status === "ok" || meta.status === "help"
      ? meta.status
      : undefined;
  return {
    language,
    displayName: parsed.displayName || meta.name,
    role,
    kind,
    status,
  };
}
