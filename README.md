# FORM / 28

A no-equipment strength and mobility PWA: three strength sessions plus an optional mobility session each week. Guided sessions include preparation and stretching within a 15–20 minute limit. The starting workload is conservative and changes with readiness and workout feedback.

**Release candidate — not yet deployed or fully verified.** Progress stays in this browser, with JSON backup/restore and a cycle archive. There is no account or cloud synchronization. External video guides require internet.

- [Hebrew guide](README-HE.md)
- [Build and deployment details](README.txt)
- [Validation record and limitations](VALIDATION-HE.md)
- [Local validation evidence](validation/local-2026-09-16/)

## Run the checks

Use Node 20 or later:

```sh
npm install
npm test
npx playwright install --with-deps chromium webkit
npm run test:browser
npm run build
node tests/check-preview.cjs
npm run test:dist
```

`test:browser` builds and checks Chromium and WebKit at source root, built root and `/koko/`, including narrow layouts, timer, backup/restore and offline use. WebKit iPhone emulation is not a physical device test. External video playback is a separate check.

All six browser scenarios and the build/Node/artifact checks passed in [GitHub Actions](https://github.com/osamadalal-byte/koko/actions/runs/35104289642). Offline loading uses a genuinely disconnected origin plus a failing uncached-request assertion; an independent control reproduces WebKit’s Playwright offline-emulation error. See [the evidence](validation/github-2026-09-16/). Local engine-installation failures are retained as historical records. Full video matching and physical iPhone checks remain incomplete.

## Publish

The **Test and publish FORM 28** workflow is manual and publishes only `dist/`, after all checks pass. Merge [PR #1](https://github.com/osamadalal-byte/koko/pull/1), then in Settings → Pages select GitHub Actions as the source and run that workflow on main. The connected tools cannot configure Pages or dispatch the workflow; automatic approval review rejected auto-merge. Use the URL reported by a successful deployment; no live URL has been verified yet.

On iPhone, open the deployed HTTPS URL in Safari → Share → Add to Home Screen → Open as Web App (if shown) → Add. First open online and wait for the offline-ready message. Videos are not stored offline.

The workout content and feedback rules are an original starter plan. External sources do not endorse the app. No third-party video files are redistributed.
