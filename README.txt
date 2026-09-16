FORM / 28 — Strength & mobility, release candidate 1.0.1-rc

USER GUIDE
See README-HE.md for the Hebrew guide. Open open-preview.html on a desktop to try the self-contained app. Normal iPhone use requires an HTTPS deployment; a local file preview is not an installed phone app.

CURRENT PLAN
Age 35; current ability unassessed; three strength sessions and one mobility session per week, no equipment. Strength sessions include five minutes of dynamic preparation and three minutes of cool-down, totaling about 18 minutes. The 15-minute preference shortens the main circuit and uses a two-minute cool-down. Mobility is 15 minutes. A three-session preference keeps the three strength sessions. Pausing and learning time are additional.

VIDEO GUIDANCE
The active plan has 18 movements, each with a human video resource, original written instructions and an easier option. Embedded YouTube demonstrations are loaded only after tapping Play. Other videos open on the provider's page. Warm-up resources cover multiple movements. Provider pages and available video associations were reviewed. Playback, human demonstration and exact filmed variants have NOT been verified in this environment. See test-results/video-audit.json. The breathing reference was replaced because the previous source described breath holding, unlike this app. Sources do not endorse this app. No third-party video files are redistributed.

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

The destination is https://github.com/osamadalal-byte/koko. It is a user-owned public repository; public upload was explicitly authorized. No repository visibility or billing settings were changed. The repository was initialized and the application is being uploaded on a release branch. Publication is not yet verified. The available connector has file/branch/commit/PR operations and workflow-run reads, but no Pages-settings or workflow-dispatch operation; no authenticated gh CLI is installed. See the actual GitHub Actions results and deployment status.

VALIDATION STATUS
PASSED: Node DOM integration checks across all 28 days and all five levels at both 15/20-minute and 3/4-session preferences; time limits; warm-up/cool-down; readiness; pause/auto-advance/resume; completion and feedback; profile edits; progress persistence; 18 populated video resources; preflight; cycle archival/reload/backup validation; recovery spacing; screen-awake lifecycle with mocks; service-worker scope, lifecycle and offline fallback with mocks; static asset references.
PASSED: dist HTTP asset/manifest checks at / and /koko/; clean asset allowlist; content-derived offline cache version. These are not browser or live HTTPS tests.
BLOCKED: npm install and npx browser installation returned HTTP 403 from registry.npmjs.org. The preinstalled Playwright 1.62.1 module is available, but engines are not. Its dependency installer failed on OS permissions and direct browser installation returned HTTP 403 from cdn.playwright.dev. Real Chromium/WebKit runs are blocked. See test-results/browser-results.json. The CI gate is prepared, not reported as passed.
PENDING: all real-browser runs, visual screenshots, exact video/variant playback checks, live HTTPS checks, and physical iPhone installation, scrolling/touch, screen-awake behavior, background/resume and offline workouts. Browser emulation will not establish physical-device behavior.

CHANGES IN THIS CONTINUATION
- Prevent mixed-release HTML and cached scripts.
- Remove stale generated files and version caches from content.
- Add root/subpath deployment-artifact checks.
- Extend browser tests to narrow widths, written instructions for all 18 moves, timer/pagehide, downloaded backup/file-input restore, and offline exercise UI.
- Add preview and artifact gates to the manual Pages workflow.
- Add provider-page fallbacks and a per-movement video audit.
Existing localStorage key, data version, program, feedback, backup and cycle archive remain compatible.

The specific schedule and coaching rules are original starter programming, not an NHS, Hinge Health or HSS training program. A longer-term strength phase should use actual results and an updated assessment; pulling resistance is limited without equipment.
