# רגע · Rega

A Hebrew, right-to-left micro-learning web app for the iPhone Home Screen. No account, subscription, install-time build or Mac is required to use the hosted app.

## On iPhone

Open the published HTTPS URL in Safari → Share → Add to Home Screen. If offered, keep “Open as Web App” enabled. Open the resulting icon, choose interests, and start reading. The app caches its content for offline use after the first successful online load.

Safari and the installed web app can have separate storage. Install first, then personalize. Preferences, reactions and bookmarks stay in local browser storage. Clearing site data removes them; export/restore is available in Preferences.

## Product

- Three-step onboarding in Hebrew, restricted to topics with available reviewed content.
- One card at a time, independent knowledge/interest signals, sources, details, related items, bookmarks.
- Local configurable 70/20/10 exploration policy. First card honors interests. Votes replace rather than accumulate. No automatic repeats; explicit review mode after exhaustion.
- Learning statistics and a knowledge map; no intelligence score.
- Light, dark and system themes, reduced motion, 44px controls, semantic buttons/dialogs.
- 62 source-checked Hebrew cards, 33 extensible category definitions. Every selectable topic has at least four cards. AI wording assumes no technical background.
- Factual metadata includes citations, dates, verification state, difficulty, tags and freshness. Time-sensitive content is withheld after nextReviewAt. These initial records are evergreen.

The earlier native project's 112 candidate records were not fully source-audited. They are deliberately excluded from this release. The shipped set is smaller because a citation-shaped URL is not verification.

## Limits

This is a Home Screen web app, not an App Store binary. Native widgets, Live Activities and unlock interception are not implemented. Optional Web Push now uses the separate Cloudflare Worker in `push/`; activation requires an individual pairing code and notification permission. Daily or three-times-daily delivery, a delayed test, and deletion are available in Preferences. No LLM publishes content directly. Physical locked-iPhone delivery must still be confirmed by the user.

Push privacy: only delivery address/keys, selected topics, time zone, frequency, sent-notification IDs and operational status leave the device when enabled. Bookmarks, reactions and reading history remain local. Notifications may repeat a fact read in the feed, because the histories are intentionally not synchronized. Push registrations expire after 90 days unless preferences are saved again. Changing learning interests requires saving notification settings to update delivery topics.

## Development and deployment

Node 24. `npm ci`, then `npm test`. `npm start` serves http://127.0.0.1:4173. These are developer steps only; users open the hosted URL.

GitHub Pages publishes the generated `docs/` directory from the main branch. After source edits, run tests and `npm run prepare:pages`, then commit both `dist/` and `docs/`. This uses the normal Pages branch deployment, without requesting extra GitHub workflow permissions. All URLs are relative for project subpaths.

`npm run test:browser` runs isolated mobile flows. Install the test engines with `npx playwright install chromium webkit`. On Windows the tests use installed Edge for Chromium. Tests never access an existing personal browser profile.

Sources and content review notes: `CONTENT_REVIEW.md`. Platform restrictions: `PLATFORM.md`.

## Notification service

`npm ci --prefix push`, then `node --test push/tests/push.test.mjs` runs the backend policy/security tests. `node tests/push-browser.mjs` tests notification UI in Chromium and WebKit with a local mocked transport (not physical delivery). The existing `npm test`, browser and update regression tests remain available.

Deployment configuration is `push/wrangler.jsonc`; D1 schema is `push/schema.sql`. This deployment uses Workers Free and D1 Free, no paid services or billing activation. The private signing key and enrollment code are Cloudflare secrets, never in `dist/`, `docs/`, Git or browser bundles. Deployment should preserve those secrets. Do not rotate VAPID keys without a subscription migration plan.
