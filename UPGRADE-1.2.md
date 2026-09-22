# FORM 28 — continuous workout player (development draft)

Status on 2026-09-22: the continuous player is uploaded to PR #2. The application
checks pass in real Chromium and WebKit. Provider playback and visual movement
review are still in progress; the upgrade is not deployed.

## What changed

Selecting an unfinished training day enters the existing readiness check. After
that one check, the workout opens directly in a single full-screen player:
warm-up → exercises and recovery intervals → cool-down → saved feedback.

The current human video, large timer, next movement, phase progress and technique
notes share the same screen. There is no provider-page redirect in this flow.
Demonstrations repeat within their timed interval; ending a video does not skip
the movement. The original plan still determines interval lengths and workload.

The timer waits for the player's PLAYING event and pauses on buffering, autoplay
refusal, media failure, explicit pause or backgrounding. Foregrounding requires
a deliberate resume. Old or destroyed players cannot restart another interval.
Skip continues the sequence when it was running and still records a partial
session. Video starts muted for inline autoplay; sound can be enabled. Browser
policy may require an additional tap. Ads or provider restrictions can still
interrupt externally hosted videos.

Written guidance is an explicit fallback for offline or failed media. It remains
in the workout screen and never pretends to be a human video. Existing readiness,
recovery spacing, workload adaptation, saved drafts, backup/restore, cycle history,
voice settings and 15/20-minute planned budgets remain in place. Pauses and media
loading add to wall-clock time.

## Evidence and remaining work

- `npm test` passes, including 280 plan timing cases, data and backup checks,
  media/clock integration, background pause, and stale media callback handling.
- The GitHub Actions `validate` jobs passed at
  `ce4c3e398de88964133911cb4171871ec69134f1`: dependency installation, Chromium
  and WebKit installation, all six source/dist/subpath browser scenarios, build,
  standalone preview and deployment asset checks. The browser suite covers narrow
  layouts, settings, progress, backup/restore and actual service-worker offline
  navigation. Its deterministic media API scenarios are explicitly simulated.
- Separately, real provider playback at that revision passed for 13 movements
  in Chromium, including Pause/Resume and actual media-time advancement.
  Some Vimeo sources refused embedding, and YouTube required sign-in in CI.
  Those failures are recorded; they are not bypassed or counted as passing.
- The candidate catalog at `1627c73719781048eb19680f7543ca994ea00f45` uses public
  Hinge Health streams, NHS Brightcove embeds and a public Physitrack MP4.
  All 18 replacements are undergoing playback and frame review in the app.
- The local scratch environment cannot download browser binaries (HTTP 403).
  Real-browser results come from GitHub Actions, not local browser execution.
- `npm run test:video-release` intentionally fails until every movement has
  exact-variant, reviewed cue-point and Chromium/WebKit playback evidence.
  The release check binds evidence to the current URL and excerpt bounds.
- The existing live site remains on `main`; this feature branch is not merged.
  Pages publication remains a manual workflow with all validation gates intact.

## Continuing verification

The CI workflow includes a real inline-video audit on Chromium and WebKit,
separate from deterministic interaction tests. It records actual media progress,
video identity and frame samples in `test-results/inline-video-audit/`. Review the
complete selected demonstration excerpts as well as the samples: a playing iframe is not proof of a matching
human demonstration. Replace unsuitable candidates and record reviewed cue points
in `workout-videos.js`. Keep playback/visual evidence beside the review manifest.

Before publication, rerun all existing browser/build checks, review iPhone-size
screenshots, verify the 18 clips, and pass the release gate. After publication,
check the actual HTTPS `/koko/` URL and service-worker update. Physical iPhone
installation, real app switching/screen locking, sound and inline autoplay still
need device verification.

Implementation references: [YouTube IFrame API](https://developers.google.com/youtube/iframe_api_reference),
[YouTube embed parameters](https://developers.google.com/youtube/player_parameters),
[WebKit inline-video policies](https://webkit.org/blog/6784/new-video-policies-for-ios/),
[Brightcove dynamic players](https://player.support.brightcove.com/code-samples/brightcove-player-sample-loading-player-dynamically.html),
[HLS.js](https://github.com/video-dev/hls.js),
[Mux public MP4 renditions](https://www.mux.com/docs/guides/enable-static-mp4-renditions).
