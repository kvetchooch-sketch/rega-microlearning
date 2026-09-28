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
- 250 source-checked Hebrew cards, 20 populated topics and 33 extensible category definitions. Every selectable topic has at least four cards. AI wording assumes no technical background.
- Search/category filters and named collections for saved facts; backups preserve collections, discovery settings and review progress without notification credentials.
- “Why this?” and “less of this topic”, repeated-interest weighting, recent-topic diversity and three configurable discovery mixes.
- Optional review of up to three previously read facts per rolling seven days, without scores or pressure.
- Source-kind/qualified-claim labels, dated correction history, separate local content editor and a publication gate.
- Factual metadata includes citations, dates, verification state, difficulty, tags and freshness. Time-sensitive content is withheld after nextReviewAt. These initial records are evergreen.

The earlier native project's 112 candidate records were not fully source-audited. They are deliberately excluded from this release. The shipped set is smaller because a citation-shaped URL is not verification.

## Limits

This is a Home Screen web app, not an App Store binary. Native widgets, Live Activities and unlock interception are not implemented. Optional Web Push uses the separate Cloudflare Worker in `push/`; activation requires an individual pairing code and notification permission. Daily or three-times-daily delivery, selected weekdays, quiet hours, a week-long pause, delayed test and deletion are available in Preferences. The user confirmed receiving a notification on the iPhone after the previous delivery fix. New scheduling options are tested independently; they do not guarantee exact-time delivery. No LLM publishes content directly.

Push privacy: delivery address/keys, selected topics, time zone, schedule, sent-notification IDs and operational status leave the device when enabled. A separate unchecked consent option synchronizes encountered fact IDs and interests to reduce feed/push duplicates; it does NOT send reactions, bookmarks, collections or dwell times. Disabling that option deletes the server's read-ID list. Synchronization needs connectivity and is best effort, not a background read receipt. Registrations expire after 90 days unless preferences are saved again. Without read-sync consent, changed interests require saving notification settings again. Enrollment uses a short-lived hashed-IP rate-limit bucket, never a raw stored IP, deleted after ten minutes.

## Development and deployment

Node 24. `npm ci`, then `npm test`. `npm start` serves http://127.0.0.1:4173. These are developer steps only; users open the hosted URL.

GitHub Pages publishes the generated `docs/` directory from the main branch. After source edits, run tests and `npm run prepare:pages`, then commit both `dist/` and `docs/`. This uses the normal Pages branch deployment, without requesting extra GitHub workflow permissions. All URLs are relative for project subpaths.

`npm run test:browser` runs isolated mobile flows. Install the test engines with `npx playwright install chromium webkit`. On Windows the tests use installed Edge for Chromium. Tests never access an existing personal browser profile.

Sources and content review notes: `CONTENT_REVIEW.md`. Content editing and publication: `content/README.md`. Platform restrictions: `PLATFORM.md`.

## Notification service

`npm ci --prefix push`, then `node --test push/tests/push.test.mjs` runs the backend policy/security tests. `node tests/push-browser.mjs` tests notification UI in Chromium and WebKit with a local mocked transport (not physical delivery). The existing `npm test`, browser and update regression tests remain available.

Deployment configuration is `push/wrangler.jsonc`; D1 schema is `push/schema.sql`. Apply `push/migrations/0002_preferences.sql` once BEFORE deploying this worker; for a fresh database apply the base schema first. These are additive columns/tables and preserve existing device records. This deployment uses Workers Free and D1 Free, no paid services or billing activation. Preserve the VAPID secrets; do not rotate them without a subscription migration plan.

New registrations require a single-device invitation, valid for seven days. The existing registered iPhone does not need a new code. An authenticated operator runs `node push/create-invite.mjs PATH_TO_WRANGLER_JS --remote`; share its resulting code privately. It is not included in the public site. Existing registrations authenticate with their private device token. Legacy shared-code enrollment is disabled unless the operator explicitly sets `ALLOW_LEGACY_ENROLLMENT=true`; production leaves it unset. The personal sender remains capped at 20 devices / one scheduled send per minute, not a mass-market backend.

Validation: `npm test`, `node tests/browser.mjs`, `node tests/growth-browser.mjs`, `node tests/push-browser.mjs`, and `node tests/update.mjs`. Source availability: `npm run content:links` (network access required); an HTTP success is not factual verification.
