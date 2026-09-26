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

Physical iPhone installation, iPhone VoiceOver, push delivery and native iOS compilation were not tested. No claim of on-device verification is made.
