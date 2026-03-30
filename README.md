# SAFE DRIVE AI (MVP v1)

SAFE DRIVE AI v1 is a mobile app MVP for real-time overspeed voice alerts.

Current MVP scope:
- Live GPS speed tracking
- Manual speed limit control (for testing)
- Voice alert when speed is above threshold for a sustained window
- Alert cooldown to reduce repeated warnings

## Tech Stack

- React Native (Expo, TypeScript)
- `expo-location` for speed updates
- `expo-speech` for voice alerts

## What You Need Installed

1. Node.js LTS
2. VS Code
3. Android Studio (Android SDK + emulator)
4. Expo Go on iPhone and/or Android
5. Git

## Run Locally

```bash
npm install
npm run start
```

Then in Expo Dev Tools:
- Press `i` only on macOS (simulator not available on Windows)
- Press `a` for Android emulator
- Scan QR with Expo Go on iPhone for iOS testing on real device

## iOS Testing from Windows

You can test with a real iPhone using Expo Go:
1. Laptop and iPhone on same Wi-Fi
2. Run `npm run start`
3. Scan QR in Expo Go

## Android Testing from Windows

1. Install Android Studio
2. Install Android SDK platform + emulator image
3. Create an AVD in Device Manager
4. Start emulator
5. Run `npm run android`

## Current Alert Rules

- Threshold: +8 km/h above speed limit
- Sustain window: 4 seconds
- Cooldown: 25 seconds

## Next Step for Winnipeg Free Speed Limits

Replace manual speed limit with a free local speed-limit dataset:
1. Extract Winnipeg roads and `maxspeed` from OpenStreetMap
2. Store a compact local dataset in the app
3. Match current GPS to nearest road segment
4. Use that segment speed limit in alert engine

## Notes

This app is an assistant only and may not always reflect legal posted speed limits. Always follow road signs and local traffic laws.
