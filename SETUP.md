# English Studio

Online PWA for Russian-speaking English learners. A2–B2 lessons, original readings and subtitled films, an interactive bridge study, three AI tutor roles, saved progress and chat history.

## Run locally

Requires Node 22.13+ and npm. Install with `npm run install:ci`, check types with `node node_modules/typescript/bin/tsc --noEmit`, run meaningful checks with `node tests/core.mjs`, build with `npm run build`.

After the first build, apply `drizzle/0000_dashing_doctor_faustus.sql` locally through Wrangler using the command in README.md. Do not replay it. Start with `npm run dev` and sign in through the local simulated ChatGPT sign-in.

## AI

Set `GROQ_API_KEY` as a server secret in Sites. Keep the Groq account on Free, without a paid tariff. The application cannot determine the billing status of a supplied key. The service provides no automatic paid fallback. Missing keys and quota exhaustion produce an explicit unavailable state; normal lessons remain usable.

`GROQ_CHAT_MODEL` defaults to `openai/gpt-oss-120b`, verified on the provider's free-limit documentation on 2026-10-01. Speech recognition uses `whisper-large-v3-turbo`. Provider quotas can change. The app enforces an additional 40-call daily Moscow-time limit per signed-in user across chat and transcription. Failed upstream requests can consume an app quota reservation.

Production environment changes require deploying the saved version again. Never put API keys in browser code, repository files or the hosting manifest.

## Voice and privacy

Microphone recording is explicitly initiated by the user, limited to two minutes, transcribed by Groq, and presented for editing before sending. The app does not persist the audio. Text conversations are stored per authenticated user. The speech endpoint serves English WAV audio from Groq Orpheus. Enable the model and accept its provider terms for the server account. Speech has its own daily allowance of 40 requests per user. The original course films have bundled English audio and captions. No pronunciation score is inferred from a transcript.

## Persistence and access

Cloudflare D1 stores profiles, lesson attempts, messages and daily quota counters. Access uses Sites-provided ChatGPT identity. New Sites remain owner-private by default. Runtime changes require verified identity and same-origin requests. The service worker caches only the offline fallback and icons, never personal API responses or lesson history.

The catalog includes A2, A2+, B1 and B2 material. The profile level guides AI prompts. Use the catalog filters to choose practice difficulty. Exercise percentages reflect the latest attempt per lesson, not validated proficiency. Free-text lesson answers use explicit accepted variants; other natural formulations may need tutor review.

## Reference

Architecture reviewed from the user's Telegram English bot at commit `2515d58`. This website reimplements the patterns for Cloudflare Workers rather than depending on Telegram or copying its deployment environment. Its original bot was not changed.
