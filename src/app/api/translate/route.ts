import { NextResponse } from "next/server";
import { isLanguage, languageLabel, type LanguageCode } from "@/lib/languages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cache = new Map<string, string>();

function remember(key: string, value: string) {
  if (cache.size > 400) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, value);
}

function decodeBasic(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function translateWithGroq(text: string, source: LanguageCode, target: LanguageCode) {
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) return null;
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `Translate the user message from ${languageLabel(source)} to ${languageLabel(target)}. Return only the translation.`,
        },
        { role: "user", content: text },
      ],
    }),
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) return null;
  const json = await response.json();
  const value = json?.choices?.[0]?.message?.content;
  return typeof value === "string" ? value.trim() : null;
}

async function translateWithGemini(text: string, source: LanguageCode, target: LanguageCode) {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) return null;
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Translate from ${languageLabel(source)} to ${languageLabel(target)}. Return only the translation.\n\n${text}`,
              },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(12000),
    },
  );
  if (!response.ok) return null;
  const json = await response.json();
  const value = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  return typeof value === "string" ? value.trim() : null;
}

function readLooseTranslation(body: unknown): string | null {
  if (typeof body === "string") return body.trim() || null;
  if (!Array.isArray(body)) return null;
  const parts: string[] = [];
  for (const item of body) {
    if (typeof item === "string") parts.push(item);
    else if (Array.isArray(item) && typeof item[0] === "string") parts.push(item[0]);
  }
  const text = parts.join(" ").trim();
  return text || null;
}

async function translateWithWeb(text: string, source: LanguageCode, target: LanguageCode) {
  const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${source}&tl=${target}&q=${encodeURIComponent(text)}`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!response.ok) return null;
  const body = await response.json().catch(() => null);
  return readLooseTranslation(body);
}

async function translateWithMyMemory(text: string, source: LanguageCode, target: LanguageCode) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(8000), cache: "no-store" });
  if (!response.ok) return null;
  const json = await response.json();
  const value = json?.responseData?.translatedText;
  if (typeof value !== "string") return null;
  if (value.includes("MYMEMORY WARNING") || value.includes("QUERY LENGTH LIMIT")) return null;
  return decodeBasic(value).trim();
}

export async function POST(request: Request) {
  let body: { text?: string; source?: string; target?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send JSON with text, source, and target." }, { status: 400 });
  }
  const text = (body.text || "").trim().slice(0, 1000);
  if (!text || !isLanguage(body.source) || !isLanguage(body.target)) {
    return NextResponse.json({ error: "text, source, and target are required." }, { status: 400 });
  }
  if (body.source === body.target) {
    return NextResponse.json({ translation: text, provider: "same" });
  }

  const cacheKey = `${body.source}|${body.target}|${text}`;
  const cached = cache.get(cacheKey);
  if (cached) return NextResponse.json({ translation: cached, provider: "cache" });

  const source = body.source;
  const target = body.target;
  try {
    const llm = (await translateWithGroq(text, source, target))
      || (await translateWithGemini(text, source, target));
    if (llm) {
      remember(cacheKey, llm);
      return NextResponse.json({
        translation: llm,
        provider: process.env.GROQ_API_KEY ? "groq" : "gemini",
      });
    }
  } catch {
    // Fall through to the no-key translator.
  }

  try {
    const web = await translateWithWeb(text, source, target);
    if (web) {
      remember(cacheKey, web);
      return NextResponse.json({ translation: web, provider: "web" });
    }
  } catch {
    // Try MyMemory next.
  }

  try {
    const free = await translateWithMyMemory(text, body.source, body.target);
    if (free) {
      remember(cacheKey, free);
      return NextResponse.json({ translation: free, provider: "mymemory" });
    }
  } catch {
    // Show the original when every translator fails.
  }

  return NextResponse.json({ translation: null, provider: "none" });
}
