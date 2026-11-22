import { speechLocale, type LanguageCode } from "./languages";

export function speechRecognitionSupported(): boolean {
  return typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function speak(text: string, language: LanguageCode): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis || !text.trim()) return false;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const locale = speechLocale(language);
  utterance.lang = locale;
  utterance.rate = 0.92;
  const prefix = locale.slice(0, 2).toLowerCase();
  const voice = synth.getVoices().find((item) => item.lang.toLowerCase().startsWith(prefix));
  if (voice) utterance.voice = voice;
  synth.speak(utterance);
  return true;
}

export function stopSpeaking() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

export function unlockSpeech() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.resume();
}

type HoldSession = {
  stop: () => void;
};

export function startHoldToTalk(options: {
  language: LanguageCode;
  onPartial: (text: string) => void;
  onFinal: (text: string) => void;
  onError: (message: string) => void;
}): HoldSession | null {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) {
    options.onError("This browser cannot hear speech. Type the message instead, or open Chrome.");
    return null;
  }
  const recognition = new Ctor();
  recognition.lang = speechLocale(options.language);
  recognition.continuous = true;
  recognition.interimResults = true;
  let transcript = "";
  let stopped = false;

  recognition.onresult = (event) => {
    let text = "";
    for (let index = 0; index < event.results.length; index += 1) {
      text += event.results[index][0]?.transcript || "";
    }
    transcript = text.trim();
    options.onPartial(transcript);
  };
  recognition.onerror = (event) => {
    if (event.error === "aborted" || event.error === "no-speech") return;
    if (event.error === "not-allowed") {
      options.onError("Microphone permission is blocked. Allow the mic, or type instead.");
      return;
    }
    options.onError("The microphone stopped. Please try again.");
  };
  recognition.onend = () => {
    if (!stopped) return;
    options.onFinal(transcript);
  };

  try {
    recognition.start();
  } catch {
    options.onError("Could not start listening. Please try again.");
    return null;
  }

  return {
    stop() {
      stopped = true;
      try {
        recognition.stop();
      } catch {
        options.onFinal(transcript);
      }
    },
  };
}
