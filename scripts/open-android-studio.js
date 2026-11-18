// Opens the generated android/ project in Android Studio (Windows/macOS/Linux).
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const project = path.resolve(__dirname, '..', 'android');
if (!fs.existsSync(project)) {
  console.error(
    'android/ not found. Run `bun run android:build` (or `bunx expo prebuild -p android`) first.',
  );
  process.exit(1);
}

const candidates = {
  win32: [
    'C:\\Program Files\\Android\\Android Studio\\bin\\studio64.exe',
    path.join(process.env.LOCALAPPDATA ?? '', 'Programs', 'Android Studio', 'bin', 'studio64.exe'),
  ],
  darwin: ['/Applications/Android Studio.app/Contents/MacOS/studio'],
  linux: ['/opt/android-studio/bin/studio.sh', '/usr/local/android-studio/bin/studio.sh'],
};
const studio = (candidates[process.platform] ?? []).find((p) => fs.existsSync(p));
if (!studio) {
  console.error(`Android Studio not found. Open this folder manually: ${project}`);
  process.exit(1);
}

spawn(studio, [project], { detached: true, stdio: 'ignore' }).unref();
console.log(`Opening ${project} in Android Studio`);
