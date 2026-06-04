=== Atlas Run ===

A fitness exploration game. Walk Massachusetts, discover landmarks in Boston and Worcester, open treasure chests, complete quests, and level up.

Current release: v0.5.0-beta.

--- Android (primary app) ---

The full game is in mobile/ (Expo + React Native). This is your Android app (Expo Go for testing, EAS for APK/AAB on Play Store).

You do NOT need the Swift AtlasRun/ folder or Apple Developer ($99/yr) for Android.

| Goal | Guide |
|------|-------|
| Play on phone now (free) | mobile/ → npm install → npx expo start -c → Expo Go |
| Install standalone APK | mobile/ANDROID_BUILD.txt |
| Play Store release | mobile/ANDROID_BUILD.txt + STORE_SUBMIT NOT FOR PUBLIC.txt |

Quick start:

```powershell
cd mobile
npm install
npx expo start -c
```

Scan the QR in Expo Go. No account or API keys required for solo play.

--- iOS (same app as Android) ---

| Goal | Guide |
|------|-------|
| Test in Expo Go (Apple Maps) | Same quick start as Android above |
| Install/TestFlight build | mobile/IOS_BUILD.txt |
| Google Maps on iPhone | mobile/IOS_GOOGLE_MAPS.txt + EAS iOS build |

Requires Apple Developer ($99/year) for device/TestFlight/App Store builds. The Swift AtlasRun/ folder is an old prototype. Use mobile/ only.

--- Other paths ---

| Path | Stack |
|------|-------|
| supabase/ | Cloud save, friends, leaderboards (optional) |

Fog-of-war overlay darkens unrevealed map areas; walking clears fog in explored zones.

--- License ---

All rights reserved.
