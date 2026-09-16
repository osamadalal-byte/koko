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

The local Node and static HTTP checks passed. Local browser execution was blocked by missing engines and denied downloads. The **Validate FORM 28** workflow runs the full checks on GitHub; consult its actual result rather than treating the prepared workflow as a pass.

## Publish

The **Test and publish FORM 28** workflow is manual and publishes only `dist/`, after all checks pass. In Settings → Pages, select GitHub Actions as the source, then run that workflow. Use the URL reported by a successful deployment; no live URL has been verified yet.

On iPhone, open the deployed HTTPS URL in Safari → Share → Add to Home Screen → Open as Web App (if shown) → Add. First open online and wait for the offline-ready message. Videos are not stored offline.

The workout content and feedback rules are an original starter plan. External sources do not endorse the app. No third-party video files are redistributed.
