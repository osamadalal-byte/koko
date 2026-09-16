FORM / 28 — Strength & mobility, release candidate 1.0.1-rc

USER GUIDE
See README-HE.md for the Hebrew guide. Open open-preview.html on a desktop to try the self-contained app. Normal iPhone use requires an HTTPS deployment; a local file preview is not an installed phone app.

CURRENT PLAN
Age 35; current ability unassessed; three strength sessions and one mobility session per week, no equipment. Strength sessions include five minutes of dynamic preparation and three minutes of cool-down, totaling about 18 minutes. The 15-minute preference shortens the main circuit and uses a two-minute cool-down. Mobility is 15 minutes. A three-session preference keeps the three strength sessions. Pausing and learning time are additional.

VIDEO GUIDANCE
The active plan has 18 movements, each with a linked video resource, original written instructions and an easier option. Embedded YouTube demonstrations are loaded only after tapping Play. Other videos open on the provider's page. Warm-up resources cover multiple movements. Provider pages and available video associations were reviewed. All 14 source pages opened in Chromium, and playback was observed on 7 pages. Sampled frames were visually inspected, but the full set of exact exercise variants is NOT verified. YouTube playback was blocked by sign-in/bot verification in CI. The breathing video combines a clinician presenter and diagrams rather than a full-body demonstration. See validation/github-2026-09-16/video-observations.json. The breathing reference was replaced because the previous source described breath holding, unlike this app. Sources do not endorse this app. No third-party video files are redistributed.

The current plan uses a supported heel slide for the starting core exercise and a curated set of warm-up/mobility movements with video resources. Old exercise definitions remain only for compatibility with saved records. Legacy generated video clips are excluded from the release package.

ADAPTATION AND HISTORY
Readiness reduces workload when energy is low or soreness is mild. Current pain or soreness affecting everyday movement blocks a session. Three full, non-lighter strength sessions marked easy at the current level allow a small increase. Hard sessions lower the level down to the baseline. Short and partial sessions do not advance difficulty. Changing push-up variation resets the baseline. Feedback rules are local and do not assess technique or interpret free-text health notes.

Completed 28-day cycles can be archived and restarted at the current level. Up to 12 cycles are retained; replacing the oldest needs confirmation. Export/Import includes cycle history. Recovery spacing is checked across cycle boundaries. Progress is browser-local, with no cloud account, synchronization, push notification or coach monitoring.

BUILD AND TEST
Node 20+ is required only for build/test tooling; the deployed app is static HTML/CSS/JavaScript.
  npm install
  npm test
  npx playwright install --with-deps chromium webkit
  npm run test:browser
  npm run build
  node tests/check-preview.cjs
  npm run test:dist

The build replaces generated dist/ using an explicit asset allowlist, derives the service-worker cache version from asset contents, and updates open-preview.html. Browser tests build first and cover source root, dist root and dist under /koko/. The service worker keeps HTML and scripts on the same installed release. Publish the contents of dist/, not the source root. There are no secrets or server-side components.

DEPLOYMENT
The included .github/workflows/pages.yml is a manual GitHub Actions workflow. It runs the logic checks and Chromium/WebKit browser checks before publishing dist/ to GitHub Pages.
1. Connect an authorized GitHub account and choose/create a repository.
2. Put this folder's CONTENTS at the repository root, including .github/.
3. In repository Settings > Pages, choose GitHub Actions as the source.
4. Run “Test and publish FORM 28” from Actions.
5. Use the deployment URL returned by GitHub. If a test fails, deployment stops; fix the failure before rerunning.

The destination is https://github.com/osamadalal-byte/koko. It is a user-owned public repository; public upload was explicitly authorized. No repository visibility or billing settings were changed. The repository was initialized and the application has been uploaded on feature/form28-release; PR #1 is open. Automatic approval review rejected an auto-merge attempt because public upload approval was not considered authorization to merge the default branch. Publication is not yet verified. The available connector has file/branch/commit/PR operations and workflow-run reads, but no Pages-settings or workflow-dispatch operation; no authenticated gh CLI is installed. See the actual GitHub Actions results and deployment status.

VALIDATION STATUS
PASSED: Node DOM integration checks across all 28 days and all five levels at both 15/20-minute and 3/4-session preferences; time limits; warm-up/cool-down; readiness; pause/auto-advance/resume; completion and feedback; profile edits; progress persistence; 18 populated video resources; preflight; cycle archival/reload/backup validation; recovery spacing; screen-awake lifecycle with mocks; service-worker scope, lifecycle and offline fallback with mocks; static asset references.
PASSED: dist HTTP asset/manifest checks at / and /koko/; clean asset allowlist; content-derived offline cache version. These are not browser or live HTTPS tests.
PASSED: all six Chromium/WebKit browser scenarios on macOS in GitHub Actions run 35104289642, including actual disconnected-origin reload, timer, written guidance and saved progress. The same expectations apply to both engines. A standalone worker reproduced WebKit's Playwright offline-emulation error; see tests/offline-probe.cjs and validation/github-2026-09-16/offline-diagnostic.json. Actual origin disconnection was verified with a failing uncached request. Browser offline events are also checked. Physical airplane mode is a separate check.
PASSED: dependency/browser installation, npm test, npm run test:browser, npm run build, node tests/check-preview.cjs and npm run test:dist in GitHub Actions. Local installation was blocked by HTTP 403; the historical local reports are retained separately.
PENDING: complete video/variant verification, live HTTPS checks, and physical iPhone installation, touch, screen-awake behavior, background/resume and airplane-mode workouts. Browser emulation does not establish physical-device behavior. No live app URL is verified.

CHANGES IN THIS CONTINUATION
- Prevent mixed-release HTML and cached scripts.
- Remove stale generated files and version caches from content.
- Add root/subpath deployment-artifact checks.
- Extend browser tests to narrow widths, written instructions for all 18 moves, timer/pagehide, downloaded backup/file-input restore, and offline exercise UI.
- Add preview and artifact gates to the manual Pages workflow.
- Add provider-page fallbacks and a per-movement video audit.
Existing localStorage key, data version, program, feedback, backup and cycle archive remain compatible.

The specific schedule and coaching rules are original starter programming, not an NHS, Hinge Health or HSS training program. A longer-term strength phase should use actual results and an updated assessment; pulling resistance is limited without equipment.
