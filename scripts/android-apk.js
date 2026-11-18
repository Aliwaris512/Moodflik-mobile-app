// Builds an Android APK/AAB for physical ARM phones (arm64-v8a) from the generated android/ project.
// Usage: node scripts/android-apk.js [debug|release|bundle]
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const modes = {
  debug: { task: 'app:assembleDebug', out: 'apk/debug/app-debug.apk' },
  release: { task: 'app:assembleRelease', out: 'apk/release/app-release.apk' },
  bundle: { task: 'app:bundleRelease', out: 'bundle/release/app-release.aab' },
};
const mode = modes[process.argv[2] ?? 'debug'];
if (!mode) {
  console.error(`Unknown mode "${process.argv[2]}". Use: ${Object.keys(modes).join(', ')}`);
  process.exit(1);
}

const cwd = path.resolve(__dirname, '..', 'android');
const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
const args = [mode.task, '-PreactNativeArchitectures=arm64-v8a', '-x', 'lint', '-x', 'test'];

const result = spawnSync(gradlew, args, { cwd, stdio: 'inherit', shell: true });
if (result.status === 0) {
  console.log(`\nOutput: ${path.join(cwd, 'app', 'build', 'outputs', mode.out)}`);
}
process.exit(result.status ?? 1);
