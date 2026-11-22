"use client";

import { useEffect, useState } from "react";

type Status = {
  appSecretConfigured: boolean;
  callsEnabled: boolean;
  translation: string;
  area: string;
};

export function SetupNote() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    void fetch("/api/status")
      .then((response) => response.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  if (!status || status.appSecretConfigured) return null;

  return (
    <p className="rounded-2xl border border-[#e7c7a4] bg-[#fff4e6] px-4 py-3 text-sm leading-6 text-[#5c3b22]">
      The App Key is ready for the Singapore data center. Live messages start after you set
      {" "}
      <strong>NEXCONN_APP_SECRET</strong>
      {" "}
      and
      {" "}
      <strong>NEXCONN_APP_KEY</strong>
      {" "}
      on the server. Until then, Saathi stays on screen and explains why it cannot connect.
    </p>
  );
}
