import { Platform } from 'react-native';

type GiphyModule = typeof import('@giphy/react-native-sdk');

let sdk: GiphyModule | null = null;
let configured = false;

function apiKey() {
  const perPlatform =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_GIPHY_IOS_KEY
      : process.env.EXPO_PUBLIC_GIPHY_ANDROID_KEY;
  return perPlatform || process.env.EXPO_PUBLIC_GIPHY_API_KEY || '';
}

/**
 * Call once at startup. Returns true when GIFs are usable: a native platform, an SDK key, and the
 * native module present (it is missing in Expo Go and on web, so the require stays lazy).
 */
export function configureGiphy(): boolean {
  if (configured) return sdk !== null;
  configured = true;
  const key = apiKey();
  if (Platform.OS === 'web' || !key) return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@giphy/react-native-sdk') as GiphyModule;
    mod.GiphySDK.configure({ apiKey: key });
    sdk = mod;
    return true;
  } catch {
    sdk = null;
    return false;
  }
}

export const isGiphyAvailable = () => configureGiphy();

/** Opens the GIF picker; `onPick` gets the chosen GIF's URL. Returns a cleanup function. */
export function pickGif(onPick: (url: string) => void): () => void {
  if (!configureGiphy() || !sdk) return () => {};
  const { GiphyDialog, GiphyDialogEvent } = sdk;
  const picked = GiphyDialog.addListener(GiphyDialogEvent.MediaSelected, (e) => {
    const media = (
      e as { media: { url: string; data?: { images?: { original?: { url?: string } } } } }
    ).media;
    const url = media.data?.images?.original?.url || media.url;
    GiphyDialog.hide();
    if (url) onPick(url);
  });
  const dismissed = GiphyDialog.addListener(GiphyDialogEvent.Dismissed, () => {
    picked.remove();
    dismissed.remove();
  });
  GiphyDialog.show();
  return () => {
    picked.remove();
    dismissed.remove();
  };
}
