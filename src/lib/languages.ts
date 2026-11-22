export const LANGUAGE_CODES = ["hi", "kn", "ta", "te", "bn", "mr", "en"] as const;

export type LanguageCode = (typeof LANGUAGE_CODES)[number];

export type Role = "elder" | "family";

export type UiCopy = {
  hello: string;
  hold: string;
  listening: string;
  release: string;
  okay: string;
  help: string;
  type: string;
  send: string;
  play: string;
  messages: string;
  readAloud: string;
  video: string;
  missed: string;
  you: string;
  familyRoom: string;
  connecting: string;
  online: string;
  offline: string;
  placeholder: string;
};

export const LANGUAGES: Record<
  LanguageCode,
  { label: string; native: string; speech: string; ui: UiCopy }
> = {
  hi: {
    label: "Hindi",
    native: "हिन्दी",
    speech: "hi-IN",
    ui: {
      hello: "नमस्ते",
      hold: "बोलने के लिए दबाकर रखें",
      listening: "सुन रहे हैं",
      release: "छोड़ें, संदेश जाएगा",
      okay: "मैं आज ठीक हूँ",
      help: "मुझे मदद चाहिए",
      type: "लिखकर भेजें",
      send: "भेजें",
      play: "सुनाओ",
      messages: "संदेश",
      readAloud: "संदेश आवाज़ में सुनाएँ",
      video: "वीडियो कॉल",
      missed: "सुनाई नहीं दिया। फिर से बोलें।",
      you: "आप",
      familyRoom: "परिवार",
      connecting: "जुड़ रहा है",
      online: "जुड़ गए",
      offline: "जुड़ा नहीं",
      placeholder: "यहाँ लिखें",
    },
  },
  kn: {
    label: "Kannada",
    native: "ಕನ್ನಡ",
    speech: "kn-IN",
    ui: {
      hello: "ನಮಸ್ಕಾರ",
      hold: "ಮಾತನಾಡಲು ಒತ್ತಿ ಹಿಡಿಯಿರಿ",
      listening: "ಕೇಳುತ್ತಿದ್ದೇವೆ",
      release: "ಬಿಡಿ, ಕಳುಹಿಸುತ್ತೇವೆ",
      okay: "ನಾನು ಇಂದು ಚೆನ್ನಾಗಿದ್ದೇನೆ",
      help: "ನನಗೆ ಸಹಾಯ ಬೇಕು",
      type: "ಬರೆದು ಕಳುಹಿಸಿ",
      send: "ಕಳುಹಿಸಿ",
      play: "ಕೇಳಿಸಿ",
      messages: "ಸಂದೇಶಗಳು",
      readAloud: "ಸಂದೇಶಗಳನ್ನು ಓದಿ ಹೇಳಿ",
      video: "ವೀಡಿಯೊ ಕರೆ",
      missed: "ಕೇಳಿಸಲಿಲ್ಲ. ಮತ್ತೆ ಮಾತನಾಡಿ.",
      you: "ನೀವು",
      familyRoom: "ಕುಟುಂಬ",
      connecting: "ಸೇರುತ್ತಿದೆ",
      online: "ಸೇರಿದೆ",
      offline: "ಸೇರಿಲ್ಲ",
      placeholder: "ಇಲ್ಲಿ ಬರೆಯಿರಿ",
    },
  },
  ta: {
    label: "Tamil",
    native: "தமிழ்",
    speech: "ta-IN",
    ui: {
      hello: "வணக்கம்",
      hold: "பேச அழுத்திப் பிடியுங்கள்",
      listening: "கேட்டுக் கொண்டிருக்கிறோம்",
      release: "விடுங்கள், அனுப்புவோம்",
      okay: "நான் இன்று நலமாக இருக்கிறேன்",
      help: "எனக்கு உதவி வேண்டும்",
      type: "எழுதி அனுப்புங்கள்",
      send: "அனுப்பு",
      play: "கேளுங்கள்",
      messages: "செய்திகள்",
      readAloud: "செய்திகளைப் படித்துக் காட்டு",
      video: "வீடியோ அழைப்பு",
      missed: "கேட்கவில்லை. மீண்டும் பேசுங்கள்.",
      you: "நீங்கள்",
      familyRoom: "குடும்பம்",
      connecting: "இணைக்கிறது",
      online: "இணைந்தது",
      offline: "இணையவில்லை",
      placeholder: "இங்கே எழுதுங்கள்",
    },
  },
  te: {
    label: "Telugu",
    native: "తెలుగు",
    speech: "te-IN",
    ui: {
      hello: "నమస్కారం",
      hold: "మాట్లాడటానికి నొక్కి పట్టుకోండి",
      listening: "వింటున్నాం",
      release: "వదలండి, పంపుతాం",
      okay: "నేను ఈరోజు బాగున్నాను",
      help: "నాకు సహాయం కావాలి",
      type: "రాసి పంపండి",
      send: "పంపండి",
      play: "వినిపించు",
      messages: "సందేశాలు",
      readAloud: "సందేశాలు చదివి వినిపించు",
      video: "వీడియో కాల్",
      missed: "వినపడలేదు. మళ్లీ చెప్పండి.",
      you: "మీరు",
      familyRoom: "కుటుంబం",
      connecting: "కలుస్తోంది",
      online: "కలిసింది",
      offline: "కలవలేదు",
      placeholder: "ఇక్కడ రాయండి",
    },
  },
  bn: {
    label: "Bengali",
    native: "বাংলা",
    speech: "bn-IN",
    ui: {
      hello: "নমস্কার",
      hold: "বলতে চাপ দিয়ে রাখুন",
      listening: "শুনছি",
      release: "ছেড়ে দিন, পাঠিয়ে দেব",
      okay: "আমি আজ ভালো আছি",
      help: "আমার সাহায্য দরকার",
      type: "লিখে পাঠান",
      send: "পাঠান",
      play: "শোনান",
      messages: "বার্তা",
      readAloud: "বার্তা পড়ে শোনান",
      video: "ভিডিও কল",
      missed: "শোনা যায়নি। আবার বলুন।",
      you: "আপনি",
      familyRoom: "পরিবার",
      connecting: "জুড়ছে",
      online: "জুড়েছে",
      offline: "জোড়া হয়নি",
      placeholder: "এখানে লিখুন",
    },
  },
  mr: {
    label: "Marathi",
    native: "मराठी",
    speech: "mr-IN",
    ui: {
      hello: "नमस्कार",
      hold: "बोलण्यासाठी दाबून ठेवा",
      listening: "ऐकत आहोत",
      release: "सोडा, पाठवू",
      okay: "मी आज ठीक आहे",
      help: "मला मदत हवी आहे",
      type: "लिहून पाठवा",
      send: "पाठवा",
      play: "ऐकवा",
      messages: "संदेश",
      readAloud: "संदेश वाचून ऐकवा",
      video: "व्हिडिओ कॉल",
      missed: "ऐकू आले नाही. पुन्हा बोला.",
      you: "तुम्ही",
      familyRoom: "कुटुंब",
      connecting: "जोडत आहोत",
      online: "जोडले",
      offline: "जोडले नाही",
      placeholder: "इथे लिहा",
    },
  },
  en: {
    label: "English",
    native: "English",
    speech: "en-IN",
    ui: {
      hello: "Hello",
      hold: "Hold to talk",
      listening: "Listening",
      release: "Release to send",
      okay: "I am okay today",
      help: "I need help",
      type: "Type instead",
      send: "Send",
      play: "Play",
      messages: "Messages",
      readAloud: "Read messages aloud",
      video: "Video call",
      missed: "I did not catch that. Please try again.",
      you: "You",
      familyRoom: "Family",
      connecting: "Connecting",
      online: "Connected",
      offline: "Not connected",
      placeholder: "Type here",
    },
  },
};

export function isLanguage(value: string | null | undefined): value is LanguageCode {
  return !!value && (LANGUAGE_CODES as readonly string[]).includes(value);
}

export function speechLocale(code: LanguageCode): string {
  return LANGUAGES[code].speech;
}

export function languageLabel(code: LanguageCode): string {
  return LANGUAGES[code].label;
}
