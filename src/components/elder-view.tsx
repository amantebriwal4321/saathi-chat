"use client";

import { useRef, useState } from "react";
import { LANGUAGES, languageLabel, type LanguageCode } from "@/lib/languages";
import { formatWhen } from "@/lib/format";
import type { Profile } from "@/lib/profile";
import { speak, speechRecognitionSupported, startHoldToTalk, unlockSpeech } from "@/lib/speech";
import type { ChatItem } from "@/lib/saathi-message";
import type { Person } from "@/lib/nexconn/session";
import type { Phase } from "./use-saathi";

export function ElderView({
  profile,
  phase,
  error,
  messages,
  translations,
  members,
  autoRead,
  setAutoRead,
  callsOn,
  onSend,
  onCheckin,
  onCall,
}: {
  profile: Profile;
  phase: Phase;
  error: string;
  messages: ChatItem[];
  translations: Record<string, string | null>;
  members: Person[];
  autoRead: boolean;
  setAutoRead: (value: boolean) => void;
  callsOn: boolean;
  onSend: (text: string) => Promise<{ ok: boolean; error?: string }>;
  onCheckin: (status: "ok" | "help") => Promise<{ ok: boolean; error?: string }>;
  onCall: (peerId: string) => void;
}) {
  const copy = LANGUAGES[profile.language].ui;
  const [listening, setListening] = useState(false);
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState("");
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);
  const hold = useRef<ReturnType<typeof startHoldToTalk> | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const others = members.filter((person) => person.userId !== profile.userId);

  async function deliver(text: string) {
    setBusy(true);
    const result = await onSend(text);
    setBusy(false);
    if (!result.ok) setNotice(result.error || "Not sent.");
    else {
      setNotice("");
      setDraft("");
      setTyped("");
      setTyping(false);
    }
  }

  function beginHold() {
    if (busy || listening) return;
    unlockSpeech();
    setNotice("");
    setDraft("");
    if (!speechRecognitionSupported()) {
      setNotice("This browser cannot hear speech. Type the message instead, or open Chrome.");
      setTyping(true);
      return;
    }
    const session = startHoldToTalk({
      language: profile.language,
      onPartial: setDraft,
      onFinal: (text) => {
        setListening(false);
        if (!text) {
          setNotice(copy.missed);
          return;
        }
        void deliver(text);
      },
      onError: (message) => {
        setListening(false);
        setNotice(message);
      },
    });
    if (!session) return;
    hold.current = session;
    setListening(true);
  }

  function endHold() {
    hold.current?.stop();
    hold.current = null;
  }

  async function check(status: "ok" | "help") {
    unlockSpeech();
    setBusy(true);
    const result = await onCheckin(status);
    setBusy(false);
    setNotice(result.ok ? "" : result.error || "Not sent.");
  }

  function play(item: ChatItem) {
    unlockSpeech();
    const line = lineFor(item, translations[item.id], profile.language);
    if (line) speak(line, profile.language);
  }

  const visible = [...messages].reverse();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pt-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#c45e12]">Saathi</p>
          <h1 className="font-display text-4xl font-semibold leading-tight">{copy.hello}, {profile.displayName}</h1>
          <p className="mt-1 text-lg text-[#6d5c4e]">{copy.familyRoom} · {profile.roomCode}</p>
        </div>
        <StatusPill phase={phase} copy={copy} />
      </header>

      {error ? <p className="mt-4 rounded-3xl bg-[#fff4e6] px-4 py-3 text-lg leading-7 text-[#5c3b22]">{error}</p> : null}
      {notice ? <p className="mt-3 rounded-3xl bg-[#fde8e4] px-4 py-3 text-lg leading-7">{notice}</p> : null}

      <div ref={listRef} className="mt-4 flex flex-1 flex-col-reverse gap-3 overflow-y-auto pb-4" aria-live="polite">
        {visible.length === 0 ? (
          <p className="rounded-3xl bg-white/70 px-4 py-6 text-2xl leading-snug text-[#6d5c4e]">
            {copy.messages}
          </p>
        ) : visible.map((item) => (
          <article key={item.id} className={`rounded-[28px] px-4 py-4 ${cardTone(item)}`}>
            <p className="text-base font-bold text-[#6d5c4e]">
              {item.senderUserId === profile.userId ? copy.you : item.displayName}
              {item.channel === "direct" ? " · 1:1" : ""}
              {item.sentTime ? ` · ${formatWhen(item.sentTime)}` : ""}
            </p>
            {item.kind === "checkin" ? (
              <p className="mt-1 text-sm font-extrabold uppercase tracking-wide">{item.status === "help" ? copy.help : copy.okay}</p>
            ) : null}
            {item.text ? <p className="mt-2 text-3xl font-bold leading-snug">{item.text}</p> : null}
            {item.voiceUrl ? <audio className="mt-3 w-full" controls src={item.voiceUrl} /> : null}
            {item.text && item.language !== profile.language ? (
              <p className="mt-3 text-2xl leading-snug text-[#1d4e5f]">
                <span className="mb-1 block text-sm font-bold uppercase tracking-wide">{languageLabel(profile.language)}</span>
                {translations[item.id] === undefined ? "..." : translations[item.id] || item.text}
              </p>
            ) : null}
            <button type="button" onClick={() => play(item)} className="mt-3 min-h-16 w-full rounded-2xl bg-[#1d4e5f] text-2xl font-extrabold text-white">
              {copy.play}
            </button>
          </article>
        ))}
      </div>

      <div className="safe-bottom sticky bottom-0 space-y-3 bg-gradient-to-t from-[#f3eadc] via-[#f3eadc] to-transparent pt-3">
        <label className="flex min-h-14 items-center gap-3 rounded-2xl bg-white/80 px-4 text-lg font-bold">
          <input type="checkbox" checked={autoRead} onChange={(event) => setAutoRead(event.target.checked)} className="h-6 w-6" />
          {copy.readAloud}
        </label>
        <button
          type="button"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            beginHold();
          }}
          onPointerUp={endHold}
          onPointerCancel={endHold}
          onContextMenu={(event) => event.preventDefault()}
          className={`flex min-h-28 w-full items-center justify-center rounded-[32px] px-4 text-center text-3xl font-extrabold text-white shadow-lg ${listening ? "bg-[#1d4e5f]" : "bg-[#e07a2f]"}`}
        >
          {listening ? (draft || copy.listening) : copy.hold}
        </button>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => void check("ok")} className="min-h-20 rounded-[24px] bg-[#1c7a4a] px-3 text-2xl font-extrabold text-white">
            {copy.okay}
          </button>
          <button type="button" onClick={() => void check("help")} className="pulse-help min-h-20 rounded-[24px] bg-[#c2352b] px-3 text-2xl font-extrabold text-white">
            {copy.help}
          </button>
        </div>
        {callsOn ? (
          <button type="button" onClick={() => others.length > 1 ? setPicking(true) : others[0] ? onCall(others[0].userId) : setNotice("Ask a family member to join the room first.")} className="min-h-16 w-full rounded-[24px] bg-[#1d4e5f] text-2xl font-extrabold text-white">
            {copy.video}
          </button>
        ) : null}
        <button type="button" onClick={() => setTyping((value) => !value)} className="min-h-12 w-full text-lg font-bold text-[#1d4e5f] underline">
          {copy.type}
        </button>
        {typing ? (
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (typed.trim()) void deliver(typed);
            }}
          >
            <input
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              placeholder={copy.placeholder}
              className="min-h-16 flex-1 rounded-2xl border border-[#eadcc8] bg-white px-4 text-2xl"
            />
            <button type="submit" className="min-h-16 rounded-2xl bg-[#241812] px-4 text-xl font-extrabold text-white">{copy.send}</button>
          </form>
        ) : null}
        {picking ? (
          <div className="space-y-2 rounded-3xl bg-white p-3">
            {others.map((person) => (
              <button key={person.userId} type="button" onClick={() => { setPicking(false); onCall(person.userId); }} className="min-h-16 w-full rounded-2xl bg-[#1d4e5f] text-2xl font-bold text-white">
                {person.name}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatusPill({ phase, copy }: { phase: Phase; copy: { connecting: string; online: string; offline: string } }) {
  const label = phase === "online" ? copy.online : phase === "booting" ? copy.connecting : copy.offline;
  const tone = phase === "online" ? "bg-[#e5f6ec] text-[#14653c]" : phase === "booting" ? "bg-white text-[#6d5c4e]" : "bg-[#fde8e4] text-[#8d241d]";
  return <span className={`rounded-full px-3 py-2 text-sm font-extrabold ${tone}`}>{label}</span>;
}

function cardTone(item: ChatItem) {
  if (item.kind === "checkin" && item.status === "help") return "bg-[#fde8e4]";
  if (item.kind === "checkin") return "bg-[#e5f6ec]";
  return "bg-white";
}

function lineFor(item: ChatItem, translation: string | null | undefined, reader: LanguageCode) {
  if (item.language === reader || !translation) return item.text;
  return translation;
}
