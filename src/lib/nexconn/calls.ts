"use client";

import {
  NCCallEngine,
  NCCallMediaType,
  NCCallType,
  NCCallUserState,
} from "@nexconn/call";

let engine: NCCallEngine | null = null;
let installed = false;

export type CallEvents = {
  onIncoming: (callId: string, callerId: string) => void;
  onEnded: () => void;
  onConnected: (callId: string) => void;
  onRemoteReady: (userId: string) => void;
};

let events: CallEvents | null = null;

export function setCallEvents(next: CallEvents | null) {
  events = next;
}

export async function installCallPlugin() {
  if (installed) return;
  NCCallEngine.install();
  installed = true;
}

export async function startCallEngine() {
  if (!installed) NCCallEngine.install();
  installed = true;
  engine = NCCallEngine.initialize({});
  engine.setCallEventHandler({
    onCallReceived(event) {
      events?.onIncoming(event.session.getCallId(), event.session.getCallerUserId());
    },
    onCallEnded() {
      events?.onEnded();
    },
    onCallConnected(event) {
      events?.onConnected(event.session.getCallId());
    },
    onRemoteUserStateChanged(event) {
      if (event.userState === NCCallUserState.ONCALL) events?.onRemoteReady(event.userId);
    },
  });
  return engine;
}

export function getCallEngine() {
  return engine;
}

export async function placeVideoCall(peerId: string, local: HTMLVideoElement, remote: HTMLVideoElement) {
  if (!engine) return { ok: false as const, message: "Call SDK is not ready." };
  engine.setLocalVideoView({ videoElement: local });
  engine.setRemoteVideoView([{ userId: peerId, videoElement: remote, enableLowResolutionStream: true }]);
  const result = await engine.startCall({
    calleeIds: [peerId],
    callType: NCCallType.SINGLE,
    mediaType: NCCallMediaType.AUDIO_VIDEO,
    extra: "saathi",
  });
  if (result.code !== 0) {
    return { ok: false as const, message: `Call did not start (code ${result.code}). Enable Audio/Video Calling for this app in the Nexconn console, and use HTTPS or localhost.` };
  }
  return { ok: true as const, callId: result.callId || "" };
}

export async function answerVideoCall(callId: string, peerId: string, local: HTMLVideoElement, remote: HTMLVideoElement) {
  if (!engine) return { ok: false as const, message: "Call SDK is not ready." };
  engine.setLocalVideoView({ videoElement: local });
  if (peerId) {
    engine.setRemoteVideoView([{ userId: peerId, videoElement: remote, enableLowResolutionStream: true }]);
  }
  const result = await engine.acceptCall({ callId });
  if (result.code !== 0) {
    return { ok: false as const, message: `Could not answer (code ${result.code}).` };
  }
  return { ok: true as const };
}

export async function hangUp(callId?: string) {
  if (!engine) return;
  await engine.endCall(callId ? { callId } : undefined);
}

export async function bindRemote(peerId: string, remote: HTMLVideoElement) {
  if (!engine || !peerId) return;
  engine.setRemoteVideoView([{ userId: peerId, videoElement: remote, enableLowResolutionStream: true }]);
}
