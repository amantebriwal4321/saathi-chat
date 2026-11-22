"use client";

import { useEffect, useRef, useState } from "react";
import type { CallUi } from "./use-saathi";

export function CallOverlay({
  call,
  large,
  onClose,
}: {
  call: CallUi;
  large: boolean;
  onClose: () => void;
}) {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const started = useRef(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (call.phase !== "outgoing" || started.current) return;
    const local = localRef.current;
    const remote = remoteRef.current;
    if (!local || !remote) return;
    started.current = true;
    void (async () => {
      setBusy(true);
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        const calls = await import("@/lib/nexconn/calls");
        const result = await calls.placeVideoCall(call.peerId, local, remote);
        if (!result.ok) setError(result.message);
      } catch {
        setError("Camera or microphone permission is blocked.");
      } finally {
        setBusy(false);
      }
    })();
  }, [call.phase, call.peerId]);

  useEffect(() => {
    if (call.phase !== "connected" || !call.peerId || !remoteRef.current) return;
    const remote = remoteRef.current;
    void import("@/lib/nexconn/calls").then((calls) => calls.bindRemote(call.peerId, remote));
  }, [call.phase, call.peerId]);

  async function answer() {
    const local = localRef.current;
    const remote = remoteRef.current;
    if (!local || !remote) return;
    setBusy(true);
    setError("");
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      const calls = await import("@/lib/nexconn/calls");
      const result = await calls.answerVideoCall(call.callId, call.peerId, local, remote);
      if (!result.ok) setError(result.message);
    } catch {
      setError("Camera or microphone permission is blocked.");
    } finally {
      setBusy(false);
    }
  }

  async function end() {
    const calls = await import("@/lib/nexconn/calls");
    await calls.hangUp(call.callId || undefined);
    onClose();
  }

  const title = call.phase === "incoming"
    ? `${call.peerName} is calling`
    : call.phase === "connected"
      ? `On a call with ${call.peerName}`
      : `Calling ${call.peerName}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#241812]/70 p-3 sm:items-center">
      <section className={`w-full max-w-lg rounded-[28px] bg-[#fffaf3] p-4 shadow-2xl ${large ? "text-2xl" : "text-base"}`}>
        <p className="font-display text-3xl font-semibold">{title}</p>
        <p className="mt-1 text-sm text-[#6d5c4e]">{busy ? "Opening camera..." : "Video stays on this device until you hang up."}</p>
        {error ? <p className="mt-3 rounded-2xl bg-[#fde8e4] px-3 py-2 text-sm text-[#8d241d]">{error}</p> : null}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <video ref={remoteRef} autoPlay playsInline className="aspect-[3/4] w-full rounded-3xl bg-[#1d4e5f] object-cover" />
          <video ref={localRef} autoPlay playsInline muted className="aspect-[3/4] w-full rounded-3xl bg-[#241812] object-cover" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {call.phase === "incoming" ? (
            <button type="button" onClick={() => void answer()} className="min-h-16 rounded-2xl bg-[#1c7a4a] font-extrabold text-white">
              Answer
            </button>
          ) : <span />}
          <button type="button" onClick={() => void end()} className="min-h-16 rounded-2xl bg-[#c2352b] font-extrabold text-white">
            {call.phase === "incoming" ? "Not now" : "Hang up"}
          </button>
        </div>
      </section>
    </div>
  );
}
