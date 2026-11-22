import crypto from "crypto";
import { DEFAULT_APP_KEY } from "../public-config";

const AREA_HOSTS: Record<string, { primary: string; backup: string }> = {
  SG: {
    primary: "https://api.sg-light-api.com",
    backup: "https://api-b.sg-light-api.com",
  },
  NA: {
    primary: "https://api.us-light-api.com",
    backup: "https://api-b.us-light-api.com",
  },
  SA: {
    primary: "https://api.sau-light-api.com",
    backup: "https://api-b.sau-light-api.com",
  },
};

export type ServerConfig = {
  appKey: string;
  appSecret: string;
  area: string;
  primary: string;
  backup: string;
  callsEnabled: boolean;
  translation: "groq" | "gemini" | "mymemory";
};

export function readServerConfig(): ServerConfig {
  const area = (process.env.NEXCONN_AREA || process.env.NEXT_PUBLIC_NEXCONN_AREA || "SG")
    .trim()
    .toUpperCase();
  const known = AREA_HOSTS[area] || AREA_HOSTS.SG;
  const primary = (process.env.NEXCONN_API_BASE || known.primary).replace(/\/$/, "");
  const backup = primary === known.primary ? known.backup : "";
  const groq = Boolean(process.env.GROQ_API_KEY?.trim());
  const gemini = Boolean(process.env.GEMINI_API_KEY?.trim());
  return {
    appKey:
      process.env.NEXCONN_APP_KEY?.trim() ||
      process.env.NEXT_PUBLIC_NEXCONN_APP_KEY?.trim() ||
      DEFAULT_APP_KEY,
    appSecret: process.env.NEXCONN_APP_SECRET?.trim() || "",
    area,
    primary,
    backup,
    callsEnabled:
      process.env.ENABLE_CALLS === "true" || process.env.NEXT_PUBLIC_ENABLE_CALLS === "true",
    translation: groq ? "groq" : gemini ? "gemini" : "mymemory",
  };
}

export function missingSecretMessage(appKey: string): string {
  return `NEXCONN_APP_SECRET is not set, so Saathi cannot mint a Nexconn access token. Add NEXCONN_APP_SECRET and NEXCONN_APP_KEY on the server (Vercel project env vars). The App Key in use is ${appKey}. Data center is Singapore. Token validity in the console should stay Permanent.`;
}

function signature(appSecret: string, nonce: string, timestamp: string): string {
  return crypto.createHash("sha1").update(`${appSecret}${nonce}${timestamp}`).digest("hex");
}

export async function nexconnPost(path: string, body: unknown): Promise<{
  ok: boolean;
  status: number;
  code?: number;
  json: Record<string, unknown> | null;
  error?: string;
}> {
  const config = readServerConfig();
  if (!config.appSecret) {
    return { ok: false, status: 503, json: null, error: missingSecretMessage(config.appKey) };
  }

  const hosts = [config.primary, config.backup].filter(Boolean);
  let lastError = "Nexconn did not respond.";

  for (const host of hosts) {
    const nonce = crypto.randomBytes(6).toString("hex");
    const timestamp = Date.now().toString();
    try {
      const response = await fetch(`${host}${path}`, {
        method: "POST",
        headers: {
          "App-Key": config.appKey,
          Nonce: nonce,
          Timestamp: timestamp,
          Signature: signature(config.appSecret, nonce, timestamp),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000),
        cache: "no-store",
      });
      const json = (await response.json().catch(() => null)) as Record<string, unknown> | null;
      const code = typeof json?.code === "number" ? json.code : undefined;
      if (!response.ok) {
        lastError = explainPlatformError(response.status, code, json);
        continue;
      }
      return { ok: true, status: response.status, code, json };
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Network error while calling Nexconn.";
    }
  }

  return { ok: false, status: 502, json: null, error: lastError };
}

function explainPlatformError(
  httpStatus: number,
  code: number | undefined,
  json: Record<string, unknown> | null,
): string {
  const detail =
    (typeof json?.errorMessage === "string" && json.errorMessage) ||
    (typeof json?.msg === "string" && json.msg) ||
    "";
  if (httpStatus === 401 || code === 1004 || code === 1001) {
    return "Nexconn rejected the signature. Check that NEXCONN_APP_SECRET matches App Key y745wfm8ynerv in the console.";
  }
  if (code === 1006) {
    return "This Nexconn app is offline. Check the app status and the Singapore data center in the console.";
  }
  return detail || `Nexconn returned HTTP ${httpStatus}${code ? ` (code ${code})` : ""}.`;
}

export async function issueAccessToken(userId: string, name: string): Promise<{
  ok: true;
  token: string;
  userId: string;
} | {
  ok: false;
  status: number;
  error: string;
}> {
  const posted = await nexconnPost("/v4/auth/access-token/issue", { userId, name });
  if (!posted.ok || !posted.json) {
    return { ok: false, status: posted.status, error: posted.error || "Could not mint a token." };
  }
  const result = posted.json.result as { accessToken?: string; token?: string; userId?: string } | undefined;
  const token = result?.accessToken || result?.token || (posted.json.token as string | undefined);
  const code = posted.code;
  if ((code === 0 || code === 200 || token) && token) {
    return { ok: true, token, userId: result?.userId || userId };
  }
  const detail =
    (typeof posted.json.errorMessage === "string" && posted.json.errorMessage) ||
    (typeof posted.json.msg === "string" && posted.json.msg) ||
    "Nexconn did not return an access token.";
  return {
    ok: false,
    status: 502,
    error: `${detail}${code !== undefined ? ` (code ${code})` : ""}`,
  };
}
