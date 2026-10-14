# Dentiva: website FAQ + optional AI chat

This copy includes the latest Gallery captions, compact Services/Patient Stories and responsive carousels. The original supplied archive was not changed.

## Deploy to Netlify
1. Deploy this folder with Netlify CLI or a Git repository build. Netlify must deploy `netlify/functions/chat.js`, not only the HTML. The included `netlify.toml` defines publish directory `.` and functions directory `netlify/functions`.
2. In Netlify, open the site's Environment variables settings. Add `GEMINI_API_KEY` as a secret for Functions runtime in the Production deploy context. Paste your own Google Gemini API key there, never into HTML, chat.js, a Git commit or the chat input.
3. Optional: set `GEMINI_MODEL` to an available Gemini text model. Default: `gemini-3.5-flash-lite`, listed in Google's model documentation on 12 October 2026. Availability, billing and quotas depend on your Google account.
4. Redeploy after changing environment variables. Visit `/api/chat` on your Netlify domain: it should return `{"mode":"ai"}` if a key is configured or `{"mode":"faq"}` without a key. This checks configuration only, not key validity.
5. Open the widget and send a general website question. A successful provider reply stays in AI mode. An invalid key, provider error, timeout or empty reply switches the widget to clearly labeled Website FAQ mode. Reload the page after correcting configuration.

## What the modes do
- No key or no backend: local predefined website answers. No Google request is made. Questions cover services, doctors, hours, location, contact, insurance, parking, prices/EMI and booking instructions.
- Key configured: messages and up to eight previous messages are sent through the server-side function to Google. The key stays on the server. AI uses the same website facts; browser-supplied context is ignored.
- Provider unavailable: the same FAQ answers, with a visible mode change. Replies are rendered as text, not executable HTML.
- No treatment prices are listed in the website content. The old invented check-up range was removed. Installment and insurance descriptions are attributed to the website and require clinic confirmation.
- Neither mode books an appointment, checks live slots or diagnoses symptoms. The contact form remains a validation-only preview and sends nothing.

## Before public launch
Confirm all clinic facts, doctors, reviews, advertised terms, emergency instructions, privacy notice and contact details. Add production abuse protection, durable rate limiting and spend/usage limits before exposing the paid AI endpoint publicly. The endpoint is not certified for medical advice. Do not enter private health information in chat. AI messages are sent to Google; history is held only in the current page session.

Tests used isolated provider mocks only. No real API key, live provider request, paid charge or public deployment was made. A configured key is not proof that the provider works. The hosted private preview demonstrates FAQ mode only; it cannot run Netlify Functions.

Provider model reference: https://ai.google.dev/gemini-api/docs/models

## Chat presentation
Replies use a short typing-dot pause and a quick text reveal (usually complete in about 1.5 seconds after the answer is ready). Both FAQ and AI paths use this treatment. Reduced-motion preferences skip the animated reveal. Screen readers receive the completed reply once. The heading is "Dentiva chat" and offline replies remain labeled Website FAQ mode; no live human is claimed.
