# iPhone installation and limits

The user has no Mac or paid Apple Developer membership. A static HTTPS Home Screen web app is the supported delivery route used here. The user adds it once in Safari. It then launches from its own icon; no local server or command is needed during use.

Apple: https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios

WebKit describes the standalone Home Screen experience and Web Push support:
https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/

Implemented: standalone manifest, iPhone icon, safe areas, offline app shell and content, browser-local state, export/restore, dark mode, RTL.

Not implemented: native iOS widgets, Live Activities or automatic unlock presentation. Scheduled Web Push uses a real server, not a browser timer. The onboarding cadence remains a personal target; notification frequency is an independent, explicit opt-in setting.

Offline availability requires the first successful online load and retained site storage. iOS may clear website data; the app offers a manual JSON backup. Hosting logs are controlled by the hosting provider; there is no app analytics, ad tracking or account.

The public GitHub repository and Pages bundle contain application code and curated content only. History and bookmarks are not uploaded. On opt-in, selected delivery topics and push registration data are sent privately to Cloudflare; they are never committed to GitHub.

Desktop WebKit tests are useful compatibility checks, not proof of an actual iPhone installation. Physical-device Home Screen installation and VoiceOver remain device checks.

## Lock Screen notifications · implemented 27 September 2026

Rechecked 26 September 2026 against Apple's [Web Push documentation](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers) and the WebKit article above. iOS 16.4+ supports visible Web Push for Home Screen web apps. No paid Apple Developer membership is needed. Permission must follow a direct user action. OS notification settings, Focus and preview settings control presentation; delivery is not an exact alarm and cannot force a custom unlock screen.

GitHub Pages only hosts static files. It cannot securely store device push subscriptions, hold a private VAPID signing key or run a delivery endpoint. Browser timers and service-worker background execution are not a substitute for an external sender.

The owner authorized the Cloudflare connection. A Worker, a D1 database and a once-per-minute scheduled handler are deployed. No billing method or paid plan was activated. VAPID keys and the personal enrollment code are stored in Cloudflare secrets; the public application contains only the API endpoint. Endpoint subscriptions are limited to 20 devices for this personal MVP. Scheduled invocations attempt one encrypted send each, bounding work on the Free plan. Quota exhaustion may interrupt service; no paid upgrade is performed.

Implemented: user-gesture permission; device bearer token stored locally and hashed at rest server-side; private enrollment code; daily 08:00–20:00 selection or 09:00/14:00/19:00 delivery; time-zone/DST conversion; delayed test with five-minute cooldown; source-gated fact payloads; app deep links; endpoint host validation and rejection of redirects; atomic claims preventing duplicate cron sends; cleanup of expired/revoked subscriptions; visible fallback for invalid/expired payloads. Unexpected delivery failures are retained as status and not counted as learned/read. No read receipt or analytics tracking is added.

Disabling notifications unsubscribes the browser and deletes the server record. If server deletion fails, the device token is retained for retry, while successful local unsubscription prevents further delivery. Clearing app progress attempts push deletion before erasing local state. Registrations expire after 90 days without saving delivery preferences again. If site data is manually cleared, the app cannot retain the device deletion token; browser/OS notification controls and automatic expiry remain available.

Changing interests or traveling does not silently upload updates: save notification preferences again to refresh topics and time zone. Notification sent history is separate from private feed reading history, so a notification can repeat a fact already read in the feed. Actual on-device permission, locked-iPhone presentation and tap-through still require the user's device check; desktop tests alone cannot establish that result.

Content updates activate a new, versioned offline cache after all required files are cached. Local profile storage is not cleared. Close and reopen the app after an online update; later releases also expose a Preferences update check.
