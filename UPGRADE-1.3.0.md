# FORM 28 — pace and audio

The movement demonstrations felt slow and the looped excerpts did not explain enough technique. This update gives moving demonstrations a brisk 1.25× default, keeps an Original 1× option, and adds fuller spoken guidance and optional music within the existing workout screen.

- The timer uses real elapsed time, independently of video speed. Workout duration, repetitions prescribed by the plan, readiness checks, progress and archives are unchanged.
- Held stretches, the kneeling plank and breathing remain at their original speed. The UI identifies these exceptions. Playback preserves voice pitch.
- “Explain the technique” reads the full written steps, cue and easier option. In a workout it pauses the clock and requires explicit resume. It is also available in exercise previews.
- Spoken explanations and interval cues use the device's synthetic English voice. They are not a recorded human coach. Original provider audio remains a separate choice; enabling it stops synthetic coaching to avoid overlapping voices.
- “Focus beat” is an original locally generated instrumental loop, off by default. Its volume is adjustable and lowers under coaching or provider sound. It stops on pause, exit, background, interruption and finish. It requires no download or subscription and works offline.
- Pace and audio preferences are included in backups; older backups still import. Nothing clears existing progress.

## Verification

Existing Node timing/storage, build, offline-cache, six browser scenarios, and all 18 real-video/preview release checks remain required. Added checks cover actual 1.25× media progression against the real-time clock, Original pace control, held-exercise exceptions, full instruction text with paused timing, a real Web Audio signal, volume, ducking, background cleanup, and backup restoration.

Browser speech uses a stub to verify text and lifecycle, not audible voice quality. Real iPhone audio mixing, the quality of its installed voice, screen-lock interruptions and listening comfort remain physical-device checks.

## Recorded narration research

No video source, exercise variant or reviewed excerpt was replaced. A complete verified replacement set with recorded coaching is still outstanding. Physitrack advertises professionally narrated, multi-angle demonstrations; coverage and licensing for this app need confirmation before replacing the catalogue. Mayo Clinic's modified-push-up lesson supplies an example of detailed spoken instruction but is not a verified in-app replacement. No paid service has been activated.

- https://www.physitrack.com/exercise-library
- https://www.mayoclinic.org/healthy-lifestyle/fitness/multimedia/modified-pushup/vid-20084674
