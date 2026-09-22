# FORM / 28

A personal strength and mobility PWA with three weekly strength sessions and an optional mobility session. The conservative starting plan includes warm-up and cool-down within a 15/20-minute guided budget. Pauses and video loading add time.

The **1.2 continuous-player upgrade** is in [PR #2](https://github.com/osamadalal-byte/koko/pull/2). It is not deployed yet. The [existing app](https://osamadalal-byte.github.io/koko/) remains on the earlier release until this upgrade is merged and published.

Choose a training day, complete the short readiness check, and follow warm-up, exercise/rest and cool-down videos in one screen. The timer, next movement, Pause, Skip and technique instructions stay beside the video. Progress, feedback, backups and cycle history remain local to your browser; there is no account or cloud synchronization.

- [Upgrade details and verification status](UPGRADE-1.2.md)
- [Hebrew guide](README-HE.md)
- [Build details](README.txt)

## Check the release

Use Node 20 or later:

```sh
npm install
npm test
npx playwright install --with-deps chromium webkit
npm run test:browser
npm run build
node tests/check-preview.cjs
npm run test:dist
node scripts/audit-inline-videos.cjs
npm run test:video-release
```

The browser suite runs Chromium and WebKit at the source root, built root and `/koko/`, covering narrow layouts, controls, progress, backup/restore and actual service-worker offline loading. Its simulated media scenarios are explicitly labeled. The separate inline audit plays every real provider clip, checks media/clock pause and resume, loops each selected excerpt, and completes an automatic warm-up/work/rest/cool-down sequence.

The release gate requires visual-review evidence and matching real-browser playback records for the exact URLs, variants and excerpt boundaries. WebKit iPhone emulation is not a physical iPhone test. Videos require internet; explicit written guidance remains available offline.

## Publish

Merge [PR #2](https://github.com/osamadalal-byte/koko/pull/2), then open **Actions → Test and publish FORM 28 → Run workflow → main**. Pages is already configured for this repository. The connected tools can upload commits but cannot dispatch this manual workflow.

The workflow publishes only `dist/` after the release checks pass. A separate post-publication job compares every deployed file with the build, checks HTTPS, the manifest and service-worker scope/cache in Chromium and WebKit, and repeats the real video audit on the live `/koko/` origin. Publication is not fully verified until that job passes.

On iPhone: open the HTTPS app in Safari → Share → Add to Home Screen → Open as Web App (if shown) → Add. Open online first. After an upgrade, close and reopen the app to load the new installed release. Keep a JSON backup of important progress.

External video sources do not endorse this app. Third-party video files are streamed from their public providers and are not bundled, rehosted or cached for offline use.
