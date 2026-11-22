# Saathi

Nexconn App Key: y745wfm8ynerv

Live app: https://saathi-elder-chat.vercel.app

Repository: https://github.com/amantebriwal4321/saathi-chat

## Why we built it

A lot of families in India are split across cities, and the person at home is often the one least served by a normal chat app. The phone is there. The text is small. The keyboard is in the wrong script. One wrong tap and you are in a group you did not mean to join. Saathi is the companion in that room: one big button, the language they already speak, and a family on the other side who can actually read it.

## The problem

Elders do not fail at chat because they have nothing to say. They fail because the product assumes fast typing, sharp eyes, and one shared language. A child in Bengaluru reads English. A parent in Lucknow, Chennai, or Hubballi speaks Hindi, Tamil, or Kannada. The daily question "are you okay" becomes a missed call. We wanted a check-in that is impossible to mis-tap, and a conversation that survives the language gap without asking either person to translate by hand.

## Features and which use the Nexconn SDK

Onboarding asks for a name, a role (elder or family), a language, and a room code. There is no password. The user id is derived from the name plus a random suffix and kept in localStorage, one seat per window so a demo can run elder and family side by side.

Elder mode is a phone screen: hold to talk, "I am okay today", and "I need help". SpeechRecognition turns speech into text in `hi-IN`, `kn-IN`, `ta-IN`, `te-IN`, `bn-IN`, `mr-IN`, or `en-IN`. That text is what we send. The browser also speaks incoming lines with speechSynthesis, and every card has a large Play control if auto read is off or the phone blocked it.

Family mode is a normal thread. Each message shows the original and a translation into the reader's language. Direct messages use a 1:1 channel. A check-in panel lists the last check-in time per elder. "I need help" stays highlighted until a later "I am okay" from that person.

Nexconn carries the conversation.

- The browser calls `NCEngine.initialize` with `AreaCode.SG`, then `NCEngine.connect` with a token.
- The token is minted on the server with `POST /v4/auth/access-token/issue`. The signature is SHA1 of the App Secret, nonce, and timestamp. The secret stays in `NEXCONN_APP_SECRET`.
- The family room is a group channel. `GroupChannel.createGroup` sets `joinPermission` to free, so a room code is enough. Later people call `GroupChannel.join`.
- Text uses `SendTextMessageParams`. The language, display name, role, and check-in status travel in content `extra` and in message `metadata` (`lang`, `role`, `kind`, `status`).
- History uses `BaseChannel.createMessagesQuery`. Live lines use `MessageHandler.onMessageReceived`.
- Profiles use `updateMyUserProfile` and `setMemberInfo`. Member lists use `createGroupMembersByRoleQuery`.
- A short family voice note uses `Helper.createSendHDVoiceMessageParams` and `sendMediaMessage`.
- 1:1 video uses `@nexconn/call`: `NCCallEngine.install`, `initialize`, `startCall` with `NCCallType.SINGLE` and `NCCallMediaType.AUDIO_VIDEO`, plus `acceptCall` and `endCall`. The button is hidden until `ENABLE_CALLS=true`, because the console must enable Audio/Video Calling first. Chat does not depend on it.

Translation is not a Nexconn feature here. A server route tries Groq or Gemini when a key is set, then a no-key web translator, then MyMemory. If nothing returns a line, the original stays on screen.

## Tech stack

Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4. Nexconn Web Chat SDK 26.2.0 and Call SDK 26.2.1. Web Speech API for recognition and playback. Deployed as a standard Vercel Next.js app. No database. The phone is the account.

## What's next

Push when the phone is locked, so a check-in is not missed. A volunteer room that reuses the same group channel for a community worker, not only family. Translation memory for the phrases people repeat every morning. And a call path that can fall back to audio only when a camera is too much.

The shape is already the one we would extend: one room code, one message extra payload, two ways of looking at it.
