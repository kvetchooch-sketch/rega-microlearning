# iPhone installation and limits

The user has no Mac or paid Apple Developer membership. A static HTTPS Home Screen web app is the supported delivery route used here. The user adds it once in Safari. It then launches from its own icon; no local server or command is needed during use.

Apple: https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios

WebKit describes the standalone Home Screen experience and Web Push support:
https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/

Implemented: standalone manifest, iPhone icon, safe areas, offline app shell and content, browser-local state, export/restore, dark mode, RTL.

Not implemented: native iOS widgets, Live Activities, automatic unlock presentation, or scheduled notifications. This static build does not pretend a browser timer can deliver reminders while the app is closed. The cadence choice is explicitly a personal target.

Offline availability requires the first successful online load and retained site storage. iOS may clear website data; the app offers a manual JSON backup. Hosting logs are controlled by the hosting provider; there is no app analytics, ad tracking or account.

The public GitHub repository and Pages bundle contain application code and curated content only. Personal interests/history/bookmarks are never committed or uploaded by the app.

Desktop WebKit tests are useful compatibility checks, not proof of an actual iPhone installation. Physical-device Home Screen installation and VoiceOver remain device checks.

## Lock Screen notifications: remaining deployment dependency

Rechecked 26 September 2026 against Apple's [Web Push documentation](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers) and the WebKit article above. iOS 16.4+ supports visible Web Push for Home Screen web apps. No paid Apple Developer membership is needed. Permission must follow a direct user action. OS notification settings, Focus and preview settings control presentation; delivery is not an exact alarm and cannot force a custom unlock screen.

GitHub Pages only hosts static files. It cannot securely store device push subscriptions, hold a private VAPID signing key or run a delivery endpoint. Browser timers and service-worker background execution are not a substitute for an external sender.

Proposed opt-in backend: Cloudflare Worker + private subscription storage + scheduled delivery. It requires the owner's Cloudflare account authorization, which is not available in this workspace. The user has been asked whether they have or want a free account. No account, paid service, subscription endpoint or sending schedule has been created. Do not claim push works yet.

Implementation after authorization: user-gesture permission and subscription; public VAPID key only in client, private key in server secrets; authenticated subscription management and deletion; frequency/quiet-hours preferences; reviewed-fact-only payloads and deep links; endpoint validation/rate limits; expired-subscription removal; visible notification for each push; real locked-iPhone delivery and tap-through test. Do not upload learning history or bookmarks. Disclose that selected delivery topics and a device delivery address must leave the device if personalized push is enabled.

Content updates activate a new, versioned offline cache after all required files are cached. Local profile storage is not cleared. Close and reopen the app after an online update; later releases also expose a Preferences update check.
