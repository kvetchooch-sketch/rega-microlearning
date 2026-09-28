# Validation performed · 26 September 2026

This report preserves chronological results. See the final section for the current release and the user's later iPhone-delivery confirmation.

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
- After deployment, the real scheduled Worker reached Apple's push service using an intentionally invalid synthetic endpoint and recorded its HTTP 400 rejection. The scheduled invocation completed without runtime exceptions; the synthetic registration was deleted. This verifies the scheduler/encryption/transport path, not successful delivery to a real device.
- Published GitHub Pages release `504a659` passed live Chromium and WebKit checks: onboarding, reactions, bookmarks, persistence, sources, notification settings and cross-origin public push configuration. Chromium also passed cached offline reload. One initial check waited for first-load service-worker control and timed out; explicitly reloading after registration readiness passed on rerun.

Synthetic service tests and desktop tests are not proof of end-to-end iPhone delivery. The final acceptance step is user-initiated activation followed by “בדיקה בעוד דקה”, locking the iPhone, receiving the notification and tapping it.

## Apple delivery correction · 27 September 2026

The first real-device attempt was rejected with HTTP 400. The sender was passing the UI notification tag (`rega-test` / `rega-fact`) unchanged as the optional Web Push Topic header; these are not canonical base64url values. Removed that optional header without changing the visible notification tag. Added allowlisted Apple protocol error diagnostics, never raw response bodies or device identifiers, while preserving numeric 404/410 cleanup behavior. All 26 tests pass, including regression assertions for the omitted header and safe diagnostics. After deploying the correction and requeuing one failed test, the real registration reports `test_accepted`: the provider accepted the push. Device display and tapping still require user confirmation. A subsequent user-requested test was observed queued separately; no extra retry was added.

## Growth release · 28 September 2026

- The user subsequently confirmed that the iPhone notification appeared. No new physical-device test is claimed for this release.
- 37 Node regression tests pass, including source publication gates, 250 source-checked cards / 20 populated categories, precise timestamp formatting, backward-compatible backups, collections, weekly review limits, less-topic behavior, opt-in read synchronization, read-ID erasure, selected weekdays/quiet times/pause, single-device invitations and enrollment throttling.
- Four complete 250-card browser journeys pass (Chromium and WebKit, each at 390px and 320px): no normal-feed repeats, reaction/bookmark persistence, sources, preference changes, explicit review, cancelled deletion, dark mode and cached reload. Chromium uses offline emulation; WebKit tests an unavailable isolated origin because of the previously documented emulator issue.
- Two additional growth journeys pass: search/category/collection intersections, HTML-safe names, collection membership/removal without losing saved facts, discovery controls, backup download and restore, invalid-backup rejection, optional review completion, correction history and local-editor draft approval gate.
- Two mocked notification journeys pass: direct-gesture permission, error states, selected weekdays, quiet hours, pause/resume, opt-in sync payload limited to IDs/topics, reload, deletion and deep links. Expected 403/429 responses exercise rejection/rate-limit UI; they are not runtime failures.
- Upgrade from the exact published commit `a4c5428` passes with bookmarks, interests and reactions retained, then offline reload. Old raw backups and the new versioned envelope are both supported.
- Bugs found and fixed during these runs: calendar dates at Israel midnight were initially future UTC dates; the existing display formatter initially rejected full ISO timestamps and stopped rendering some cards. Added dual-format regression tests and repeated the complete browser sweeps. A within-pool weight alone did not sufficiently reduce a sole preferred topic; excluded downweighted topics from the personalized pool. The pending notification status now clears the prior success message to prevent a stale-success indication during saves.
- The source audit checked 88 original URLs and found three unavailable NIST paths. Claims were re-reviewed against alternative official pages and the corrections logged. All alternatives are reachable through the research browser; ISO returns 403 to the automated fetch checker (bot protection), so that URL remains a manual-availability check, not a dead-link assertion. HTTP success does not verify content.
- Production D1 additive migration applied once, preserving the existing device. Worker release `1836968b-4dfa-49a3-bb8b-a368295199b9` deployed with the existing VAPID keys and Free-plan configuration.
- A live API smoke test created a temporary synthetic subscription with its own single-use invite, verified schedule/pause, consent sync, disabling consent and deletion, then removed both test rows. It did not request or send a notification and did not modify the user's registration.
- GitHub Pages release `6423fba` built successfully. Independent live Chromium and WebKit checks passed: 250-card content version, onboarding, personalized first card, reactions/bookmarks after reload, source details, discovery controls, saved search, and public push configuration/CORS. Chromium also passed offline reload. The production database still has exactly the original one device, with no shared read history enabled automatically. The public GitHub issue form was enabled for voluntary in-app content reports; nothing is submitted without the user's action.

Remaining boundaries: no full physical-device VoiceOver audit, no native binary/widgets/Live Activities, no exact-time push guarantee, no paid infrastructure or automatic factual re-verification. The pack is 250 reviewed cards rather than filling the proposed 300–500 range with unverified material.
