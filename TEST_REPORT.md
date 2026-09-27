# Validation performed · 26 September 2026

13 Node regression tests passed, including minimum four cards per selectable topic, distinct titles, beginner AI wording, 100 randomized first-card selections for each selectable category, full-library nonrepetition, explicit review, idempotent reactions, reversible saves, storage round trips/failures, expired content, malformed input, and streak expiration.

Four complete isolated mobile browser journeys passed:

| Engine | Viewport | Result | Connectivity test |
| --- | --- | --- | --- |
| Chromium / Edge | 390 × 844 | Passed | Offline emulation and reload |
| Chromium / Edge | 320 × 740 | Passed | Offline emulation and reload |
| Playwright WebKit 26.6 | 390 × 844 | Passed | Reload with the isolated HTTP origin stopped |
| Playwright WebKit 26.6 | 320 × 740 | Passed | Reload with the isolated HTTP origin stopped |

Each journey covers onboarding, first-interest match, changing reactions, bookmark save, persistence after reload, source dialog, progress, dark mode, cancellation of interest edits, the complete 62-card sequence, explicit review, cancelled deletion, cached reload, absence of horizontal overflow, and absence of JavaScript runtime errors.

An additional Chromium migration test (`node tests/update.mjs`) serves the exact previous published commit, creates a bookmark and reaction, activates the new service worker, reloads the app and confirms that interests, bookmarks and the reaction survive. It also exercises the Preferences update button and reads the expanded cache offline. Passed. This uses isolated test state, not the user's personal browser.

The first browser test failed because a selector counted related cards inside a closed dialog as well as saved cards. The selector was scoped to the visible main view.

WebKit offline emulation initially failed with an internal engine error. This matches the confirmed Playwright 1.63 issue [#42775](https://github.com/microsoft/playwright/issues/42775), including failure even for service-worker responses requiring no network. The WebKit connectivity test therefore stops the actual local test origin. This is recorded as origin unavailability, **not** equivalent to full offline emulation. Chromium's offline emulation passed.

Physical iPhone installation, iPhone VoiceOver, delivery to a locked iPhone and native iOS compilation were not tested. No claim of on-device verification is made.

## Push release · 27 September 2026

- 25 Node tests passed: 13 app tests plus 12 backend/helper tests. Coverage includes SSRF host checks, malformed keys, permission/owner separation, pairing, cross-origin rejection, time zones including DST and quarter-hour offsets, test cooldown, atomic scheduling, expired endpoints, encryption/signing and safe click URLs.
- Four complete app journeys passed again on Chromium and WebKit at two mobile widths; upgrade from the previous published version preserved bookmarks/reactions.
- Two notification UI journeys passed, using mock browser subscription APIs and an isolated HTTP test backend. They exercise permission during a real click, invalid code, selected-topic-only payload, preference persistence, delayed test, rate-limit feedback, deletion and fact deep links. Chromium also verifies offline deep-link reload.
- The initial WebKit test harness failed because its request interception did not handle a cross-origin preflight like Chromium; its request reached the real service, which correctly rejected the localhost origin. Moving the mock to an isolated same-origin HTTP test server resolved the harness issue without relaxing production CORS.
- Private signing keys were generated and piped directly to Cloudflare secrets; no private key file was created in the repository.
- A live scheduled synthetic-endpoint probe caught a Workers-specific `fetch` incompatibility: `redirect: 'error'` is not supported at the edge. Changed it to `manual`; 3xx responses are failures and are never followed, preserving endpoint/credential isolation. Unit tests now assert this mode and independently decrypt the generated payload and verify the VAPID signature.

Synthetic service tests and desktop tests are not proof of end-to-end iPhone delivery. The final acceptance step is user-initiated activation followed by “בדיקה בעוד דקה”, locking the iPhone, receiving the notification and tapping it.
