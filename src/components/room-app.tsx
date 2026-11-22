"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearProfile, readProfile, type Profile } from "@/lib/profile";
import { CallOverlay } from "./call-overlay";
import { ElderView } from "./elder-view";
import { FamilyView } from "./family-view";
import { useSaathiRoom } from "./use-saathi";

export default function RoomApp() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = readProfile();
    if (!saved) router.replace("/join");
    else setProfile(saved);
    setReady(true);
  }, [router]);

  if (!ready || !profile) {
    return <p className="px-6 py-10 text-2xl">Opening Saathi...</p>;
  }

  return (
    <RoomSession
      profile={profile}
      onProfile={setProfile}
      onLeave={() => {
        clearProfile();
        router.push("/join");
      }}
    />
  );
}

function RoomSession({
  profile,
  onProfile,
  onLeave,
}: {
  profile: Profile;
  onProfile: (profile: Profile) => void;
  onLeave: () => void;
}) {
  const room = useSaathiRoom(profile, onProfile);
  const groupMessages = room.messages.filter((item) => item.channel === "group");
  const directMessages = room.messages.filter((item) => item.channel === "direct" && item.peerId === room.directPeer);

  return (
    <main>
      <div className="mx-auto flex max-w-3xl justify-end px-4 pt-3">
        <button type="button" onClick={onLeave} className="text-sm font-bold text-[#6d5c4e] underline">
          Switch person
        </button>
      </div>
      {profile.role === "elder" ? (
        <ElderView
          profile={profile}
          phase={room.phase}
          error={room.error}
          messages={room.messages}
          translations={room.translations}
          members={room.members}
          autoRead={room.autoRead}
          setAutoRead={room.setAutoRead}
          callsOn={room.callsOn}
          onSend={(text) => room.sendText(text)}
          onCheckin={room.sendCheckin}
          onCall={room.requestCall}
        />
      ) : (
        <FamilyView
          profile={profile}
          phase={room.phase}
          error={room.error}
          messages={room.directPeer ? directMessages : groupMessages}
          translations={room.translations}
          members={room.members}
          checkins={room.checkins}
          directPeer={room.directPeer}
          callsOn={room.callsOn}
          onLanguage={room.setLanguage}
          onSend={(text) => room.sendText(text, room.directPeer ? { peerId: room.directPeer } : undefined)}
          onVoice={room.sendVoice}
          onOpenDirect={(peerId) => void room.openDirect(peerId)}
          onShowRoom={() => room.setDirectPeer(null)}
          onCall={room.requestCall}
        />
      )}
      {room.callUi ? (
        <CallOverlay call={room.callUi} large={profile.role === "elder"} onClose={() => room.setCallUi(null)} />
      ) : null}
    </main>
  );
}
