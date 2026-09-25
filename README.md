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
- 24 source-checked Hebrew cards, 33 extensible category definitions. Only populated topics are selectable.
- Factual metadata includes citations, dates, verification state, difficulty, tags and freshness. Time-sensitive content is withheld after nextReviewAt. These initial records are evergreen.

The earlier native project's 112 candidate records were not fully source-audited. They are deliberately excluded from this release. The shipped set is smaller because a citation-shaped URL is not verification.

## Limits

This is a Home Screen web app, not an App Store binary. Native widgets, Live Activities and unlock interception are not implemented. Cadence is labeled as a personal goal; this static version does not send notifications. Web Push would require an additional server delivery service and explicit permission. No LLM publishes content directly.

## Development and deployment

Node 24. `npm ci`, then `npm test`. `npm start` serves http://127.0.0.1:4173. These are developer steps only; users open the hosted URL.

GitHub Pages publishes the generated `docs/` directory from the main branch. After source edits, run tests and `npm run prepare:pages`, then commit both `dist/` and `docs/`. This uses the normal Pages branch deployment, without requesting extra GitHub workflow permissions. All URLs are relative for project subpaths.

`npm run test:browser` runs isolated mobile flows. Install the test engines with `npx playwright install chromium webkit`. On Windows the tests use installed Edge for Chromium. Tests never access an existing personal browser profile.

Sources and content review notes: `CONTENT_REVIEW.md`. Platform restrictions: `PLATFORM.md`.
