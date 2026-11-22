export const DEFAULT_APP_KEY = "y745wfm8ynerv";

export const publicAppKey =
  process.env.NEXT_PUBLIC_NEXCONN_APP_KEY?.trim() || DEFAULT_APP_KEY;

export const publicArea = (process.env.NEXT_PUBLIC_NEXCONN_AREA || "SG").trim().toUpperCase();
