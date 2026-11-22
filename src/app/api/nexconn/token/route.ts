import { NextResponse } from "next/server";
import { issueAccessToken, missingSecretMessage, readServerConfig } from "@/lib/nexconn/platform";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const config = readServerConfig();
  if (!config.appSecret) {
    return NextResponse.json(
      { error: missingSecretMessage(config.appKey) },
      { status: 503 },
    );
  }

  let body: { userId?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a JSON body with userId and name." }, { status: 400 });
  }

  const userId = (body.userId || "").trim();
  const name = (body.name || "").trim().slice(0, 64);
  if (!/^[A-Za-z0-9]{1,64}$/.test(userId)) {
    return NextResponse.json(
      { error: "userId must be 1 to 64 letters or numbers." },
      { status: 400 },
    );
  }
  if (!name) {
    return NextResponse.json({ error: "name is required." }, { status: 400 });
  }

  const issued = await issueAccessToken(userId, name);
  if (!issued.ok) {
    return NextResponse.json({ error: issued.error }, { status: issued.status });
  }
  return NextResponse.json({ token: issued.token, userId: issued.userId });
}
