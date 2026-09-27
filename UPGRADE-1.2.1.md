# FORM 28 1.2.1 — keep every exercise video in the app

The guided workout in 1.2.0 used inline video, but the exercise library and workout-preflight cards still called an older detail dialog. That dialog offered external NHS, YouTube and other provider links. The earlier playback audit only exercised the timed workout, so it missed this user-facing route.

All current exercise guides now use the same reviewed media and exact excerpts as the timed workout. Opening a card plays the human demonstration inside its guide, with Pause, Replay and sound controls. Demonstrations repeat within their reviewed boundaries. External watch buttons and the old YouTube iframe are absent from these guides. Provider credits remain visible.

The preview controller is separate from workout timing and persistence. Closing a guide disposes its media; switching away pauses it. A failed or offline video leaves the written technique and easier option available in the app. Existing progress, unfinished workouts, favorites, backups, profiles and cycle history retain their data formats.

Validation required before release:
- Existing 280 plan scenarios, timer/persistence tests, service-worker tests, build, standalone preview and deployment-artifact checks.
- Six Chromium/WebKit application scenarios, including all 18 guide entry points, the preflight route, viewport fit, no external watch links/popups, and media cleanup.
- Actual provider playback in both Chromium and iPhone-style WebKit for all 18 workout clips AND all 18 exercise previews. Preview checks cover pause, replay, excerpt looping, cleanup, unchanged saved progress and no navigation away from the app.
- The manual Pages workflow retains its build/test/video gates and post-publication HTTPS, deployed-byte, service-worker and live media verification.

The media URLs and reviewed exercise variants are unchanged from 1.2.0. Existing exact-variant evidence still applies; the new browser runs validate the additional player surface. Videos require internet. Physical iPhone autoplay, sound, app switching and installation require a device check.

Publication: merge the reviewed fix, then run **Test and publish FORM 28** on `main`. A pushed branch is not a deployed release. After publication, fully close and reopen the installed app so it can load the new offline cache; refresh outside a workout if the old interface remains. Do not clear browser data to update, because that would erase locally saved progress.
