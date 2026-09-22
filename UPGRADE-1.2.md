# FORM 28 — continuous workout player

The 1.2 upgrade is uploaded in PR #2 and is ready for publication review. It is
not merged or deployed. The existing HTTPS site remains on the previous release.

## The workout experience

Choose a training day and complete the existing short readiness check. Warm-up,
exercise and recovery intervals, cool-down and feedback then share one screen.
Human video, a large timer, phase progress, next movement, Pause, Skip and
expandable technique instructions stay inside the workout. There are no provider
page redirects in this flow.

Each selected demonstration repeats until its interval ends. The timer advances
only when media time advances, and pauses for loading, buffering, errors, explicit
pause or backgrounding. Returning to the app requires Resume. This also handles
Safari seeking without a new PLAYING event. Old players cannot restart a later
interval. Skipping still records a partial session.

Playback starts muted; the user can enable video sound. Browser policy can require
an extra tap. If video is unavailable or the device is offline, written guidance
is an explicit option in the same screen. Videos are streamed from public Hinge
Health, NHS and Physitrack sources, not downloaded into the app or offline cache.

The original readiness and recovery-spacing checks, conservative load adaptation,
15/20-minute guided budgets, three strength sessions plus optional mobility,
local progress, saved drafts, backup/restore, favorites and cycle archive remain.
Pauses, learning and media loading add to elapsed wall-clock time.

## Verification

At runtime revision `42a63b1fac13daa33ea4f12ce23c4686713fc546`, both
[push validation](https://github.com/osamadalal-byte/koko/actions/runs/35719375473)
and [PR validation](https://github.com/osamadalal-byte/koko/actions/runs/35719378548)
passed:

- Dependency and Chromium/WebKit installation in GitHub Actions.
- Node tests, including 280 timing plans, coaching, persistence, backup validation,
  media/clock integration and stale-event/background handling.
- All six browser scenarios: Chromium and WebKit iPhone emulation against source,
  built root and `/koko/`. Narrow layouts, scrolling, controls, settings, progress,
  backup/restore and actual service-worker offline loading passed. Media doubles
  in this deterministic suite are explicitly labeled; they do not certify videos.
- The separate real-provider audit passed all 18 movements in both engines:
  advancing media and workout time, Pause/Resume, reviewed start points and loops.
  A short automatic warm-up/work/rest/cool-down sequence also reached feedback
  without leaving the screen. It used real media, not simulated player events.
- Build, standalone preview, deployment allowlist, manifest/icon/script paths and
  content-derived service-worker revision checks passed at both `/` and `/koko/`.

[Saved browser report](validation/player-2026-09-22/browser-results.json) and
[video review/playback evidence](validation/player-2026-09-22/video-review.json)
record the source revision and observations. Visual review used rendered browser
frames sampled every two seconds and at excerpt boundaries. It is not a physical
phone test, full audio review or clinical assessment. All 18 selected excerpts
show the intended human movement. The knee push-up ends before the harder floor
variation; the chest stretch ends before the source's incorrect-form example.

`npm run test:video-release` binds each approval to its variant, URL, exact
start/end positions, actual Chromium/WebKit pause/resume/loop evidence and both
completed phase flows. It runs in CI and before Pages publication. Publication
also repeats the real media audit. Initial YouTube/Vimeo sign-in, privacy and
connection failures were replaced with different public provider sources; no
access restrictions were bypassed.

The scratch environment cannot download browser binaries (HTTP 403). Real
browser results above come from GitHub Actions. Local Node/build/preview/dist and
release-evidence checks pass independently.

## Publication and remaining device checks

The connected tools cannot dispatch the manual Pages workflow. Merge PR #2 and
run **Actions → Test and publish FORM 28 → Run workflow → main**. No repository
visibility or paid-service change is needed.

The workflow now includes a post-publication job that compares live bytes with
`dist`, verifies HTTPS and the manifest/service-worker scope and cache, exercises
the deployed player and saved draft, checks Chromium offline fallback, and runs
all 18 video checks again on the actual HTTPS origin. This new live-site job has
not run for 1.2 yet. Its success is required before claiming verified deployment.

On a physical iPhone, check Add to Home Screen, one complete workout, sound,
switching apps, screen locking, and airplane-mode written guidance. WebKit
emulation does not prove those device behaviors. Provider availability may change.

Implementation references: [WebKit inline-video policy](https://webkit.org/blog/6784/new-video-policies-for-ios/),
[Brightcove dynamic players](https://player.support.brightcove.com/code-samples/brightcove-player-sample-loading-player-dynamically.html),
[HLS.js](https://github.com/video-dev/hls.js),
[Mux public MP4 renditions](https://www.mux.com/docs/guides/enable-static-mp4-renditions).
