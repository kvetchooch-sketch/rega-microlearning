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
