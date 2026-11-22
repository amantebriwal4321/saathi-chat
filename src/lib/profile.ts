import { isLanguage, type LanguageCode, type Role } from "./languages";

export type Profile = {
  userId: string;
  displayName: string;
  role: Role;
  language: LanguageCode;
  roomCode: string;
  seat: string;
};

const SEAT_KEY = "saathi.seat";

export function currentSeat(): string {
  if (typeof window === "undefined") return "default";
  return sessionStorage.getItem(SEAT_KEY) || "default";
}

export function setSeat(seat: string) {
  const clean = seat.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16) || "default";
  sessionStorage.setItem(SEAT_KEY, clean);
  return clean;
}

function storageKey(seat: string) {
  return `saathi.profile.${seat}`;
}

export function createUserId(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16) || "friend";
  const suffix = Math.random().toString(36).replace(/[^a-z0-9]/g, "").slice(0, 6);
  return `s${base}${suffix}`.slice(0, 64);
}

export function normalizeRoomCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 32);
}

export function readProfile(): Profile | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(storageKey(currentSeat()));
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<Profile>;
    if (!data.userId || !data.displayName || !data.roomCode) return null;
    if (data.role !== "elder" && data.role !== "family") return null;
    if (!isLanguage(data.language)) return null;
    if (!/^[A-Za-z0-9]{1,64}$/.test(data.userId)) return null;
    return {
      userId: data.userId,
      displayName: data.displayName.slice(0, 64),
      role: data.role,
      language: data.language,
      roomCode: normalizeRoomCode(data.roomCode),
      seat: data.seat || currentSeat(),
    };
  } catch {
    return null;
  }
}

export function writeProfile(profile: Profile) {
  const seat = setSeat(profile.seat || currentSeat());
  const next = { ...profile, seat };
  localStorage.setItem(storageKey(seat), JSON.stringify(next));
  return next;
}

export function clearProfile() {
  localStorage.removeItem(storageKey(currentSeat()));
}
