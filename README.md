# Moodflik mobile app

Expo (React Native) app for Moodflik. Uses **bun** for everything; do not use npm, yarn or pnpm.

## Stack

- Expo SDK 58, Expo Router (file-based routing in `src/app`), TypeScript
- NativeWind v4 (Tailwind) for styling
- TanStack Query, DB and Form, with Zod
- API client and Zod schemas generated from the backend OpenAPI schema
- Tokens in `expo-secure-store`
- `bun fmt` for formatting, `oxlint` for linting

## Get started

1. Install dependencies

   ```bash
   bun install
   ```

2. Copy the env file and set your API URLs

   ```bash
   cp .env.example .env
   ```

3. Start the backend (`../backend`) and its Postgres and Redis containers

   ```bash
   docker compose -f ../backend/docker-compose.dev.yml up -d
   ```

4. Start the app

   ```bash
   bun run start
   ```

This app uses native modules (secure store, notifications, Giphy), so Expo Go is not enough. Use a development build:

```bash
bunx expo run:android        # local build, needs Android Studio and JDK 17
bunx eas-cli build --profile development --platform android   # cloud build
```

## Scripts

| Command | What it does |
| --- | --- |
| `bun run start` | Start the dev server |
| `bun run android` / `bun run ios` | Start and open on a device or emulator |
| `bun fmt` / `bun run fmt:check` | Format / check formatting |
| `bun run lint` | Lint with `oxlint --type-aware` |
| `bun run api:gen` | Regenerate the backend schema and the typed API client in `src/api/generated` |

Add Expo-compatible packages with `bunx expo install <package>`, not `bun add`.

## Typed API

The backend publishes an OpenAPI schema (`backend/openapi.yaml`). After changing a backend view or serializer, run `bun run api:gen` and commit the regenerated files in `src/api/generated`. Do not edit those files by hand.

## Layout

- `src/app`: routes (`(public)` for signed-out screens, `(app)` for signed-in screens)
- `src/api`: API client, per-domain hooks, and generated code
- `src/db`: TanStack DB collections
- `src/lib`: auth, secure storage, query client, forms
- `src/components`: shared UI and feature components
