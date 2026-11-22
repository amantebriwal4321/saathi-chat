"use client";

import {
  AreaCode,
  BaseChannel,
  ChannelType,
  ConnectionStatusHandler,
  DirectChannel,
  GroupChannel,
  GroupJoinPermission,
  GroupMemberRole,
  GroupOperationPermission,
  Helper,
  LogLevel,
  MessageHandler,
  MessageType,
  NCEngine,
  SendTextMessageParams,
  type Message,
} from "@nexconn/chat";
import { publicAppKey } from "../public-config";
import type { LanguageCode, Role } from "../languages";
import {
  encodeExtra,
  readExtra,
  type ChatItem,
  type CheckinStatus,
  type SaathiExtra,
  type SaathiKind,
} from "../saathi-message";

const GROUP_EXISTS = 25409;
const ALREADY_MEMBER = 25412;

let bootPromise: Promise<void> | null = null;
let bootedWithCalls = false;
let callReady = false;

export function callsAreReady() {
  return callReady;
}

export function initEngine(withCalls: boolean) {
  if (!bootPromise) {
    bootPromise = bootEngine(withCalls).catch((error) => {
      bootPromise = null;
      throw error;
    });
  }
  return bootPromise;
}

async function bootEngine(withCalls: boolean) {
  let calls: typeof import("./calls") | null = null;
  if (withCalls) {
    try {
      calls = await import("./calls");
      await calls.installCallPlugin();
    } catch {
      calls = null;
    }
  }
  NCEngine.initialize({
    appKey: publicAppKey,
    areaCode: AreaCode.SG,
    logLevel: LogLevel.WARN,
  });
  if (calls) {
    try {
      await calls.startCallEngine();
      callReady = true;
      bootedWithCalls = true;
    } catch {
      callReady = false;
    }
  }
}

export function callEngineReady() {
  return bootedWithCalls && callReady;
}

type ConnectCache = { userId: string; promise: Promise<{ ok: true; userId: string } | { ok: false; message: string }> };
let connectCache: ConnectCache | null = null;

export function connectUser(userId: string, token: string) {
  if (connectCache?.userId === userId) return connectCache.promise;
  const promise = NCEngine.connect({ token }).then((result) => {
    if (result.isOk) return { ok: true as const, userId: result.data?.userId || userId };
    return {
      ok: false as const,
      message: `Nexconn could not connect (${result.code}). ${result.msg || "Check the App Key and the server token."}`,
    };
  });
  connectCache = { userId, promise };
  return promise;
}

export function watchConnection(onStatus: (status: number) => void) {
  NCEngine.removeConnectionStatusHandler("saathi-conn");
  NCEngine.addConnectionStatusHandler(
    "saathi-conn",
    new ConnectionStatusHandler({
      onConnectionStatusChanged({ status }) {
        onStatus(status);
      },
    }),
  );
}

export function watchMessages(onMessages: (messages: Message[]) => void) {
  NCEngine.removeMessageHandler("saathi-msg");
  NCEngine.addMessageHandler(
    "saathi-msg",
    new MessageHandler({
      onMessageReceived({ messages }) {
        onMessages(messages);
      },
    }),
  );
}

export async function ensureFamilyRoom(roomId: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const created = await GroupChannel.createGroup({
    groupId: roomId,
    groupName: `Saathi ${roomId}`.slice(0, 64),
    joinPermission: GroupJoinPermission.FREE,
    invitePermission: GroupOperationPermission.EVERYONE,
  });
  if (created.isOk) return { ok: true };

  const group = new GroupChannel(roomId);
  const joined = await group.join();
  if (joined.isOk || joined.code === ALREADY_MEMBER) return { ok: true };

  if (created.code === GROUP_EXISTS && joined.code === 25414) {
    return {
      ok: false,
      message: `Room ${roomId} exists but is not open for new people. Pick another room code.`,
    };
  }
  return {
    ok: false,
    message: `Could not open room ${roomId}. ${joined.msg || created.msg || "Nexconn refused the group."} (${joined.code || created.code})`,
  };
}

export async function publishProfile(profile: {
  userId: string;
  displayName: string;
  role: Role;
  language: LanguageCode;
  roomCode: string;
}) {
  await NCEngine.userModule.updateMyUserProfile({
    name: profile.displayName,
    extProfile: { role: profile.role, language: profile.language },
  }).catch(() => undefined);

  const group = new GroupChannel(profile.roomCode);
  await group.setMemberInfo({
    userId: profile.userId,
    nickname: profile.displayName.slice(0, 64),
    extra: JSON.stringify({ role: profile.role, language: profile.language }),
  }).catch(() => undefined);
}

export type Person = {
  userId: string;
  name: string;
  role?: Role;
  language?: LanguageCode;
};

export async function loadMembers(roomId: string): Promise<Person[]> {
  const roles = [GroupMemberRole.OWNER, GroupMemberRole.ADMIN, GroupMemberRole.NORMAL];
  const people = new Map<string, Person>();
  for (const role of roles) {
    const query = GroupChannel.createGroupMembersByRoleQuery({
      groupId: roomId,
      role,
      pageSize: 50,
    });
    const page = await query.loadNextPage();
    if (!page.isOk || !page.data) continue;
    const rows = Array.isArray(page.data) ? page.data : page.data.data;
    for (const member of rows || []) {
      let extraRole: Role | undefined;
      let extraLanguage: LanguageCode | undefined;
      if (member.extra) {
        try {
          const parsed = JSON.parse(member.extra) as { role?: Role; language?: LanguageCode };
          if (parsed.role === "elder" || parsed.role === "family") extraRole = parsed.role;
          if (parsed.language) extraLanguage = parsed.language;
        } catch {
          extraRole = undefined;
        }
      }
      people.set(member.userId, {
        userId: member.userId,
        name: member.nickname || member.name || member.userId,
        role: extraRole,
        language: extraLanguage,
      });
    }
  }
  return [...people.values()];
}

function rowsOf(data: unknown): Message[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as Message[];
  if (typeof data === "object" && data && "data" in data && Array.isArray((data as { data: unknown }).data)) {
    return (data as { data: Message[] }).data;
  }
  return [];
}

export async function loadHistory(roomId: string, me: string): Promise<ChatItem[]> {
  const channel = new GroupChannel(roomId);
  const query = BaseChannel.createMessagesQuery({
    channelIdentifier: channel.identifier,
    startTime: Date.now(),
    pageSize: 50,
    isAscending: false,
  });
  const page = await query.loadNextPage();
  if (!page.isOk) return [];
  return rowsOf(page.data)
    .map((message) => messageToItem(message, me))
    .filter((item): item is ChatItem => Boolean(item))
    .sort((a, b) => a.sentTime - b.sentTime);
}

export async function loadDirectHistory(peerId: string, me: string): Promise<ChatItem[]> {
  const channel = new DirectChannel(peerId);
  const query = BaseChannel.createMessagesQuery({
    channelIdentifier: channel.identifier,
    startTime: Date.now(),
    pageSize: 30,
    isAscending: false,
  });
  const page = await query.loadNextPage();
  if (!page.isOk) return [];
  return rowsOf(page.data)
    .map((message) => messageToItem(message, me))
    .filter((item): item is ChatItem => Boolean(item))
    .sort((a, b) => a.sentTime - b.sentTime);
}

export function acceptMessage(message: Message, roomId: string, me: string): ChatItem | null {
  const item = messageToItem(message, me);
  if (!item) return null;
  if (item.channel === "group" && message.channelIdentifier.channelId.toUpperCase() !== roomId.toUpperCase()) {
    return null;
  }
  return item;
}

export function messageToItem(message: Message, me: string): ChatItem | null {
  const channelType = message.channelIdentifier.channelType;
  const channelId = message.channelIdentifier.channelId;
  const channel = channelType === ChannelType.GROUP ? "group" : channelType === ChannelType.DIRECT ? "direct" : null;
  if (!channel) return null;

  const content = (message.content || {}) as {
    text?: string;
    extra?: string;
    remoteUrl?: string;
    duration?: number;
  };
  const extra = readExtra(content, message.metadata);
  const kind: SaathiKind = extra.kind
    || (message.messageType === MessageType.HD_VOICE ? "voice" : "chat");
  const text = (content.text || "").trim();
  const voiceUrl = message.messageType === MessageType.HD_VOICE ? content.remoteUrl : undefined;
  if (!text && !voiceUrl) return null;

  const senderUserId = message.senderUserId || me;
  return {
    id: message.messageId || `${senderUserId}-${message.sentTime}-${message.clientId}`,
    text,
    language: extra.language || "en",
    displayName: extra.displayName || senderUserId,
    role: extra.role || "family",
    kind,
    status: extra.status,
    senderUserId,
    sentTime: message.sentTime || Date.now(),
    channel,
    peerId: channel === "direct" ? (senderUserId === me ? channelId : senderUserId) : undefined,
    voiceUrl,
    duration: content.duration,
  };
}

async function sendTextOn(
  channel: GroupChannel | DirectChannel,
  text: string,
  extra: SaathiExtra,
): Promise<{ ok: true; item: ChatItem; me: string } | { ok: false; message: string }> {
  const params = new SendTextMessageParams({
    text,
    extra: encodeExtra(extra),
  });
  params.metadata = {
    lang: extra.language,
    role: extra.role,
    kind: extra.kind,
    ...(extra.status ? { status: extra.status } : {}),
  };
  const result = await channel.sendMessage(params);
  if (!result.isOk || !result.data) {
    return {
      ok: false,
      message: `Message was not sent (${result.code}). ${result.msg || "Try again in a moment."}`,
    };
  }
  const me = result.data.senderUserId;
  const item = messageToItem(result.data, me) || {
    id: result.data.messageId,
    text,
    language: extra.language,
    displayName: extra.displayName,
    role: extra.role,
    kind: extra.kind,
    status: extra.status,
    senderUserId: me,
    sentTime: result.data.sentTime || Date.now(),
    channel: channel.channelType === ChannelType.GROUP ? "group" : "direct",
    peerId: channel.channelType === ChannelType.DIRECT ? channel.channelId : undefined,
  };
  return { ok: true, item, me };
}

export function sendGroupText(roomId: string, text: string, extra: SaathiExtra) {
  return sendTextOn(new GroupChannel(roomId), text, extra);
}

export function sendDirectText(peerId: string, text: string, extra: SaathiExtra) {
  return sendTextOn(new DirectChannel(peerId), text, extra);
}

export async function sendGroupVoice(roomId: string, file: File, extra: SaathiExtra) {
  const prepared = await Helper.createSendHDVoiceMessageParams(file);
  if (!prepared.isOk || !prepared.data) {
    return {
      ok: false as const,
      message: `Voice note was not prepared (${prepared.code}). ${prepared.msg || "The recording format was not accepted."}`,
    };
  }
  prepared.data.metadata = {
    lang: extra.language,
    role: extra.role,
    kind: "voice",
  };
  const content = prepared.data.content as { extra?: string };
  if (content && typeof content === "object") content.extra = encodeExtra({ ...extra, kind: "voice" });
  const channel = new GroupChannel(roomId);
  const result = await channel.sendMediaMessage(prepared.data);
  if (!result.isOk || !result.data) {
    return {
      ok: false as const,
      message: `Voice note was not sent (${result.code}). ${result.msg || "Try a typed message."}`,
    };
  }
  const item = messageToItem(result.data, result.data.senderUserId);
  return item ? { ok: true as const, item } : { ok: false as const, message: "Voice note sent, but it could not be shown." };
}

export function checkinExtra(
  profile: { displayName: string; role: Role; language: LanguageCode },
  status: CheckinStatus,
): SaathiExtra {
  return {
    language: profile.language,
    displayName: profile.displayName,
    role: profile.role,
    kind: "checkin",
    status,
  };
}
