# GitHub validation evidence

- `browser-results.json`: all six Chromium/WebKit scenarios passed on macOS, commit ef97add870aba108035309a5e83719fe8edbd238, run 35104289642.
- `video-observations.json`: page opens, actual playback observations and sampled-frame review. The complete set of exact demonstrations is not verified.
- `offline-diagnostic.json`: independent service-worker control reproduces WebKit offline-emulation failure; control and app both load with the actual origin disconnected.
- `linux-browser-results.json`: earlier diagnostic run, retained with its real failures.

See the linked run in each file. These are recorded observations, not evidence of an HTTPS deployment or physical iPhone installation. Current runs and screenshot artifacts are available in GitHub Actions.
