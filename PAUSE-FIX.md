# Pause input regression

A pause press can span one or more 200 ms timer updates. The control must preserve its icon and label nodes when its displayed action has not changed, so a press still has a valid target at release. The follow-along player owns its button label; the underlying timer should update the clock without writing an intermediate label into that button.

The browser regression holds real pointer presses on the pause icon and label across timer renders, verifies that their hit targets stay attached, and verifies that playback intent and the real workout clock stop. The provider audit also holds each real video pause press across a timer tick and records before/after media and clock observations.

All existing release checks remain required: no retries, skipped exercises or relaxed thresholds are introduced. Workout plans, stored progress, backup schema, video sources and demonstration speeds remain unchanged. Physical iPhone touch, installation and audio behavior still require a device check.
