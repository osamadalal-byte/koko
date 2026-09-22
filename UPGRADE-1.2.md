# FORM 28 — continuous workout player (development draft)

Status on 2026-09-22: implementation prepared for upload. GitHub connectivity
has been restored; real-browser and video review are now queued. This document does not certify readiness for use.

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

## Evidence and blockers

- `npm test`: passed locally, including 280 plan timing cases, storage and backup
  checks, the playback gate, and simulated media integrated with the real clock.
- `npm run build`, `node tests/check-preview.cjs`, `npm run test:dist`: passed
  locally. Deployment assets and offline paths work over local HTTP at `/` and
  `/koko/`; this is not browser/offline/iPhone certification.
- `npm install` and `npx playwright install --with-deps chromium webkit`: blocked
  by HTTP 403 from the package registry. An attempt with the runtime's installed
  Playwright CLI also received HTTP 403 from the browser CDN.
- `npm run test:browser`: all six real-browser scenarios blocked before launch
  because Chromium/WebKit executables are absent. New simulated-media browser
  interactions are prepared but have not run. Previously passing v1.1 browser
  results do not verify v1.2.
- Live inline-video audit attempted: both engines blocked before launch. All
  18 clip entries are candidates, not visually approved demonstrations. Exact
  exercise variant, provider/author, cue point, duration, framing and actual
  iframe playback must be reviewed. No start time has been guessed.
- The Pages workflow now requires `npm run test:video-release`, which correctly
  fails while that evidence is missing. Do not remove this gate to publish.
- Earlier GitHub read calls failed before execution with HTTP 400
  `Invalid MCP request metadata`. Retrying restored access. PR #2 is confirmed
  unchanged at the source revision used by this draft:
  `feature/guided-experience`, commit
  `6700ef37bdb48f1a992c5a4b268cb221949c6b23`; it remains open and unmerged.

## Continuing verification

The CI workflow includes a real inline-video audit on Chromium and WebKit,
separate from deterministic interaction tests. It records actual media progress,
video identity and frame samples in `test-results/inline-video-audit/`. Watch the
complete clips as well as the samples: a playing iframe is not proof of a matching
human demonstration. Replace unsuitable candidates and record reviewed cue points
in `workout-videos.js`. Keep playback/visual evidence beside the review manifest.

Before publication, rerun all existing browser/build checks, review iPhone-size
screenshots, verify the 18 clips, and pass the release gate. After publication,
check the actual HTTPS `/koko/` URL and service-worker update. Physical iPhone
installation, real app switching/screen locking, sound and inline autoplay still
need device verification.

Implementation references: [YouTube IFrame API](https://developers.google.com/youtube/iframe_api_reference),
[YouTube embed parameters](https://developers.google.com/youtube/player_parameters),
[WebKit inline-video policies](https://webkit.org/blog/6784/new-video-policies-for-ios/).
