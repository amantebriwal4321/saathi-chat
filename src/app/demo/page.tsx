import Link from "next/link";
import { Mark } from "@/components/mark";
import { SetupNote } from "@/components/setup-note";

const elderHref = "/join?seat=elder&role=elder&name=Ammi&lang=hi&room=SAATHI&go=1";
const familyHref = "/join?seat=family&role=family&name=Aman&lang=en&room=SAATHI&go=1";

export default function DemoPage() {
  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-5 py-8">
      <Link href="/" className="inline-flex"><Mark /></Link>
      <h1 className="font-display mt-8 text-4xl font-semibold sm:text-5xl">Two windows, one family room.</h1>
      <p className="mt-4 text-lg leading-8 text-[#4d3b2e]">
        Open elder in this window and family in another. Both use room code SAATHI.
        Each window keeps its own person, so a refresh does not swap them.
      </p>
      <div className="mt-5"><SetupNote /></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link href={elderHref} className="rounded-[28px] bg-[#e07a2f] p-5 text-white">
          <p className="text-sm font-extrabold uppercase tracking-wide">This window</p>
          <p className="font-display mt-2 text-3xl font-semibold">Open as Ammi</p>
          <p className="mt-2 text-sm">Elder mode, Hindi, room SAATHI.</p>
        </Link>
        <a href={familyHref} target="_blank" rel="noreferrer" className="rounded-[28px] bg-[#1d4e5f] p-5 text-white">
          <p className="text-sm font-extrabold uppercase tracking-wide">New window</p>
          <p className="font-display mt-2 text-3xl font-semibold">Open as Aman</p>
          <p className="mt-2 text-sm">Family mode, English, same room.</p>
        </a>
      </div>
      <ol className="mt-8 space-y-3 text-base leading-7">
        <li>1. Ammi holds the microphone and speaks Hindi. Chrome works best for speech.</li>
        <li>2. Aman sees the Hindi line and an English translation under it.</li>
        <li>3. Aman replies in English. Ammi hears it read aloud in Hindi, or taps Play.</li>
        <li>4. Ammi taps the green check-in, then the red one. Aman sees Needs help.</li>
        <li>5. Video call appears after ENABLE_CALLS is turned on and calling is enabled in the console.</li>
      </ol>
    </main>
  );
}
