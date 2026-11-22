import { NextResponse } from "next/server";
import { readServerConfig } from "@/lib/nexconn/platform";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  const config = readServerConfig();
  return NextResponse.json({
    appKeyConfigured: Boolean(config.appKey),
    appSecretConfigured: Boolean(config.appSecret),
    area: config.area,
    apiBase: config.primary,
    callsEnabled: config.callsEnabled,
    translation: config.translation === "mymemory" ? "web" : config.translation,
  });
}
