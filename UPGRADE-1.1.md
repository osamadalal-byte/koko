# FORM 28 · Guided experience upgrade

This upgrade responds to the request for an experience closer to a polished coaching app such as BetterMe. FORM 28 keeps its own design, program and local data. It does not include BetterMe's proprietary videos, brand, meal plans or account services.

## Changes

- A redesigned Today screen with a prominent workout action, seven-day plan strip, real weekly completion goal and warm-up / main session / cool-down previews.
- A three-step setup for goals, current activity and available time. Cancelling discards unsaved choices. Changing activity resets to the easiest baseline; it does not infer fitness.
- An exercise library with search, body-focus filters and saved favorites.
- Optional spoken interval announcements using the browser's speech API. Cues stop on pause or backgrounding. Availability and voice quality depend on the device.
- A progress dashboard showing actual logged minutes, weekly activity and earned milestones. No estimated calories or fabricated progress.
- Existing readiness checks, conservative workload rules, timers, feedback, measurements, cycle archives and local backups remain available.
- Backups from the existing version remain accepted. New backups include setup, favorites and voice preferences. Existing unfinished sessions keep their saved intervals.

## Verification

Local Node checks, all 280 timing scenarios, service-worker checks, build, standalone preview and release asset checks pass. Browser verification runs in GitHub Actions because browser engines cannot be downloaded into the local workspace.

The existing six Chromium / WebKit scenarios remain required. Added checks cover setup cancellation and persistence, exercise search / filters / favorites, migration from older backups, and spoken-cue API lifecycle. Audible speech is a physical-device check. The test DOM fixture now dispatches multiple listeners per event, matching browser behavior; existing assertions were retained.

External video playback remains partially verified as described in VALIDATION-HE.md. The new colored library tiles are category icons, not demonstrations. Physical iPhone installation, backgrounding, screen locking and voice quality still require device verification.

## Publication

The current live app is https://osamadalal-byte.github.io/koko/ . This upgrade is prepared on `feature/guided-experience` for review. After merging the upgrade, run **Test and publish FORM 28** on `main`. The build adds the two new experience assets to the scoped offline cache and generates a fresh cache revision.

Back up progress before updating. Reopen the app online to allow the service worker to install the new release; if the older interface remains visible, close the app and open it again. Local progress is not cleared during the update.
