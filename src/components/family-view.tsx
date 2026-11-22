"use client";

import { useState, type FormEvent } from "react";
import { LANGUAGE_CODES, LANGUAGES, languageLabel, type LanguageCode } from "@/lib/languages";
import { formatWhen } from "@/lib/format";
import type { Profile } from "@/lib/profile";
import { speak } from "@/lib/speech";
import type { ChatItem } from "@/lib/saathi-message";
import type { Person } from "@/lib/nexconn/session";
import type { Phase } from "./use-saathi";

export function FamilyView({
  profile,
  phase,
  error,
  messages,
  translations,
  members,
  checkins,
  directPeer,
  callsOn,
  onLanguage,
  onSend,
  onVoice,
  onOpenDirect,
  onShowRoom,
  onCall,
}: {
  profile: Profile;
  phase: Phase;
  error: string;
  messages: ChatItem[];
  translations: Record<string, string | null>;
  members: Person[];
  checkins: ChatItem[];
  directPeer: string | null;
  callsOn: boolean;
  onLanguage: (language: LanguageCode) => void;
  onSend: (text: string) => Promise<{ ok: boolean; error?: string }>;
  onVoice: (file: File) => Promise<{ ok: boolean; error?: string }>;
  onOpenDirect: (peerId: string) => void;
  onShowRoom: () => void;
  onCall: (peerId: string) => void;
}) {
  const [text, setText] = useState("");
  const [notice, setNotice] = useState("");
  const [recording, setRecording] = useState(false);
  const help = checkins.filter((item) => item.status === "help");
  const peer = members.find((person) => person.userId === directPeer);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const result = await onSend(text);
    if (!result.ok) setNotice(result.error || "Not sent.");
    else {
      setText("");
      setNotice("");
    }
  }

  async function toggleRecord() {
    if (recording) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setNotice("This browser cannot record a voice note.");
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
    if (!stream) {
      setNotice("Microphone permission is blocked.");
      return;
    }
    const recorder = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
      const file = new File([blob], "note.webm", { type: blob.type || "audio/webm" });
      void onVoice(file).then((result) => {
        if (!result.ok) setNotice(result.error || "Voice note was not sent.");
      });
      setRecording(false);
    };
    recorder.start();
    setRecording(true);
    window.setTimeout(() => {
      if (recorder.state === "recording") recorder.stop();
    }, 8000);
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-3xl font-semibold">Saathi family</p>
          <p className="text-sm text-[#6d5c4e]">Room {profile.roomCode} · {profile.displayName}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${phase === "online" ? "bg-[#e5f6ec] text-[#14653c]" : "bg-[#fff4e6] text-[#8a5a24]"}`}>
            {phase === "online" ? "Connected" : phase === "booting" ? "Connecting" : "Not connected"}
          </span>
          <label className="text-sm font-bold">
            <span className="sr-only">Read messages in</span>
            <select
              value={profile.language}
              onChange={(event) => onLanguage(event.target.value as LanguageCode)}
              className="min-h-11 rounded-xl border border-[#eadcc8] bg-white px-3"
            >
              {LANGUAGE_CODES.map((code) => (
                <option key={code} value={code}>{LANGUAGES[code].native}</option>
              ))}
            </select>
          </label>
        </div>
      </header>

      {error ? <p className="mt-4 rounded-2xl bg-[#fff4e6] px-4 py-3 text-sm leading-6">{error}</p> : null}
      {help.length ? (
        <div className="pulse-help mt-4 rounded-3xl bg-[#c2352b] px-4 py-3 text-white">
          <p className="text-lg font-extrabold">Needs help</p>
          {help.map((item) => (
            <p key={item.id} className="text-sm">{item.displayName} · {item.sentTime ? formatWhen(item.sentTime) : "just now"}</p>
          ))}
        </div>
      ) : null}

      <section className="mt-4">
        <h2 className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#6d5c4e]">Daily check-in</h2>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {checkins.length === 0 ? <p className="text-sm text-[#6d5c4e]">No elder check-in yet.</p> : checkins.map((item) => (
            <article key={item.senderUserId} className={`min-w-44 rounded-2xl px-3 py-3 ${item.status === "help" ? "bg-[#fde8e4]" : item.sentTime ? "bg-[#e5f6ec]" : "bg-white"}`}>
              <p className="font-extrabold">{item.displayName}</p>
              <p className="text-sm">{item.status === "help" ? "Needs help" : item.status === "ok" ? "Okay today" : "No check-in yet"}</p>
              <p className="text-xs text-[#6d5c4e]">{item.sentTime ? formatWhen(item.sentTime) : "Waiting"}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-4 flex gap-2 overflow-x-auto">
        <button type="button" onClick={onShowRoom} className={`min-h-11 rounded-full px-4 text-sm font-extrabold ${directPeer ? "bg-white" : "bg-[#241812] text-white"}`}>
          Family room
        </button>
        {members.filter((person) => person.userId !== profile.userId).map((person) => (
          <button key={person.userId} type="button" onClick={() => onOpenDirect(person.userId)} className={`min-h-11 rounded-full px-4 text-sm font-extrabold ${directPeer === person.userId ? "bg-[#1d4e5f] text-white" : "bg-white"}`}>
            {person.name}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-sm font-bold text-[#6d5c4e]">{directPeer ? `Private with ${peer?.name || directPeer}` : "Messages in this room"}</p>
        {callsOn && directPeer ? (
          <button type="button" onClick={() => onCall(directPeer)} className="min-h-11 rounded-full bg-[#1d4e5f] px-4 text-sm font-extrabold text-white">
            Video call
          </button>
        ) : null}
      </div>

      <div className="mt-3 flex flex-1 flex-col gap-3 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="rounded-3xl bg-white/80 px-4 py-8 text-center text-[#6d5c4e]">The room is quiet. Say hello.</p>
        ) : messages.map((item) => {
          const mine = item.senderUserId === profile.userId;
          const translation = translations[item.id];
          return (
            <article key={item.id} className={`max-w-[92%] rounded-3xl px-4 py-3 ${mine ? "ml-auto bg-[#1d4e5f] text-white" : "bg-white"} ${item.status === "help" ? "ring-2 ring-[#c2352b]" : ""}`}>
              <p className={`text-xs font-bold ${mine ? "text-white/80" : "text-[#6d5c4e]"}`}>
                {mine ? "You" : item.displayName} · {languageLabel(item.language)}{item.sentTime ? ` · ${formatWhen(item.sentTime)}` : ""}
              </p>
              {item.kind === "checkin" ? (
                <p className="mt-1 text-xs font-extrabold uppercase">{item.status === "help" ? "Needs help" : "Okay today"}</p>
              ) : null}
              {item.text ? <p className="mt-1 text-base leading-6">{item.text}</p> : null}
              {item.voiceUrl ? <audio className="mt-2 w-full" controls src={item.voiceUrl} /> : null}
              {item.text && item.language !== profile.language ? (
                <p className={`mt-2 border-t pt-2 text-sm leading-6 ${mine ? "border-white/20" : "border-[#eadcc8] text-[#1d4e5f]"}`}>
                  {translation === undefined ? "Translating..." : translation || "Translation unavailable. Showing the original."}
                </p>
              ) : null}
              {item.text ? (
                <button type="button" onClick={() => speak(translation || item.text, profile.language)} className={`mt-2 text-xs font-bold underline ${mine ? "text-white" : "text-[#1d4e5f]"}`}>
                  Play
                </button>
              ) : null}
            </article>
          );
        })}
      </div>

      {notice ? <p className="mt-3 text-sm text-[#8d241d]">{notice}</p> : null}
      <form onSubmit={(event) => void submit(event)} className="safe-bottom mt-3 flex gap-2">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={directPeer ? "Private note" : "Message the family"}
          className="min-h-12 flex-1 rounded-2xl border border-[#eadcc8] bg-white px-4"
        />
        <button type="button" onClick={() => void toggleRecord()} className={`min-h-12 rounded-2xl px-3 text-sm font-extrabold ${recording ? "bg-[#c2352b] text-white" : "bg-white"}`}>
          {recording ? "Rec" : "Mic"}
        </button>
        <button type="submit" className="min-h-12 rounded-2xl bg-[#e07a2f] px-4 font-extrabold text-white">Send</button>
      </form>
    </div>
  );
}
