"use client";

import dynamic from "next/dynamic";

const RoomApp = dynamic(() => import("@/components/room-app"), {
  ssr: false,
  loading: () => <p className="px-6 py-10 text-2xl">Opening Saathi...</p>,
});

export default function RoomPage() {
  return <RoomApp />;
}
