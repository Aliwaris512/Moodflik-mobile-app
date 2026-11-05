# Moodflik Expo

Expo Router recreation of the previous purple Moodflik mobile UI. The current theme uses purple `#6D0AC7`, green like content, red dislike content, light gray `#F2F2F2`, and Nunito/Lato typography.

## Run

```bash
bun install
bun run start
bun x tsc --noEmit
bun run lint
bun x expo-doctor
bun test
```

Routes live in `src/app/`. The dynamic route preserves the reference screen names through URL slugs such as `/home`, `/create-post`, `/comments`, `/profile`, `/direct-message`, and `/terms-conditions`.

## Data and native integrations

The UI currently uses typed mock repositories in `src/services/repositories.ts`; no API or credentials are connected. Auth sessions are persisted with `expo-secure-store`. Image selection uses `expo-image-picker`, with permission handling and local previews.

Remote push notification registration in `src/services/notifications.ts` requires a physical device and an Expo Development Build; remote notifications are unavailable in Expo Go on Android. QuickBlox, Giphy, OneSignal, and native video integrations are not connected yet and should be added behind the existing service interfaces. Configure native behavior through app config/plugins; do not edit generated `ios/` or `android/` folders.
