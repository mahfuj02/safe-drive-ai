# SAFE DRIVE AI v2 Roadmap

Goal: make the app feel faster, more trustworthy, and more useful than a map while driving.

## Phase 1: Speed accuracy
- Show raw GPS speed immediately.
- Keep a smoothed display speed only if needed for UI stability.
- Reduce visible lag against the car odometer.
- Use GPS distance fallback when sensor speed is missing.

## Phase 2: Road detection confidence
- Detect road name, road class, and confidence.
- Show a clear fallback when the road cannot be identified.
- Prefer correct uncertainty over guessing.

## Phase 3: Speed-limit quality
- Improve live limit lookup reliability.
- Keep last known limit briefly during temporary lookup failure.
- Add a visible "limit uncertain" state when confidence is low.

## Phase 4: Better alerts
- Trigger warning earlier before the limit change is missed.
- Tune voice and vibration timing based on live-road tests.
- Add stronger red-alert feedback only when needed.

## Phase 5: Drive session intelligence
- Save per-drive metrics.
- Track false alerts, missed alerts, and unknown-road segments.
- Use this data to tune thresholds and lookup logic.

## Phase 6: Safer driver UX
- Keep the active driving screen minimal.
- Avoid map clutter while the car is moving.
- Make voice and haptics the primary interaction.

## Rule for future work
- Build one phase at a time.
- Test on real roads before moving to the next phase.
- Commit and push each small change.
