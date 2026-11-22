"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LANGUAGES, type LanguageCode } from "@/lib/languages";
import { writeProfile, type Profile } from "@/lib/profile";
import { speak } from "@/lib/speech";
import type { ChatItem, CheckinStatus, SaathiExtra } from "@/lib/saathi-message";
import { setCallEvents } from "@/lib/nexconn/calls";
import {
  acceptMessage,
  callEngineReady,
  checkinExtra,
  connectUser,
  ensureFamilyRoom,
  initEngine,
  loadDirectHistory,
  loadHistory,
  loadMembers,
  publishProfile,
  sendDirectText,
  sendGroupText,
  sendGroupVoice,
  watchConnection,
  watchMessages,
  type Person,
} from "@/lib/nexconn/session";

export type Phase = "booting" | "online" | "offline";

export type CallUi = {
  phase: "incoming" | "outgoing" | "connected";
  callId: string;
  peerId: string;
  peerName: string;
  error?: string;
};

function mergeItems(current: ChatItem[], incoming: ChatItem[]) {
  const map = new Map(current.map((item) => [item.id, item]));
  for (const item of incoming) map.set(item.id, item);
  return [...map.values()].sort((a, b) => a.sentTime - b.sentTime);
}

async function requestTranslation(text: string, source: LanguageCode, target: LanguageCode) {
  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, source, target }),
    });
    const json = await response.json();
    return typeof json.translation === "string" ? json.translation : null;
  } catch {
    return null;
  }
}

export function useSaathiRoom(profile: Profile, onProfile: (next: Profile) => void) {
  const [phase, setPhase] = useState<Phase>("booting");
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [members, setMembers] = useState<Person[]>([]);
  const [translations, setTranslations] = useState<Record<string, string | null>>({});
  const [autoRead, setAutoRead] = useState(true);
  const [callsOn, setCallsOn] = useState(false);
  const [callUi, setCallUi] = useState<CallUi | null>(null);
  const [directPeer, setDirectPeer] = useState<string | null>(null);
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const membersRef = useRef(members);
  membersRef.current = members;
  const spoken = useRef(new Set<string>());
  const seeded = useRef(false);
  const seenDirect = useRef(new Set<string>());
  const translating = useRef(new Set<string>());

  const nameFor = useCallback((userId: string) => {
    return membersRef.current.find((person) => person.userId === userId)?.name || userId;
  }, []);

  useEffect(() => {
    setCallEvents({
      onIncoming(callId, callerId) {
        setCallUi({
          phase: "incoming",
          callId,
          peerId: callerId,
          peerName: membersRef.current.find((person) => person.userId === callerId)?.name || callerId,
        });
      },
      onEnded() {
        setCallUi(null);
      },
      onConnected(callId) {
        setCallUi((current) => current ? { ...current, phase: "connected", callId: callId || current.callId } : current);
      },
      onRemoteReady(userId) {
        setCallUi((current) => {
          if (!current) return current;
          const peerName = membersRef.current.find((person) => person.userId === userId)?.name || current.peerName;
          return { ...current, peerId: current.peerId || userId, peerName };
        });
      },
    });
    return () => setCallEvents(null);
  }, []);

  useEffect(() => {
    let alive = true;
    seeded.current = false;
    spoken.current.clear();

    const boot = async () => {
      try {
        const status = await fetch("/api/status").then((response) => response.json()).catch(() => null);
        const withCalls = Boolean(status?.callsEnabled);
        if (!alive) return;
        setCallsOn(withCalls);
        await initEngine(withCalls);
        watchConnection(() => undefined);
        watchMessages((batch) => {
          const current = profileRef.current;
          const items = batch
            .map((message) => acceptMessage(message, current.roomCode, current.userId))
            .filter((item): item is ChatItem => Boolean(item));
          if (items.length) setMessages((existing) => mergeItems(existing, items));
        });

        const tokenResponse = await fetch("/api/nexconn/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: profile.userId, name: profile.displayName }),
        });
        const tokenJson = await tokenResponse.json().catch(() => ({}));
        if (!alive) return;
        if (!tokenResponse.ok || !tokenJson.token) {
          setPhase("offline");
          setError(tokenJson.error || "Saathi could not get a Nexconn token.");
          return;
        }

        const connected = await connectUser(profile.userId, tokenJson.token);
        if (!alive) return;
        if (!connected.ok) {
          setPhase("offline");
          setError(connected.message);
          return;
        }

        const room = await ensureFamilyRoom(profile.roomCode);
        if (!alive) return;
        if (!room.ok) {
          setPhase("offline");
          setError(room.message);
          return;
        }

        await publishProfile(profile);
        const [history, people] = await Promise.all([
          loadHistory(profile.roomCode, profile.userId),
          loadMembers(profile.roomCode),
        ]);
        if (!alive) return;
        setMessages((existing) => mergeItems(history, existing));
        setMembers(people);
        setPhase("online");
        setError("");
        setCallsOn(withCalls && callEngineReady());
      } catch (cause) {
        if (!alive) return;
        setPhase("offline");
        setError(cause instanceof Error ? cause.message : "Saathi could not open the room.");
      }
    };

    void boot();
    return () => {
      alive = false;
    };
  }, [profile.userId, profile.roomCode, profile.displayName, profile.role]);

  useEffect(() => {
    if (phase !== "online") return;
    const timer = window.setInterval(() => {
      void loadMembers(profile.roomCode).then(setMembers).catch(() => undefined);
    }, 15000);
    return () => window.clearInterval(timer);
  }, [phase, profile.roomCode]);

  useEffect(() => {
    setTranslations({});
    translating.current.clear();
  }, [profile.language]);

  useEffect(() => {
    if (phase !== "online") return;
    if (!seeded.current) {
      messages.forEach((item) => spoken.current.add(item.id));
      seeded.current = true;
      return;
    }
    if (profile.role !== "elder" || !autoRead) {
      messages.forEach((item) => spoken.current.add(item.id));
      return;
    }
    const fresh = messages.filter((item) => !spoken.current.has(item.id) && item.senderUserId !== profile.userId);
    fresh.forEach((item) => spoken.current.add(item.id));
    void (async () => {
      for (const item of fresh) {
        const line = item.language === profile.language
          ? item.text
          : (await requestTranslation(item.text, item.language, profile.language)) || item.text;
        if (line) speak(line, profile.language);
      }
    })();
  }, [messages, phase, autoRead, profile.role, profile.userId, profile.language]);

  useEffect(() => {
    const pending = messages.filter((item) => {
      return item.text
        && item.language !== profile.language
        && translations[item.id] === undefined
        && !translating.current.has(item.id);
    });
    pending.forEach((item) => translating.current.add(item.id));
    if (!pending.length) return;
    const target = profile.language;
    void (async () => {
      for (const item of pending) {
        const translation = await requestTranslation(item.text, item.language, target);
        if (profileRef.current.language !== target) return;
        setTranslations((current) => ({ ...current, [item.id]: translation }));
      }
    })();
  }, [messages, profile.language, translations]);

  const extraFor = useCallback((kind: SaathiExtra["kind"], status?: CheckinStatus): SaathiExtra => {
    const current = profileRef.current;
    return {
      language: current.language,
      displayName: current.displayName,
      role: current.role,
      kind,
      status,
    };
  }, []);

  const sendText = useCallback(async (text: string, target?: { peerId: string }) => {
    const trimmed = text.trim();
    if (!trimmed) return { ok: false as const, error: "There is nothing to send." };
    if (phase !== "online") return { ok: false as const, error: error || "Saathi is not connected to Nexconn yet." };
    const extra = extraFor("chat");
    const result = target
      ? await sendDirectText(target.peerId, trimmed, extra)
      : await sendGroupText(profileRef.current.roomCode, trimmed, extra);
    if (!result.ok) return { ok: false as const, error: result.message };
    setMessages((current) => mergeItems(current, [result.item]));
    return { ok: true as const };
  }, [error, extraFor, phase]);

  const sendCheckin = useCallback(async (status: CheckinStatus) => {
    if (phase !== "online") return { ok: false as const, error: error || "Saathi is not connected to Nexconn yet." };
    const current = profileRef.current;
    const text = status === "ok" ? LANGUAGES[current.language].ui.okay : LANGUAGES[current.language].ui.help;
    const result = await sendGroupText(current.roomCode, text, checkinExtra(current, status));
    if (!result.ok) return { ok: false as const, error: result.message };
    setMessages((currentItems) => mergeItems(currentItems, [result.item]));
    return { ok: true as const };
  }, [error, phase]);

  const sendVoice = useCallback(async (file: File) => {
    if (phase !== "online") return { ok: false as const, error: error || "Saathi is not connected to Nexconn yet." };
    const result = await sendGroupVoice(profileRef.current.roomCode, file, extraFor("voice"));
    if (!result.ok) return { ok: false as const, error: result.message };
    setMessages((current) => mergeItems(current, [result.item]));
    return { ok: true as const };
  }, [error, extraFor, phase]);

  const openDirect = useCallback(async (peerId: string) => {
    setDirectPeer(peerId);
    if (seenDirect.current.has(peerId) || phase !== "online") return;
    seenDirect.current.add(peerId);
    const history = await loadDirectHistory(peerId, profileRef.current.userId);
    setMessages((current) => mergeItems(current, history));
  }, [phase]);

  const setLanguage = useCallback((language: LanguageCode) => {
    const next = writeProfile({ ...profileRef.current, language });
    onProfile(next);
    if (phase === "online") void publishProfile(next);
  }, [onProfile, phase]);

  const requestCall = useCallback((peerId: string) => {
    setCallUi({
      phase: "outgoing",
      callId: "",
      peerId,
      peerName: nameFor(peerId),
    });
  }, [nameFor]);

  const checkins = useMemo(() => latestCheckins(messages, members), [messages, members]);

  return {
    phase,
    error,
    messages,
    members,
    translations,
    autoRead,
    setAutoRead,
    callsOn,
    callUi,
    setCallUi,
    directPeer,
    setDirectPeer,
    openDirect,
    sendText,
    sendCheckin,
    sendVoice,
    setLanguage,
    checkins,
    requestCall,
  };
}

function latestCheckins(messages: ChatItem[], members: Person[]) {
  const map = new Map<string, ChatItem>();
  for (const item of messages) {
    if (item.kind !== "checkin" || item.channel !== "group") continue;
    const previous = map.get(item.senderUserId);
    if (!previous || item.sentTime >= previous.sentTime) map.set(item.senderUserId, item);
  }
  for (const person of members) {
    if (person.role === "elder" && !map.has(person.userId)) {
      map.set(person.userId, {
        id: `empty-${person.userId}`,
        text: "",
        language: person.language || "en",
        displayName: person.name,
        role: "elder",
        kind: "checkin",
        senderUserId: person.userId,
        sentTime: 0,
        channel: "group",
      });
    }
  }
  return [...map.values()].sort((a, b) => {
    if (a.status === "help" && b.status !== "help") return -1;
    if (b.status === "help" && a.status !== "help") return 1;
    return b.sentTime - a.sentTime;
  });
}
