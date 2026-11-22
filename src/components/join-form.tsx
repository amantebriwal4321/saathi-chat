"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LANGUAGE_CODES, LANGUAGES, type LanguageCode, type Role } from "@/lib/languages";
import { createUserId, normalizeRoomCode, readProfile, setSeat, writeProfile } from "@/lib/profile";
import { Mark } from "./mark";

export function JoinForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [name, setName] = useState(params.get("name") || "");
  const [role, setRole] = useState<Role>(params.get("role") === "family" ? "family" : "elder");
  const [language, setLanguage] = useState<LanguageCode>(isLang(params.get("lang")) ? params.get("lang") as LanguageCode : "hi");
  const [room, setRoom] = useState(params.get("room") || "SAATHI");
  const [error, setError] = useState("");
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const seat = params.get("seat");
    if (seat) setSeat(seat);
    if (!params.get("name") && !params.get("go")) {
      const saved = readProfile();
      if (!saved) return;
      setName(saved.displayName);
      setRole(saved.role);
      setLanguage(saved.language);
      setRoom(saved.roomCode);
    }
    if (params.get("go") === "1") {
      const nextName = (params.get("name") || "").trim();
      const nextRole: Role = params.get("role") === "family" ? "family" : "elder";
      const nextLang = isLang(params.get("lang")) ? params.get("lang") as LanguageCode : "hi";
      const nextRoom = normalizeRoomCode(params.get("room") || "");
      if (nextName && nextRoom.length >= 4) {
        const previous = readProfile();
        writeProfile({
          userId: previous?.userId || createUserId(nextName),
          displayName: nextName.slice(0, 64),
          role: nextRole,
          language: nextLang,
          roomCode: nextRoom,
          seat: seat || "default",
        });
        setEntered(true);
        router.replace("/room");
      }
    }
  }, [params, router]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const displayName = name.trim().slice(0, 64);
    const roomCode = normalizeRoomCode(room);
    if (displayName.length < 1) {
      setError("Please add a name.");
      return;
    }
    if (roomCode.length < 4) {
      setError("Room code needs at least 4 letters or numbers.");
      return;
    }
    const seat = params.get("seat") || "default";
    setSeat(seat);
    const previous = readProfile();
    writeProfile({
      userId: previous?.userId || createUserId(displayName),
      displayName,
      role,
      language,
      roomCode,
      seat,
    });
    router.push("/room");
  }

  if (entered) return <p className="px-6 py-10 text-2xl">Opening the room...</p>;

  return (
    <main className="mx-auto min-h-dvh max-w-xl px-5 py-8">
      <Link href="/"><Mark /></Link>
      <h1 className="font-display mt-8 text-4xl font-semibold">Who is joining?</h1>
      <p className="mt-2 text-lg text-[#5c4638]">No account. This phone remembers you.</p>
      <form onSubmit={submit} className="mt-6 space-y-5">
        <label className="block text-lg font-extrabold">
          Name
          <input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 min-h-16 w-full rounded-2xl border border-[#eadcc8] bg-white px-4 text-2xl" />
        </label>
        <fieldset>
          <legend className="text-lg font-extrabold">I am</legend>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {(["elder", "family"] as Role[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRole(option)}
                className={`min-h-20 rounded-3xl text-2xl font-extrabold ${role === option ? "bg-[#241812] text-white" : "bg-white"}`}
              >
                {option === "elder" ? "Elder" : "Family"}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-lg font-extrabold">{role === "elder" ? "I speak" : "I read"}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {LANGUAGE_CODES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLanguage(code)}
                className={`min-h-14 rounded-2xl px-4 text-lg font-extrabold ${language === code ? "bg-[#e07a2f] text-white" : "bg-white"}`}
              >
                {LANGUAGES[code].native}
              </button>
            ))}
          </div>
        </fieldset>
        <label className="block text-lg font-extrabold">
          Family room code
          <input
            value={room}
            onChange={(event) => setRoom(event.target.value.toUpperCase())}
            className="mt-2 min-h-16 w-full rounded-2xl border border-[#eadcc8] bg-white px-4 text-2xl tracking-[0.2em]"
          />
        </label>
        {error ? <p className="text-lg text-[#8d241d]">{error}</p> : null}
        <button type="submit" className="min-h-16 w-full rounded-full bg-[#e07a2f] text-2xl font-extrabold text-white">
          Enter the room
        </button>
      </form>
    </main>
  );
}

function isLang(value: string | null): value is LanguageCode {
  return Boolean(value && LANGUAGE_CODES.includes(value as LanguageCode));
}
