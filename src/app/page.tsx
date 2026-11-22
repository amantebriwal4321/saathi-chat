import Link from "next/link";
import { Mark } from "@/components/mark";
import { SetupNote } from "@/components/setup-note";

export default function HomePage() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-6xl items-center gap-10 px-5 py-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section>
        <Mark />
        <p className="mt-6 text-sm font-extrabold uppercase tracking-[0.18em] text-[#c45e12]">
          Nexconn Build Challenge 2026
        </p>
        <h1 className="font-display mt-3 max-w-xl text-5xl font-semibold leading-[1.05] sm:text-6xl">
          Speak once. The whole family hears you.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-[#4d3b2e]">
          Saathi is a voice-first chat for elders in India. Big type, one microphone, and a daily check-in.
          They speak Hindi, Kannada, Tamil, Telugu, Bengali, Marathi, or English. You read it in yours.
        </p>
        <div className="mt-6">
          <SetupNote />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/demo" className="inline-flex min-h-14 items-center rounded-full bg-[#e07a2f] px-6 text-lg font-extrabold text-white">
            Try the demo
          </Link>
          <Link href="/join" className="inline-flex min-h-14 items-center rounded-full bg-white px-6 text-lg font-extrabold">
            Join a family room
          </Link>
        </div>
        <dl className="mt-8 grid gap-3 sm:grid-cols-3">
          <Feature title="Elder mode" body="Huge buttons. Hold the mic and talk. Incoming notes are read aloud." />
          <Feature title="Family mode" body="A calm chat. Every message shows the original and a translation." />
          <Feature title="Daily check-in" body="Green means I am okay. Red means I need help, and the room lights up." />
        </dl>
      </section>
      <PhonePreview />
    </main>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-3xl bg-white/80 p-4">
      <dt className="font-extrabold">{title}</dt>
      <dd className="mt-1 text-sm leading-6 text-[#5c4638]">{body}</dd>
    </div>
  );
}

function PhonePreview() {
  return (
    <div className="mx-auto w-full max-w-sm rounded-[40px] border border-[#eadcc8] bg-[#fffaf3] p-4 shadow-[0_30px_80px_rgba(36,24,18,0.12)]">
      <div className="rounded-[28px] bg-[#f6efe4] p-4">
        <p className="text-sm font-bold text-[#c45e12]">नमस्ते, अम्मा</p>
        <p className="font-display mt-1 text-3xl font-semibold">Family room</p>
        <div className="mt-4 rounded-3xl bg-white p-4">
          <p className="text-xs font-bold text-[#6d5c4e]">Aman · English</p>
          <p className="mt-2 text-2xl font-bold">We will visit this evening.</p>
          <p className="mt-2 text-xl text-[#1d4e5f]">हम आज शाम को आएँगे।</p>
        </div>
        <div className="mt-4 rounded-[28px] bg-[#e07a2f] px-4 py-6 text-center text-2xl font-extrabold text-white">
          बोलने के लिए दबाकर रखें
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-[#1c7a4a] px-2 py-4 text-center text-sm font-extrabold text-white">मैं आज ठीक हूँ</div>
          <div className="rounded-2xl bg-[#c2352b] px-2 py-4 text-center text-sm font-extrabold text-white">मुझे मदद चाहिए</div>
        </div>
      </div>
    </div>
  );
}
